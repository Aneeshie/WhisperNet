import { getMessages } from "../db/messages";
import type { QRBundle } from "./schema";

export async function exportBundle(): Promise<string> {
  const messages = await getMessages();

  const bundle: QRBundle = {
    version: 1,
    exportedAt: Date.now(),
    messages,
  };

  return JSON.stringify(bundle);
}
