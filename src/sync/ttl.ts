import { deleteExpiredMessages } from "../db/messages";

import { useMessageStore } from "../store";

export async function runTTLPass() {
  const deletedCount = await deleteExpiredMessages();
  if (deletedCount > 0) {
    console.log(`[TTL] Cleaned up ${deletedCount} expired messages`);
    useMessageStore.getState().fetchMessages();
  }
}
