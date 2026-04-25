import type { QRBundle } from "./schema";
import { mergeIncomingMessage } from "../sync/messageEngine";
import LZString from "lz-string";
import { useSecurityStore } from "@/store";
import { decrypt, hmacVerify } from "@/privacy/crypto";
import { toast } from "sonner";

export async function importBundle(payload: string) {
  const decompressed = LZString.decompressFromBase64(payload);
  
  if (!decompressed) {
    throw new Error("Failed to decompress QR payload");
  }

  let jsonString = decompressed;

  // Check if the bundle is encrypted (prefixed with "ENC:")
  if (decompressed.startsWith("ENC:")) {
    const encKey = useSecurityStore.getState().encryptionKey;
    if (!encKey) {
      throw new Error("Bundle is encrypted but app is locked. Unlock first.");
    }
    try {
      jsonString = await decrypt(encKey, decompressed.slice(4));
    } catch {
      throw new Error("Failed to decrypt bundle. Wrong PIN or corrupted data.");
    }
  }

  const bundle = JSON.parse(jsonString) as QRBundle;

  if (bundle.version !== 1) {
    throw new Error("Unsupported bundle version");
  }

  // Verify HMAC integrity if present
  if (bundle.hmac) {
    const encKey = useSecurityStore.getState().encryptionKey;
    if (encKey) {
      const dataToVerify = JSON.stringify(bundle.messages);
      const isValid = await hmacVerify(encKey, dataToVerify, bundle.hmac);
      if (isValid) {
        toast.success("QR bundle integrity verified");
      } else {
        toast.warning("QR bundle HMAC mismatch — data may have been tampered with");
      }
    }
  }

  for (const message of bundle.messages) {
    await mergeIncomingMessage(message);
  }

  return bundle.messages.length;
}
