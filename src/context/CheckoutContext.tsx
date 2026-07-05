'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type CheckoutSession, type Game, type GameProduct } from '@/types'

interface CheckoutContextType {
  session: CheckoutSession | null
  setSession: (session: CheckoutSession | null) => void
  updateSession: (updates: Partial<CheckoutSession>) => void
  clearSession: () => void
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<CheckoutSession | null>(null)

  const setSession = useCallback((newSession: CheckoutSession | null) => {
    setSessionState(newSession)
  }, [])

  const updateSession = useCallback((updates: Partial<CheckoutSession>) => {
    setSessionState((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
  }, [])

  const clearSession = useCallback(() => {
    setSessionState(null)
  }, [])

  return (
    <CheckoutContext.Provider value={{ session, setSession, updateSession, clearSession }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}

// Checkout Session Factory
export function createCheckoutSession(
  game: Game,
  product: GameProduct,
  userGameId: string,
  serverId?: string
): CheckoutSession {
  return {
    gameId: game.id,
    gameSlug: game.slug,
    gameName: game.name,
    productId: product.id,
    productName: product.label,
    productPrice: product.price,
    userGameId,
    serverId,
    subtotal: product.price,
    discount: 0,
    total: product.price,
    step: 'identify',
  }
}
