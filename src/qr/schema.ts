import type { Message } from "@/types/message";

export interface QRBundle {
  version: 1;
  exportedAt: number;
  messages: Message[];
  hmac?: string;       // HMAC-SHA256 integrity hash (proves bundle wasn't tampered)
  encrypted?: boolean; // Whether the bundle payload is AES-encrypted
}
