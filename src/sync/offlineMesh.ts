import { strToU8, compressSync, decompressSync, strFromU8 } from "fflate";
import { getMessages } from "@/db/messages";
import type { Message } from "@/types/message";
import { useUIStore } from "@/store";
import { processIncomingMessage } from "./mesh";

export const offlineDataChannels = new Map<string, RTCDataChannel>();

export function compressSDP(sdp: string): string {
  const u8 = strToU8(sdp);
  const compressed = compressSync(u8, { level: 9 });
  let binary = "";
  for (let i = 0; i < compressed.byteLength; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary);
}

export function decompressSDP(b64: string): string {
  const binary = atob(b64);
  const compressed = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    compressed[i] = binary.charCodeAt(i);
  }
  const decompressed = decompressSync(compressed);
  return strFromU8(decompressed);
}

// ----------------------------------------------------
// OFFLINE MESH LOGIC
// ----------------------------------------------------

let pendingPc: RTCPeerConnection | null = null;
let pendingDc: RTCDataChannel | null = null;

// Step 1: Host generates an Offer
export async function generateHostOffer(): Promise<string> {
  const pc = new RTCPeerConnection({ iceServers: [] }); // 100% offline
  activeOfflinePCs.push(pc);
  pendingPc = pc;

  const dc = pc.createDataChannel("offline-mesh");
  pendingDc = dc;

  return new Promise((resolve, reject) => {
    pc.onicecandidate = (event) => {
      // When ICE gathering is completely finished, the localDescription contains all local IPs
      if (event.candidate === null) {
        if (pc.localDescription) {
          resolve(compressSDP(JSON.stringify(pc.localDescription)));
        } else {
          reject("No local description");
        }
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(reject);

    // Timeout fallback just in case ICE gathering hangs
    setTimeout(() => {
      if (pc.iceGatheringState !== "complete" && pc.localDescription) {
        resolve(compressSDP(JSON.stringify(pc.localDescription)));
      }
    }, 2000);
  });
}

// Step 2: Joiner scans Offer and generates Answer
export async function processJoinerOfferAndGenerateAnswer(compressedOffer: string): Promise<string> {
  const offerDesc = JSON.parse(decompressSDP(compressedOffer));

  const pc = new RTCPeerConnection({ iceServers: [] });
  activeOfflinePCs.push(pc);

  pc.ondatachannel = (event) => {
    setupOfflineDataChannel(event.channel);
  };

  return new Promise((resolve, reject) => {
    pc.onicecandidate = (event) => {
      if (event.candidate === null) {
        if (pc.localDescription) {
          resolve(compressSDP(JSON.stringify(pc.localDescription)));
        } else {
          reject("No local description");
        }
      }
    };

    pc.setRemoteDescription(new RTCSessionDescription(offerDesc))
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .catch(reject);

    setTimeout(() => {
      if (pc.iceGatheringState !== "complete" && pc.localDescription) {
        resolve(compressSDP(JSON.stringify(pc.localDescription)));
      }
    }, 2000);
  });
}

// Step 3: Host scans Answer
export async function finalizeHostConnection(compressedAnswer: string): Promise<void> {
  if (!pendingPc) throw new Error("No pending host connection");

  const answerDesc = JSON.parse(decompressSDP(compressedAnswer));
  await pendingPc.setRemoteDescription(new RTCSessionDescription(answerDesc));

  if (pendingDc) {
    setupOfflineDataChannel(pendingDc);
  }

  // DO NOT set pendingPc to null, we must keep the reference so it doesn't get GC'd.
  // Instead, just clear pendingDc so it's not reused.
  pendingDc = null;
}

// Global array to prevent garbage collection of RTCPeerConnections
const activeOfflinePCs: RTCPeerConnection[] = [];

function setupOfflineDataChannel(dc: RTCDataChannel) {
  const id = Math.random().toString(36).substring(2, 9);

  const handleOpen = () => {
    if (offlineDataChannels.has(id)) return;
    console.log(`[Offline Mesh] DataChannel open with ${id}`);
    offlineDataChannels.set(id, dc);
    useUIStore.getState().setPeerCount(useUIStore.getState().peerCount + 1);

    // Request sync
    dc.send(JSON.stringify({ type: "sync_req" }));
  };

  if (dc.readyState === "open") {
    handleOpen();
  } else {
    dc.onopen = handleOpen;
  }

  dc.onmessage = async (event) => {
    try {
      const parsed = JSON.parse(event.data);

      if (parsed.type === "sync_req") {
        const myMessages = await getMessages();
        dc.send(JSON.stringify({ type: "sync_res", messages: myMessages }));
      } else if (parsed.type === "sync_res") {
        for (const msg of parsed.messages) {
          processIncomingMessage(msg, false); // DO NOT RELAY
        }
      } else if (parsed.type === "broadcast") {
        processIncomingMessage(parsed.message, true); // RELAY
      }
    } catch (e) {
      console.error("[Offline Mesh] Parse error", e);
    }
  };

  dc.onclose = () => {
    console.log(`[Offline Mesh] DataChannel closed with ${id}`);
    offlineDataChannels.delete(id);
    useUIStore.getState().setPeerCount(Math.max(0, useUIStore.getState().peerCount - 1));
  };
}

export async function broadcastOfflineMessage(msg: Message) {
  const relayMsg = { ...msg, hopCount: msg.hopCount + 1 };

  if (relayMsg.hopCount <= relayMsg.maxHopCount) {
    const payload = JSON.stringify({ type: "broadcast", message: relayMsg });
    for (const dc of offlineDataChannels.values()) {
      if (dc.readyState === "open") {
        dc.send(payload);
      }
    }
  }
}


