import { getMessages } from "../db/messages";
import type { QRBundle } from "./schema";
import LZString from "lz-string";

export async function exportBundle(): Promise<string> {
  const messages = await getMessages();

  // Sort by newest first and drastically limit to top 5 messages 
  // Optical scanners (especially webcams) cannot resolve QR codes denser than ~500 bytes reliably
  const sortedMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt);
  const slicedMessages = sortedMessages.slice(0, 5);

  const bundle: QRBundle = {
    version: 1,
    exportedAt: Date.now(),
    messages: slicedMessages,
  };

  const rawString = JSON.stringify(bundle);
  return LZString.compressToBase64(rawString);
}
