'use client'

import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react'

import type { CartItem, CartListingType } from './cart-types'
import { calcCartTotals, makeCartItemId } from './cart-types'

type CartState = {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; payload: { listingType: CartListingType; listingId: string } }
  | { type: 'SET_QUANTITY'; payload: { listingType: CartListingType; listingId: string; quantity: number } }
  | { type: 'CLEAR_CART' }

const CartStoreContext = createContext<{
  items: CartItem[]
  itemCount: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (listingType: CartListingType, listingId: string) => void
  setQuantity: (listingType: CartListingType, listingId: string, quantity: number) => void
  clearCart: () => void
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const nextId = makeCartItemId(action.payload.listingType, action.payload.listingId)
      const existing = state.items.find((i) => i.id === nextId)

      if (existing) {
        return {
          ...state,
          items: state.items.map((i) => (i.id === nextId ? { ...i, quantity: i.quantity + 1 } : i)),
        }
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            id: nextId,
            ...action.payload,
          },
        ],
      }
    }

    case 'REMOVE_ITEM': {
      const id = makeCartItemId(action.payload.listingType, action.payload.listingId)
      return { ...state, items: state.items.filter((i) => i.id !== id) }
    }

    case 'SET_QUANTITY': {
      const id = makeCartItemId(action.payload.listingType, action.payload.listingId)
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== id) }
      }

      return {
        ...state,
        items: state.items.map((i) => (i.id === id ? { ...i, quantity: action.payload.quantity } : i)),
      }
    }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    default:
      return state
  }
}

export function CartStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const totals = useMemo(() => calcCartTotals(state.items), [state.items])

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }, [])

  const removeItem = useCallback((listingType: CartListingType, listingId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { listingType, listingId } })
  }, [])

  const setQuantity = useCallback(
    (listingType: CartListingType, listingId: string, quantity: number) => {
      dispatch({ type: 'SET_QUANTITY', payload: { listingType, listingId, quantity } })
    },
    []
  )

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])

  const value = useMemo(
    () => ({
      items: state.items,
      itemCount: totals.itemCount,
      totalPrice: totals.totalPrice,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [state.items, totals.itemCount, totals.totalPrice, addItem, removeItem, setQuantity, clearCart]
  )

  return <CartStoreContext.Provider value={value}>{children}</CartStoreContext.Provider>
}

export function useCartStore() {
  const ctx = useContext(CartStoreContext)
  if (!ctx) throw new Error('useCartStore must be used within CartStoreProvider')
  return ctx
}

