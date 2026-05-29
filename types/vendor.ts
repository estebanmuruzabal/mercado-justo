import type { StoreMode } from '@/types/store'

export interface VendorProfile {
  id: string
  slug: string
  name: string
  bio: string | null
  bannerUrl: string | null
  logoUrl: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  instagram: string | null
  mode: StoreMode
  allowFollowers: boolean
  followerCount: number
  reviewCount: number
  ratingAvg: number
  createdAt: string
}

export interface VendorReview {
  id: string
  authorId: string
  authorName: string | null
  authorAvatarUrl: string | null
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface VendorReviewsPage {
  reviews: VendorReview[]
  total: number
}

export interface VendorCategory {
  id: string
  name: string
  count: number
}

export interface ViewerVendorState {
  isAuthenticated: boolean
  isOwner: boolean
  isFollowing: boolean
  myReview: VendorReview | null
}
