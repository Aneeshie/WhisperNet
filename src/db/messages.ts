import type { Message } from "../types/message";
import { db } from "./db";

export async function createMessage(message: Message) {
  await db.messages.put(message);
}

export async function getMessages() {
  return db.messages.orderBy("createdAt").reverse().toArray();
}

export async function deleteExpiredMessages(): Promise<number> {
  const now = Date.now();

  const expired = await db.messages
    .filter((msg) => msg.expiresAt !== undefined && msg.expiresAt < now)
    .toArray();

  if (expired.length > 0) {
    const keys = expired.map(msg => msg.id);
    await db.messages.bulkDelete(keys);
  }
  
  return expired.length;
}
