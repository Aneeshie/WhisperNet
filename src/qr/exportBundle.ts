import { getMessages } from "../db/messages";
import type { QRBundle } from "./schema";
import LZString from "lz-string";
import { useSecurityStore } from "@/store";
import { decrypt } from "@/privacy/crypto";

export async function exportBundle(limit?: number): Promise<string> {
  const messages = await getMessages();

  // Sort by newest first
  const sortedMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt);

  // Optionally limit to top N messages
  const selected = limit ? sortedMessages.slice(0, limit) : sortedMessages;

  // Decrypt any encrypted messages before export
  const encKey = useSecurityStore.getState().encryptionKey;
  const decryptedMessages = [];
  for (const msg of selected) {
    if (msg.encrypted && msg.content && encKey) {
      try {
        const decryptedContent = await decrypt(encKey, msg.content);
        decryptedMessages.push({ ...msg, content: decryptedContent, encrypted: false });
      } catch {
        decryptedMessages.push(msg); // keep as-is if decryption fails
      }
    } else {
      decryptedMessages.push(msg);
    }
  }

  const bundle: QRBundle = {
    version: 1,
    exportedAt: Date.now(),
    messages: decryptedMessages,
  };

  const rawString = JSON.stringify(bundle);
  return LZString.compressToBase64(rawString);
}
