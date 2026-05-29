import { redirect } from 'next/navigation'

export default async function ProfilePurchaseSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams
  const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''
  redirect(`/purchase-success${query}`)
}
