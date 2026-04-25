import Peer, { type DataConnection } from "peerjs";
import { getMessages, createMessage } from "@/db/messages";
import type { Message } from "@/types/message";
import { useNetworkStore, useMessageStore } from "@/store";

let peer: Peer | null = null;
const connections = new Map<string, DataConnection>();

export function initMesh() {
  if (peer) return;

  // Initialize PeerJS with the free public cloud signaling server
  peer = new Peer({
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
      ]
    }
  });

  peer.on("open", (id) => {
    console.log(`[Mesh] Connected to global signaling server. My ID: ${id}`);
    useNetworkStore.getState().setMyPeerId(id);
  });

  peer.on("connection", (conn) => {
    console.log(`[Mesh] Incoming connection from ${conn.peer}`);
    setupConnection(conn);
  });

  peer.on("disconnected", () => {
    console.log("[Mesh] Disconnected from signaling server");
    // Try to reconnect to signaling server
    if (peer && !peer.destroyed) {
      peer.reconnect();
    }
  });

  peer.on("error", (err) => {
    console.error("[Mesh] PeerJS Error:", err);
  });
}

export function connectToPeer(targetId: string) {
  if (!peer) {
    console.error("[Mesh] PeerJS not initialized");
    return;
  }
  
  if (connections.has(targetId) || targetId === peer.id) {
    return; // Already connected or trying to connect to self
  }

  console.log(`[Mesh] Initiating connection to ${targetId}...`);
  const conn = peer.connect(targetId, {
    reliable: true,
  });

  setupConnection(conn);
}

function setupConnection(conn: DataConnection) {
  conn.on("open", () => {
    console.log(`[Mesh] DataChannel open with ${conn.peer}`);
    connections.set(conn.peer, conn);
    useNetworkStore.getState().setPeerCount(connections.size);

    // Request sync from this new peer
    conn.send(JSON.stringify({ type: "sync_req" }));
  });

  conn.on("data", async (data: unknown) => {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data as string) : data;

      if ((parsed as any).type === "sync_req") {
        const myMessages = await getMessages();
        const BATCH_SIZE = 5;
        for (let i = 0; i < myMessages.length; i += BATCH_SIZE) {
          const batch = myMessages.slice(i, i + BATCH_SIZE);
          conn.send(JSON.stringify({ type: "sync_res", messages: batch }));
          await new Promise(r => setTimeout(r, 50));
        }
      } else if ((parsed as any).type === "sync_res") {
        for (const msg of (parsed as any).messages) {
          await processIncomingMessage(msg, false); // DO NOT RELAY historical sync
        }
      } else if ((parsed as any).type === "broadcast") {
        await processIncomingMessage((parsed as any).message, true);
      }
    } catch (e) {
      console.error("[Mesh] Failed to process incoming data", e);
    }
  });

  conn.on("close", () => {
    console.log(`[Mesh] DataChannel closed with ${conn.peer}`);
    connections.delete(conn.peer);
    useNetworkStore.getState().setPeerCount(connections.size);
  });

  conn.on("error", (err) => {
    console.error(`[Mesh] Connection error with ${conn.peer}:`, err);
  });
}

import { broadcastOfflineMessage } from "./offlineMesh";

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

  // 3. Save and update UI
  await createMessage(msg);
  useMessageStore.setState({ messages: await getMessages() });
  
  // 4. Relay the message (Flooding algorithm)
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
