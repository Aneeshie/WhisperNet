import type { QRBundle } from "./schema";
import { mergeIncomingMessage } from "../sync/messageEngine";

export async function importBundle(payload: string) {
  const bundle = JSON.parse(payload) as QRBundle;

  if (bundle.version !== 1) {
    throw new Error("Unsupported bundle version");
  }

  for (const message of bundle.messages) {
    await mergeIncomingMessage(message);
  }

  return bundle.messages.length;
}
