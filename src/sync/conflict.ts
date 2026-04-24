import type { Message } from "../types/message";

//higher version wins, if tied -> newer timestamp wins
export function chooseWinningMessage(
  local: Message,
  incoming: Message,
): Message {
  if (incoming.version > local.version) return incoming;

  if (incoming.version < local.version) return local;

  if (incoming.updatedAt > local.updatedAt) return incoming;

  return local;
}
