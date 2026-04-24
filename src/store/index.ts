import { create } from 'zustand';
import type { Message } from '@/types/message';

interface UIState {
  isNavigating: boolean;
  setNavigating: (state: boolean) => void;
  messages: Message[];
  addMessage: (msg: Message) => void;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_f1a2b3c4',
    type: 'alert',
    priority: 'high',
    content: 'Evacuation order for Sector 7. Proceed to designated safe zones immediately.',
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now() - 3600000,
    expiresAt: Date.now() + 43200000, // +12 hours
    version: 1,
    hopCount: 3,
    maxHopCount: 10,
    trusted: true
  },
  {
    id: 'msg_d5e6f7g8',
    type: 'route',
    priority: 'medium',
    content: 'Highway 9 is blocked by debris. Take the scenic route via Old Mill Road.',
    createdAt: Date.now() - 7200000, // 2 hours ago
    updatedAt: Date.now() - 7200000,
    expiresAt: Date.now() + 86400000, // +24 hours
    version: 1,
    hopCount: 1,
    maxHopCount: 5,
    trusted: false
  },
  {
    id: 'msg_h9i0j1k2',
    type: 'news',
    priority: 'low',
    content: 'Water distribution at Central Plaza starting at 08:00 AM tomorrow.',
    createdAt: Date.now() - 14400000, // 4 hours ago
    updatedAt: Date.now() - 14400000,
    expiresAt: Date.now() + 172800000, // +48 hours
    version: 1,
    hopCount: 5,
    maxHopCount: 15,
    trusted: true
  }
];

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  setNavigating: (state) => set({ isNavigating: state }),
  messages: MOCK_MESSAGES,
  addMessage: (msg) => set((state) => ({ messages: [msg, ...state.messages] }))
}));
