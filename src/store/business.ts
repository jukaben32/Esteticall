import { create } from 'zustand'
import type { Business, BusinessSubscription } from '@/types'

interface BusinessState {
  business: Business | null
  subscription: BusinessSubscription | null
  setBusiness: (business: Business | null) => void
  setSubscription: (subscription: BusinessSubscription | null) => void
}

export const useBusinessStore = create<BusinessState>((set) => ({
  business: null,
  subscription: null,
  setBusiness: (business) => set({ business }),
  setSubscription: (subscription) => set({ subscription }),
}))
