import { joinRoom } from "trystero";
import { getMessages, createMessage } from "@/db/messages";
import type { Message } from "@/types/message";
import { useUIStore } from "@/store";

const ROOM_ID = "whispernet-mesh-default-room";

// Trystero room instance
let room: any = null;

// Actions
let broadcastAction: any = null;
let syncRequestAction: any = null;
let syncResponseAction: any = null;

export function initMesh() {
  if (room) return;

  room = joinRoom({ appId: "whispernet-mesh" }, ROOM_ID);

  const [sendBroadcast, getBroadcast] = room.makeAction("broadcast");
  const [sendSyncReq, getSyncReq] = room.makeAction("sync_req");
  const [sendSyncRes, getSyncRes] = room.makeAction("sync_res");

  broadcastAction = sendBroadcast;
  syncRequestAction = sendSyncReq;
  syncResponseAction = sendSyncRes;

  room.onPeerJoin((peerId: string) => {
    console.log(`[Mesh] Peer joined: ${peerId}`);
    // Sync missing messages from this new peer
    // Tell them we want to sync
    sendSyncReq("ping", peerId);

    // Update peer count in store
    useUIStore.getState().addPeer();
  });

  room.onPeerLeave((peerId: string) => {
    console.log(`[Mesh] Peer left: ${peerId}`);
    useUIStore.getState().removePeer();
  });

  // Handle incoming broadcast messages
  getBroadcast(async (data: any, peerId: string) => {
    console.log(`[Mesh] Received broadcast from ${peerId}`, data);
    const msg = data as Message;
    await processIncomingMessage(msg);
  });

  // Handle sync requests: send all our messages back to the requesting peer
  getSyncReq(async (data: any, peerId: string) => {
    console.log(`[Mesh] Sync request from ${peerId}`);
    const myMessages = await getMessages();
    sendSyncRes(myMessages, peerId);
  });

  // Handle sync responses: process all messages received
  getSyncRes(async (data: any, peerId: string) => {
    console.log(`[Mesh] Sync response from ${peerId}`);
    const messages = data as Message[];
    for (const msg of messages) {
      await processIncomingMessage(msg);
    }
  });
}

export async function broadcastMessage(msg: Message) {
  if (!broadcastAction) return;

  // Create a copy to increment hop count for relay
  const relayMsg = { ...msg, hopCount: msg.hopCount + 1 };

  if (relayMsg.hopCount <= relayMsg.maxHopCount) {
    broadcastAction(relayMsg);
  }
}

async function processIncomingMessage(msg: Message) {
  // Check if we already have it to prevent infinite loops and duplicates
  const existing = await getMessages();
  if (existing.some((m) => m.id === msg.id)) {
    return; // Already seen, ignore
  }

  // Save to DB
  await createMessage(msg);

  // Update UI Store
  const updatedMessages = await getMessages();
  useUIStore.setState({ messages: updatedMessages });

  // Relay the message (Flooding algorithm)
  await broadcastMessage(msg);
}

export function leaveMesh() {
  if (room) {
    room.leave();
    room = null;
    useUIStore.getState().setPeerCount(0);
  }
}
