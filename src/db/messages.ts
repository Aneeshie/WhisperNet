import type { Message } from "../types/message";
import { db } from "./db";

export async function createMessage(message: Message) {
  await db.messages.put(message);
}

export async function getMessages() {
  return db.messages.orderBy("createdAt").reverse().toArray();
}

export async function deleteExpiredMessages() {
  const now = Date.now();

  const expired = await db.messages
    .filter((msg) => msg.expiresAt < now)
    .toArray();

  for (const msg of expired) {
    await db.messages.delete(msg.id);
  }
}
