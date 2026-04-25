import Peer, { type DataConnection } from "peerjs";
import { getMessages, createMessage } from "@/db/messages";
import type { Message } from "@/types/message";
import { useNetworkStore, useMessageStore, useSecurityStore } from "@/store";
import { verifySignature, getSignablePayload, encrypt } from "@/privacy/crypto";

let peer: Peer | null = null;
const connections = new Map<string, DataConnection>();

export function getOnlinePeerCount(): number {
  return connections.size;
}

const knownPeers = new Set<string>(JSON.parse(localStorage.getItem("whispernet_peers") || "[]"));

function saveKnownPeers() {
  localStorage.setItem("whispernet_peers", JSON.stringify(Array.from(knownPeers)));
}

const pendingConnections = new Set<string>();
let reconnectInterval: ReturnType<typeof setInterval> | null = null;

function startAutoReconnect() {
  if (reconnectInterval) clearInterval(reconnectInterval);
  reconnectInterval = setInterval(() => {
    if (!peer || peer.disconnected) return;
    
    // Clean up knownPeers: remove any obviously invalid IDs
    for (const targetId of knownPeers) {
      if (targetId.length < 4) {
        knownPeers.delete(targetId);
        saveKnownPeers();
      } else if (!connections.has(targetId) && !pendingConnections.has(targetId) && targetId !== peer.id) {
        connectToPeer(targetId, true);
      }
    }
  }, 5000);
}

function setupPeerEvents(p: Peer) {
  p.on("open", (id) => {
    console.log(`[Mesh] Connected to global signaling server. My ID: ${id}`);
    localStorage.setItem("whispernet_my_id", id);
    useNetworkStore.getState().setMyPeerId(id);
    startAutoReconnect();
  });

  p.on("connection", (conn) => {
    console.log(`[Mesh] Incoming connection from ${conn.peer}`);
    setupConnection(conn);
  });

  p.on("disconnected", () => {
    console.log("[Mesh] Disconnected from signaling server");
    if (peer && !peer.destroyed) {
      peer.reconnect();
    }
  });

  p.on("error", (err) => {
    if (err.type === "peer-unavailable") return; // Suppress auto-reconnect logs
    
    if (err.type === "unavailable-id") {
      console.warn("[Mesh] Saved ID is taken. Falling back to random ID.");
      localStorage.removeItem("whispernet_my_id");
      if (peer) {
        peer.destroy();
        peer = null;
      }
      initMesh(); // Retry without the saved ID
      return;
    }

    console.error("[Mesh] PeerJS Error:", err);
  });
}

function generateShortId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function initMesh() {
  if (peer) return;

  const savedId = localStorage.getItem("whispernet_my_id");
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" }
    ]
  };

  const idToUse = savedId || generateShortId();
  peer = new Peer(idToUse, { config });

  setupPeerEvents(peer);
}

import { toast } from "sonner";

export function connectToPeer(targetId: string, silent = false) {
  if (!peer) {
    if (!silent) {
      console.error("[Mesh] PeerJS not initialized");
      toast.error("Mesh is not ready yet.");
    }
    return;
  }
  
  if (connections.has(targetId) || pendingConnections.has(targetId) || targetId === peer.id) {
    return; // Already connected or trying to connect
  }

  if (!silent) {
    console.log(`[Mesh] Initiating connection to ${targetId}...`);
    toast.loading(`Dialing peer...`, { id: `dial-${targetId}` });
  }
  
  pendingConnections.add(targetId);
  const conn = peer.connect(targetId, {
    reliable: true,
  });

  // Automatically remove from pending after a timeout so it doesn't get stuck forever
  setTimeout(() => {
    pendingConnections.delete(targetId);
    if (!silent && !connections.has(targetId)) {
      toast.error(`Connection timed out. The peer might be offline or their ID changed.`, { id: `dial-${targetId}` });
    }
  }, 10000);

  setupConnection(conn);
}

