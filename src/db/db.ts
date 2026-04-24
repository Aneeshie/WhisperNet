import Dexie, { type Table } from "dexie";
import type { Message } from "../types/message";
import type { Peer } from "../types/peer";

class WhisperNetDB extends Dexie {
  messages!: Table<Message, string>;
  peers!: Table<Peer, string>;

  constructor() {
    super("WhisperNetDB");

    this.version(1).stores({
      messages: "id, type, createdAt, expiresAt, updatedAt",
      peers: "nodeId, lastSeen",
    });
  }
}

export const db = new WhisperNetDB();
