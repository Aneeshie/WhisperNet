export type MessageType = "alert" | "news" | "route" | "resource";

export type Priority = "high" | "medium" | "low";

export interface Message {
  id: string;
  type: MessageType;
  priority: Priority;
  content: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  version: number;
  hopCount: number;
  maxHopCount: number;
  regionTag?: string;
  trusted?: boolean;

  // Crypto fields
  signature?: string;        // ECDSA signature over id:content:createdAt
  senderPublicKey?: string;  // Sender's exported ECDSA public key (base64)
  encrypted?: boolean;       // Whether content is AES-encrypted at rest
}