function setupConnection(conn: DataConnection) {
  conn.on("open", async () => {
    pendingConnections.delete(conn.peer);
    toast.success(`Connected to Peer!`, { id: `dial-${conn.peer}` });
    console.log(`[Mesh] DataChannel open with ${conn.peer}`);
    connections.set(conn.peer, conn);
    useNetworkStore.getState().setPeerCount(getOnlinePeerCount() + offlineDataChannels.size);

    knownPeers.add(conn.peer);
    saveKnownPeers();

    // Request sync from this new peer
    conn.send(JSON.stringify({ type: "sync_req" }));

    // --- SILENT OFFLINE TUNNEL BOOTSTRAPPING ---
    const myId = useNetworkStore.getState().myPeerId;
    if (myId && myId > conn.peer) {
      try {
        console.log(`[Offline Mesh] Bootstrapping silent host tunnel for ${conn.peer}...`);
        const result = await generateHostOffer();
        conn.send(JSON.stringify({ type: "silent_offer", offer: result.offer, offerId: result.offerId }));
      } catch (e) {
        console.error("[Offline Mesh] Failed to bootstrap silent tunnel", e);
      }
    }
  });

  conn.on("data", async (data: unknown) => {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data as string) : data;

      if (!parsed || typeof parsed !== "object") return;
      const dataObj = parsed as Record<string, unknown>;

      if (dataObj.type === "sync_req") {
        const myMessages = await getMessages();
        const BATCH_SIZE = 5;
        for (let i = 0; i < myMessages.length; i += BATCH_SIZE) {
          const batch = myMessages.slice(i, i + BATCH_SIZE);
          try {
            conn.send(JSON.stringify({ type: "sync_res", messages: batch }));
          } catch (err) {
            console.error(`[Mesh] Failed to send sync_res batch ${i}`, err);
          }
          await new Promise(r => setTimeout(r, 50));
        }
      } else if (dataObj.type === "sync_res") {
        for (const msg of dataObj.messages as Message[]) {
          await processIncomingMessage(msg, false); // DO NOT RELAY historical sync
        }
      } else if (dataObj.type === "broadcast") {
        await processIncomingMessage(dataObj.message as Message, true);
      } else if (dataObj.type === "silent_offer") {
        console.log(`[Offline Mesh] Received silent offer from ${conn.peer}, generating answer...`);
        const answer = await processJoinerOfferAndGenerateAnswer(dataObj.offer as string);
        conn.send(JSON.stringify({ type: "silent_answer", answer, offerId: dataObj.offerId }));
      } else if (dataObj.type === "silent_answer") {
        console.log(`[Offline Mesh] Received silent answer from ${conn.peer}, finalizing tunnel...`);
        await finalizeHostConnection(dataObj.answer as string, dataObj.offerId as string);
      }
    } catch (e) {
      console.error("[Mesh] Failed to process incoming data", e);
    }
  });

  conn.on("close", () => {
    pendingConnections.delete(conn.peer);
    console.log(`[Mesh] DataChannel closed with ${conn.peer}`);
    connections.delete(conn.peer);
    useNetworkStore.getState().setPeerCount(connections.size);
  });

  conn.on("error", (err) => {
    pendingConnections.delete(conn.peer);
    console.error(`[Mesh] Connection error with ${conn.peer}:`, err);
  });
}

import {
  broadcastOfflineMessage,
  generateHostOffer,
  processJoinerOfferAndGenerateAnswer,
  finalizeHostConnection,
  offlineDataChannels
} from "./offlineMesh";

// In-memory cache for instant synchronous deduplication to prevent async race conditions
const seenMessageIds = new Set<string>();

export async function broadcastMessage(msg: Message) {
  const relayMsg = { ...msg, hopCount: msg.hopCount + 1 };

  if (relayMsg.hopCount <= relayMsg.maxHopCount) {
    const payload = JSON.stringify({ type: "broadcast", message: relayMsg });
    for (const conn of connections.values()) {
      if (conn.open) {
        conn.send(payload);
      }
    }
    await broadcastOfflineMessage(msg);
  }
}

export async function processIncomingMessage(msg: Message, shouldRelay: boolean = true) {
  // 1. Synchronous dedup (prevents async race conditions during massive network floods)
  if (seenMessageIds.has(msg.id)) return;
  seenMessageIds.add(msg.id);

  // 2. Database dedup (just to be safe)
  const existing = await getMessages();
  if (existing.some((m) => m.id === msg.id)) {
    return;
  }

  // 3. Verify signature if present
  if (msg.signature && msg.senderPublicKey) {
    const payload = getSignablePayload(msg);
    const isValid = await verifySignature(msg.senderPublicKey, payload, msg.signature);
    msg.trusted = isValid;
  } else {
    // No signature = untrusted
    msg.trusted = false;
  }

  // 4. Encrypt content before storing, keep plaintext for UI + relay
  const plaintextContent = msg.content;
  try {
    const encKey = useSecurityStore.getState().encryptionKey;
    if (encKey) {
      const storageMsg = { ...msg };
      storageMsg.content = await encrypt(encKey, msg.content);
      storageMsg.encrypted = true;
      await createMessage(storageMsg);
    } else {
      await createMessage(msg);
    }
    // Keep plaintext in memory for the UI
    msg.encrypted = false;
    existing.push(msg);
    useMessageStore.setState({ messages: [...existing] });
  } catch (e) {
    console.error("Failed to save incoming message", e);
    return;
  }
  
  // 5. Relay the plaintext message (WebRTC handles transit encryption)
  msg.content = plaintextContent;
  if (shouldRelay) {
    await broadcastMessage(msg);
  }
}

export function leaveMesh() {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  connections.clear();
  useNetworkStore.getState().setPeerCount(0);
  useNetworkStore.getState().setMyPeerId("");
}
