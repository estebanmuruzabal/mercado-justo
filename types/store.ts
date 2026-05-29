export type StoreMode = 'online' | 'physical'
export type StorePlan = 'free'

export interface Store {
  id: string
  name: string
  slug: string | null
  bio: string | null
  bannerUrl: string | null
  logoUrl: string | null
  allowFollowers: boolean
  followerCount: number
  reviewCount: number
  ratingAvg: number
  instagram: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  mode: StoreMode
  plan: StorePlan
  productLimit: number
  termsAccepted: boolean
  termsAcceptedAt: string | null
  createdAt: string
}

export interface CreateStoreInput {
  name: string
  slug?: string | null
  bio?: string | null
  bannerUrl?: string | null
  logoUrl?: string | null
  allowFollowers?: boolean
  address?: string | null
  instagram?: string | null
  latitude?: number | null
  longitude?: number | null
  mode?: StoreMode
}

export interface StoreActionSuccess {
  success: true
  store: Store | null
}

export interface StoreActionError {
  success: false
  error: string
}

export type StoreActionResult = StoreActionSuccess | StoreActionError

