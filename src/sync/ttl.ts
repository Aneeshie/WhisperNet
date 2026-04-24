import { deleteExpiredMessages } from "../db/messages";

export async function runTTLPass() {
  await deleteExpiredMessages();
}
