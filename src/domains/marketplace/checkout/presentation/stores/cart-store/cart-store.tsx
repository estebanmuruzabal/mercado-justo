'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

import type { CartItem, CartListingType, CartState } from './cart-types'
import { loadCartStateFromLocalStorage, persistCartStateToLocalStorage } from '@/domains/marketplace/checkout/presentation/stores/cart-store/storage'
import { calcCartTotals, makeCartItemId } from './cart-types'
import { createClient } from '@/shared/database/supabase/client'
import {
  clearServerCart,
  getServerCartLines,
  removeServerCartLine,
  upsertServerCartLine,
} from '@/domains/marketplace/transaction/application/actions/cart.actions'

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; payload: { listingType: CartListingType; variantId: string } }
  | { type: 'SET_QUANTITY'; payload: { listingType: CartListingType; variantId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; payload: CartState }

const CartStoreContext = createContext<{
  items: CartItem[]
  itemCount: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (listingType: CartListingType, variantId: string) => void
  setQuantity: (listingType: CartListingType, variantId: string, quantity: number) => void
  clearCart: () => void
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const nextId = makeCartItemId(action.payload.listingType, action.payload.variantId)
      const existing = state.items.find((i) => i.id === nextId)

      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === nextId ? { ...i, quantity: i.quantity + action.payload.quantity } : i
          ),
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
      const id = makeCartItemId(action.payload.listingType, action.payload.variantId)
      return { ...state, items: state.items.filter((i) => i.id !== id) }
    }

    case 'SET_QUANTITY': {
      const id = makeCartItemId(action.payload.listingType, action.payload.variantId)
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

    case 'HYDRATE':
      return action.payload

    default:
      return state
  }
}

async function syncItemToServer(item: CartItem): Promise<void> {
  if (item.listingType !== 'product') return
  await upsertServerCartLine({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    titleSnapshot: item.title,
  })
}

export function CartStoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
    return loadCartStateFromLocalStorage()
  })
  const totals = useMemo(() => calcCartTotals(state.items), [state.items])
  const userIdRef = useRef<string | null>(null)

  const hydratedRef = useRef(false)
  useEffect(() => {
    hydratedRef.current = true
  }, [])

  useEffect(() => {
    let cancelled = false
    async function hydrateFromServer() {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      userIdRef.current = data.user?.id ?? null
      if (!data.user) return

      const lines = await getServerCartLines()
      if (cancelled || lines.length === 0) return

      dispatch({
        type: 'HYDRATE',
        payload: {
          items: lines
            .filter((line) => line.variantId)
            .map((line) => ({
              id: makeCartItemId('product', line.variantId!),
              listingType: 'product' as const,
              variantId: line.variantId!,
              storeId: '',
              title: line.titleSnapshot,
              image: '',
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
        },
      })
    }
    void hydrateFromServer()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      userIdRef.current = session?.user?.id ?? null
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!hydratedRef.current) return
    if (typeof window === 'undefined') return
    if (!userIdRef.current) {
      persistCartStateToLocalStorage(state)
    }
  }, [state])

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
    if (userIdRef.current && item.listingType === 'product') {
      const nextId = makeCartItemId(item.listingType, item.variantId)
      const existing = state.items.find((i) => i.id === nextId)
      const quantity = existing ? existing.quantity + item.quantity : item.quantity
      void syncItemToServer({ ...item, id: nextId, quantity })
    }
  }, [state.items])

  const removeItem = useCallback((listingType: CartListingType, variantId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { listingType, variantId } })
    if (userIdRef.current && listingType === 'product') {
      void removeServerCartLine(variantId)
    }
  }, [])

  const setQuantity = useCallback(
    (listingType: CartListingType, variantId: string, quantity: number) => {
      dispatch({ type: 'SET_QUANTITY', payload: { listingType, variantId, quantity } })
      if (!userIdRef.current || listingType !== 'product') return
      if (quantity <= 0) {
        void removeServerCartLine(variantId)
        return
      }
      const item = state.items.find((i) => i.variantId === variantId && i.listingType === 'product')
      if (item) {
        void syncItemToServer({ ...item, quantity })
      }
    },
    [state.items]
  )

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
    if (userIdRef.current) {
      void clearServerCart()
    }
  }, [])

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
