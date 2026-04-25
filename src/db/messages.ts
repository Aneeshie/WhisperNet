import type { Message } from "../types/message";
import { db } from "./db";
import { useSecurityStore } from "@/store";
import { decrypt } from "@/privacy/crypto";

export async function createMessage(message: Message) {
  await db.messages.put(message);
}

export async function getMessages() {
  return db.messages.orderBy("createdAt").reverse().toArray();
}

/**
 * Get messages decrypted and ready for network transmission.
 * Use this when sending messages to peers (sync_req responses, etc.)
 * NOT for local UI display (use store.fetchMessages for that).
 */
export async function getDecryptedMessages(): Promise<Message[]> {
  const messages = await getMessages();
  const encKey = useSecurityStore.getState().encryptionKey;

  if (!encKey) return messages;

  const decrypted: Message[] = [];
  for (const msg of messages) {
    if (msg.encrypted && msg.content) {
      try {
        const plainContent = await decrypt(encKey, msg.content);
        decrypted.push({ ...msg, content: plainContent, encrypted: false });
      } catch {
        // Skip messages we can't decrypt
        decrypted.push(msg);
      }
    } else {
      decrypted.push(msg);
    }
  }
  return decrypted;
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
