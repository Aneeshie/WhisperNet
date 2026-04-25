import { strToU8, compressSync, decompressSync, strFromU8 } from "fflate";
import { getMessages } from "@/db/messages";
import type { Message } from "@/types/message";
import { useNetworkStore } from "@/store";
import { processIncomingMessage, getOnlinePeerCount } from "./mesh";
import { toast } from "sonner";

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

const pendingConnections = new Map<string, { pc: RTCPeerConnection, dc: RTCDataChannel }>();

// Step 1: Host generates an Offer
export async function generateHostOffer(): Promise<{ offer: string, offerId: string }> {
  const pc = new RTCPeerConnection({ 
    iceServers: [] // EMPTY — only gather local Wi-Fi IPs, internet-agnostic
  });
  activeOfflinePCs.push(pc);
  
  const dc = pc.createDataChannel("offline-mesh");
  activeOfflineDCs.push(dc);
  const offerId = Math.random().toString(36).substring(2, 10);
  pendingConnections.set(offerId, { pc, dc });

  pc.oniceconnectionstatechange = () => {
    console.log(`[Offline Mesh Host] ICE state: ${pc.iceConnectionState}`);
    if (pc.iceConnectionState === "failed") {
      toast.error("Offline Mesh: Connection failed. Devices might not be on the same Wi-Fi.");
    }
  };

  return new Promise((resolve, reject) => {
    pc.onicecandidate = (event) => {
      if (event.candidate === null) {
        if (pc.localDescription) {
          resolve({ offer: compressSDP(JSON.stringify(pc.localDescription)), offerId });
        } else {
          reject("No local description");
        }
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(reject);

    // With empty iceServers, local candidates are gathered near-instantly.
    // This timeout is just a safety net.
    setTimeout(() => {
      if (pc.iceGatheringState !== "complete") {
        if (pc.localDescription) {
          resolve({ offer: compressSDP(JSON.stringify(pc.localDescription)), offerId });
        } else {
          reject(new Error("Timeout: no local description available"));
        }
      }
    }, 3000);
  });
}

// Step 2: Joiner scans Offer and generates Answer
export async function processJoinerOfferAndGenerateAnswer(compressedOffer: string): Promise<string> {
  const offerDesc = JSON.parse(decompressSDP(compressedOffer));

  const pc = new RTCPeerConnection({ 
    iceServers: [] // EMPTY — only gather local Wi-Fi IPs, internet-agnostic
  });
  activeOfflinePCs.push(pc);

  pc.ondatachannel = (event) => {
    activeOfflineDCs.push(event.channel);
    setupOfflineDataChannel(event.channel);
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[Offline Mesh Joiner] ICE state: ${pc.iceConnectionState}`);
    if (pc.iceConnectionState === "failed") {
      toast.error("Offline Mesh: Connection failed. Devices might not be on the same Wi-Fi.");
    }
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
      if (pc.iceGatheringState !== "complete") {
        if (pc.localDescription) {
          resolve(compressSDP(JSON.stringify(pc.localDescription)));
        } else {
          reject(new Error("Timeout: no local description available"));
        }
      }
    }, 3000);
  });
}

// Step 3: Host scans Answer
export async function finalizeHostConnection(compressedAnswer: string, offerId: string): Promise<void> {
  const pending = pendingConnections.get(offerId);
  if (!pending) throw new Error(`No pending host connection for offerId ${offerId}`);

  const answerDesc = JSON.parse(decompressSDP(compressedAnswer));
  await pending.pc.setRemoteDescription(new RTCSessionDescription(answerDesc));

  setupOfflineDataChannel(pending.dc);
  pendingConnections.delete(offerId);
}

// Global array to prevent garbage collection of RTCPeerConnections and RTCDataChannels
const activeOfflinePCs: RTCPeerConnection[] = [];
const activeOfflineDCs: RTCDataChannel[] = [];

function setupOfflineDataChannel(dc: RTCDataChannel) {
  const id = Math.random().toString(36).substring(2, 9);

  const handleOpen = () => {
    if (offlineDataChannels.has(id)) return;
    console.log(`[Offline Mesh] Local tunnel established with ${id}`);
    offlineDataChannels.set(id, dc);
    useNetworkStore.getState().setPeerCount(getOnlinePeerCount() + offlineDataChannels.size);
    toast.success("Local backup tunnel ready. Connection will survive internet drops!");

    // Request sync
    try {
      dc.send(JSON.stringify({ type: "sync_req" }));
    } catch (err) {
      console.error("Failed to send sync_req", err);
    }
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
        // Send messages in small batches to avoid WebRTC DataChannel message size limits
        const BATCH_SIZE = 5;
        for (let i = 0; i < myMessages.length; i += BATCH_SIZE) {
          const batch = myMessages.slice(i, i + BATCH_SIZE);
          try {
            dc.send(JSON.stringify({ type: "sync_res", messages: batch }));
          } catch (err) {
            console.error("Failed to send sync_res batch", err);
          }
          // Sleep slightly to prevent buffer overflow on the DataChannel
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } else if (parsed.type === "sync_res") {
        for (const msg of parsed.messages) {
          await processIncomingMessage(msg, false); // DO NOT RELAY
        }
      } else if (parsed.type === "broadcast") {
        await processIncomingMessage(parsed.message, true); // RELAY
      }
    } catch (e) {
      console.error("[Offline Mesh] Parse error", e);
    }
  };

  dc.onclose = () => {
    console.log(`[Offline Mesh] DataChannel closed with ${id}`);
    offlineDataChannels.delete(id);
    useNetworkStore.getState().setPeerCount(getOnlinePeerCount() + offlineDataChannels.size);
    toast.warning("Local backup tunnel closed.");
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


