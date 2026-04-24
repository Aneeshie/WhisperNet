import { create } from 'zustand';

interface UIState {
  isNavigating: boolean;
  setNavigating: (state: boolean) => void;
  // Placeholder for future backend integrations from Aneesh
}

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  setNavigating: (state) => set({ isNavigating: state }),
}));
