import { create } from 'zustand'

interface AppState {
  count: number
  increaseCount: () => void
  resetCount: () => void
  isReady: boolean
  toggleReady: () => void
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increaseCount: () => set((state) => ({ count: state.count + 1 })),
  resetCount: () => set({ count: 0 }),
  isReady: true,
  toggleReady: () => set((state) => ({ isReady: !state.isReady })),
}))
