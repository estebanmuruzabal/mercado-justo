import { redirect } from 'next/navigation'

import { ADMIN_DITTOBOT_PRODUCTS_PATH } from '@/shared/routing/routes'

export default function AdminDittoBotsIndexPage() {
  redirect(ADMIN_DITTOBOT_PRODUCTS_PATH)
}
