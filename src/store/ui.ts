import { create } from 'zustand'
import { localDateStr } from '../utils/date'

interface UIState {
  selectedDate: string        // ISO "YYYY-MM-DD"
  setSelectedDate: (date: string) => void
  carryForwardVisible: boolean
  showCarryForward: () => void
  hideCarryForward: () => void
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: localDateStr(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  carryForwardVisible: false,
  showCarryForward: () => set({ carryForwardVisible: true }),
  hideCarryForward: () => set({ carryForwardVisible: false }),
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
}))
