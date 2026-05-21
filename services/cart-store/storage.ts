import type { CartPersistenceV1, CartState } from '@/lib/listing'
import { CART_STORAGE_KEY, CART_TTL_MS } from '@/lib/listing'

const EMPTY_CART_STATE: CartState = { items: [] }

export function loadCartStateFromLocalStorage(): CartState {
  if (typeof window === 'undefined') return EMPTY_CART_STATE

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return EMPTY_CART_STATE

    const parsed = JSON.parse(raw) as Partial<CartPersistenceV1> & { state?: CartState }

    if (!parsed?.state || parsed.version !== 3) return EMPTY_CART_STATE

    const expired = Date.now() - (parsed.lastUpdatedAt ?? 0) > CART_TTL_MS
    if (expired) {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      return EMPTY_CART_STATE
    }

    return parsed.state
  } catch {
    // If localStorage is corrupted, ignore it.
    return EMPTY_CART_STATE
  }
}

export function persistCartStateToLocalStorage(state: CartState): void {
  if (typeof window === 'undefined') return

  if (state.items.length === 0) {
    window.localStorage.removeItem(CART_STORAGE_KEY)
    return
  }

  const payload: CartPersistenceV1 = {
    state,
    lastUpdatedAt: Date.now(),
    version: 3,
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload))
}

