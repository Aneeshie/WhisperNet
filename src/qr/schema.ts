import type { Message } from "@/types/message";

export interface QRBundle {
  version: 1;
  exportedAt: number;
  messages: Message[];
}
