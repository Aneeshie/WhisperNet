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
}
