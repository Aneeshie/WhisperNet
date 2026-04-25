import { getMessages } from "../db/messages";
import type { QRBundle } from "./schema";
import LZString from "lz-string";

export async function exportBundle(): Promise<string> {
  const messages = await getMessages();

  // Sort by newest first. We no longer need to slice because the Animated QR Chunking 
  // system handles infinitely large payloads by dynamically splitting them.
  const sortedMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt);

  const bundle: QRBundle = {
    version: 1,
    exportedAt: Date.now(),
    messages: sortedMessages,
  };

  const rawString = JSON.stringify(bundle);
  return LZString.compressToBase64(rawString);
}
