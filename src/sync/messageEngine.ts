import { v4 as uuid } from "uuid";
import type { Message, MessageType, Priority } from "../types/message";
import { createMessage } from "../db/messages";
import { db } from "@/db/db";

type GenerateMessageInput = {
  type: MessageType;
  content: string;
  priority?: Priority;
  expiresInMs?: number;
  regionTag?: string;
};

export async function generateMessage(
  input: GenerateMessageInput,
): Promise<Message> {
  const now = Date.now();

  const message: Message = {
    id: uuid(),
    type: input.type,
    content: input.content,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + (input.expiresInMs ?? 1000 * 60 * 60 * 6),
    priority: input.priority ?? "medium",
    version: 1,
    hopCount: 0,
    maxHopCount: 5,
    regionTag: input.regionTag,
  };

  await createMessage(message);

  return message;
}

export async function updateExistingMessage(
  id: string,
  updates: Partial<Pick<Message, "content" | "priority" | "regionTag">>,
) {
  const existing = await db.messages.get(id);

  if (!existing) return null;

  const updated: Message = {
    ...existing,
    ...updates,
    version: existing.version + 1,
    updatedAt: Date.now(),
  };

  await db.messages.put(updated);

  return updated;
}
