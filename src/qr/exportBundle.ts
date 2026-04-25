import { getMessages } from "../db/messages";
import type { QRBundle } from "./schema";
import LZString from "lz-string";

export async function exportBundle(limit?: number): Promise<string> {
  const messages = await getMessages();

  // Sort by newest first
  const sortedMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt);

  // Optionally limit to top N messages
  const selected = limit ? sortedMessages.slice(0, limit) : sortedMessages;

  const bundle: QRBundle = {
    version: 1,
    exportedAt: Date.now(),
    messages: selected,
  };

  const rawString = JSON.stringify(bundle);
  return LZString.compressToBase64(rawString);
}
