export interface Peer {
  nodeId: string;
  lastSeen: number;
  transport: "webrtc" | "qr" | "bundle";
}
