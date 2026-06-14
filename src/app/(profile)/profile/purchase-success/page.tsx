import { redirect } from 'next/navigation'

export default async function ProfilePurchaseSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; orderIds?: string }>
}) {
  const { orderId, orderIds } = await searchParams
  const params = new URLSearchParams()
  if (orderId) params.set('orderId', orderId)
  if (orderIds) params.set('orderIds', orderIds)
  const query = params.toString() ? `?${params.toString()}` : ''
  redirect(`/purchase-success${query}`)
}
