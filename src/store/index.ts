import { create } from "zustand";
import { toast } from "sonner";
import type { Message } from "@/types/message";
import { createMessage, getMessages } from "@/db/messages";
import { broadcastMessage } from "@/sync/mesh";

interface UIState {
  isNavigating: boolean;
  setNavigating: (state: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  setNavigating: (state) => set({ isNavigating: state }),
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
      await createMessage(msg);
      toast.success("Message persisted to local mesh DB");

      // Broadcast to WebRTC peers
      await broadcastMessage(msg);

      // Re-fetch to ensure store and DB are perfectly in sync
      const dbMessages = await getMessages();
      set({ messages: dbMessages });
    } catch (error) {
      console.error("Failed to save message to DB:", error);
      toast.error("Database Error: Failed to save message");
    }
  },
}));
