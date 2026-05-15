import { create } from 'zustand'
import { format } from 'date-fns'

interface UIState {
  selectedDate: string        // ISO "YYYY-MM-DD"
  setSelectedDate: (date: string) => void
  carryForwardVisible: boolean
  showCarryForward: () => void
  hideCarryForward: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setSelectedDate: (date) => set({ selectedDate: date }),
  carryForwardVisible: false,
  showCarryForward: () => set({ carryForwardVisible: true }),
  hideCarryForward: () => set({ carryForwardVisible: false }),
}))
