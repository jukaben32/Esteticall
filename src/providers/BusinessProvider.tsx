'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useBusinessStore } from '@/store/business'
import type { Business, BusinessSubscription } from '@/types'

interface BusinessContextValue {
  business: Business | null
  subscription: BusinessSubscription | null
}

const BusinessContext = createContext<BusinessContextValue>({
  business: null,
  subscription: null,
})

interface BusinessProviderProps {
  business: Business | null
  subscription: BusinessSubscription | null
  children: ReactNode
}

// Server components fetch the current business + subscription once (RLS-scoped
// to auth.uid()) and hand them down here so client components never need an
// extra round trip just to know which tenant they're rendering for.
export function BusinessProvider({ business, subscription, children }: BusinessProviderProps) {
  const setBusiness = useBusinessStore((s) => s.setBusiness)
  const setSubscription = useBusinessStore((s) => s.setSubscription)

  useEffect(() => {
    setBusiness(business)
    setSubscription(subscription)
  }, [business, subscription, setBusiness, setSubscription])

  return (
    <BusinessContext.Provider value={{ business, subscription }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  return useContext(BusinessContext)
}
