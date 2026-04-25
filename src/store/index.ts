import { create } from "zustand";
import { toast } from "sonner";
import type { Message } from "@/types/message";
import { createMessage, getMessages } from "@/db/messages";
import { broadcastMessage } from "@/sync/mesh";
import {
  hashPin,
  verifyPin,
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  signData,
  getSignablePayload,
  deriveEncryptionKey,
} from "@/privacy/crypto";

interface UIState {
  isNavigating: boolean;
  setNavigating: (state: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  setNavigating: (state) => set({ isNavigating: state }),
}));

interface SecurityState {
  isUnlocked: boolean;
  isFirstTime: boolean;
  publicKey: string | null;    // Base64 ECDSA public key
  encryptionKey: CryptoKey | null; // AES key derived from PIN (in-memory only)
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  setPin: (newPin: string) => Promise<void>;
  completeSetup: (pin: string) => Promise<void>;
  getPrivateKey: () => Promise<CryptoKey | null>;
  getPublicKey: () => string | null;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isUnlocked: false,
  isFirstTime: !localStorage.getItem("whispernet_pin_hash"),
  publicKey: localStorage.getItem("whispernet_public_key"),
  encryptionKey: null,

  unlock: async (pin: string) => {
    const storedHash = localStorage.getItem("whispernet_pin_hash");
    const storedSalt = localStorage.getItem("whispernet_pin_salt");

    if (!storedHash || !storedSalt) return false;

    const isValid = await verifyPin(pin, storedHash, storedSalt);
    if (isValid) {
      // Derive AES encryption key from PIN
      const encKey = await deriveEncryptionKey(pin, storedSalt);
      set({ isUnlocked: true, encryptionKey: encKey });
      return true;
    }
    return false;
  },

  lock: () => set({ isUnlocked: false, encryptionKey: null }),

  setPin: async (newPin: string) => {
    const { hash, salt } = await hashPin(newPin);
    localStorage.setItem("whispernet_pin_hash", hash);
    localStorage.setItem("whispernet_pin_salt", salt);
    const encKey = await deriveEncryptionKey(newPin, salt);
    set({ encryptionKey: encKey });
  },

  completeSetup: async (pin: string) => {
    // 1. Hash & store PIN
    const { hash, salt } = await hashPin(pin);
    localStorage.setItem("whispernet_pin_hash", hash);
    localStorage.setItem("whispernet_pin_salt", salt);

    // 2. Generate ECDSA key pair
    const keyPair = await generateKeyPair();
    const pubKeyB64 = await exportPublicKey(keyPair.publicKey);
    const privKeyJwk = await exportPrivateKey(keyPair.privateKey);

    localStorage.setItem("whispernet_public_key", pubKeyB64);
    localStorage.setItem("whispernet_private_key", privKeyJwk);

    // 3. Derive AES encryption key
    const encKey = await deriveEncryptionKey(pin, salt);

    set({
      isFirstTime: false,
      isUnlocked: true,
      publicKey: pubKeyB64,
      encryptionKey: encKey,
    });
  },

  getPrivateKey: async () => {
    const jwkString = localStorage.getItem("whispernet_private_key");
    if (!jwkString) return null;
    try {
      return await importPrivateKey(jwkString);
    } catch {
      return null;
    }
  },

  getPublicKey: () => {
    return get().publicKey || localStorage.getItem("whispernet_public_key");
  },
}));

interface NetworkState {
  peerCount: number;
  myPeerId: string | null;
  setPeerCount: (count: number) => void;
  setMyPeerId: (id: string) => void;
  addPeer: () => void;
  removePeer: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  peerCount: 0,
  myPeerId: null,
  setPeerCount: (count) => set({ peerCount: count }),
  setMyPeerId: (id) => set({ myPeerId: id }),
  addPeer: () => set({ peerCount: get().peerCount + 1 }),
  removePeer: () => set({ peerCount: Math.max(0, get().peerCount - 1) }),
}));

interface MessageState {
  messages: Message[];
  fetchMessages: () => Promise<void>;
  addMessage: (msg: Message) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  fetchMessages: async () => {
    try {
      const dbMessages = await getMessages();
      set({ messages: dbMessages });
    } catch (error) {
      console.error("Failed to fetch messages from DB:", error);
      toast.error("Database Error: Failed to fetch messages");
    }
  },
  addMessage: async (msg) => {
    try {
      // Sign the message before saving
      const securityStore = useSecurityStore.getState();
      const privateKey = await securityStore.getPrivateKey();
      const publicKey = securityStore.getPublicKey();

      if (privateKey && publicKey) {
        const payload = getSignablePayload(msg);
        const signature = await signData(privateKey, payload);
        msg.signature = signature;
        msg.senderPublicKey = publicKey;
      }

      await createMessage(msg);

      set((state) => ({ messages: [...state.messages, msg] }));
      toast.success("Message signed & saved");

      try {
        await broadcastMessage(msg);
      } catch (broadcastErr) {
        console.error("Failed to broadcast message:", broadcastErr);
        toast.error("Message saved, but failed to broadcast to peers");
      }
    } catch (error) {
      console.error("Failed to save message to DB:", error);
      toast.error("Database Error: Failed to save message");
      throw error;
    }
  },
}));
