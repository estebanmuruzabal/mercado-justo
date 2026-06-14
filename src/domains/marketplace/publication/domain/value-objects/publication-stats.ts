export type PublicationStatsSnapshot = {
  viewCount: number
  followerCount: number
  reviewCount: number
  ratingAvg: number
}

export const EMPTY_STATS: PublicationStatsSnapshot = {
  viewCount: 0,
  followerCount: 0,
  reviewCount: 0,
  ratingAvg: 0,
}
