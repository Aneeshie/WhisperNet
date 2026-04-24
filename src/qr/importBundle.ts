import type { QRBundle } from "./schema";
import { mergeIncomingMessage } from "../sync/messageEngine";
import LZString from "lz-string";

export async function importBundle(payload: string) {
  const decompressed = LZString.decompressFromBase64(payload);
  
  if (!decompressed) {
    throw new Error("Failed to decompress QR payload");
  }

  const bundle = JSON.parse(decompressed) as QRBundle;

  if (bundle.version !== 1) {
    throw new Error("Unsupported bundle version");
  }

  for (const message of bundle.messages) {
    await mergeIncomingMessage(message);
  }

  return bundle.messages.length;
}
