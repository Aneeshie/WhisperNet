import { create } from "zustand";
import { toast } from "sonner";
import type { Message } from "@/types/message";
import { createMessage, getMessages } from "@/db/messages";

interface UIState {
  isNavigating: boolean;
  setNavigating: (state: boolean) => void;
  messages: Message[];
  fetchMessages: () => Promise<void>;
  addMessage: (msg: Message) => Promise<void>;
}

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  setNavigating: (state) => set({ isNavigating: state }),
  messages: [],
  fetchMessages: async () => {
    try {
      const dbMessages = await getMessages();
      set({ messages: dbMessages });
    } catch (error) {
      console.error("Failed to fetch messages from DB:", error);
      toast.error("Database Error: Failed to fetch messages");
    }
  },
  addMessage: async (msg) => {
    try {
      await createMessage(msg);
      toast.success("Message persisted to local mesh DB");

      // Re-fetch to ensure store and DB are perfectly in sync
      const dbMessages = await getMessages();
      set({ messages: dbMessages });
    } catch (error) {
      console.error("Failed to save message to DB:", error);
      toast.error("Database Error: Failed to save message");
    }
  },
}));
