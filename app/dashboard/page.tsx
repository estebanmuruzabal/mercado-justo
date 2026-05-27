import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Keep a single source of truth for the vendor UI.
  redirect('/dashboard/listings')
}

