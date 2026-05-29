'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { publicVendorPath } from '@/lib/routes'

export type FollowActionResult =
  | { success: true; following: boolean; followerCount: number }
  | { success: false; error: string }

async function readFollowerCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
): Promise<number> {
  const { data } = await supabase
    .from('store')
    .select('follower_count')
    .eq('id', storeId)
    .maybeSingle()
  return (data as { follower_count: number } | null)?.follower_count ?? 0
}

export async function followVendorAction(input: {
  storeId: string
  slug: string
}): Promise<FollowActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Iniciá sesión para seguir esta tienda.' }
    if (user.id === input.storeId) {
      return { success: false, error: 'No podés seguir tu propia tienda.' }
    }

    const { data: store } = await supabase
      .from('store')
      .select('allow_followers')
      .eq('id', input.storeId)
      .maybeSingle()

    if (!store) return { success: false, error: 'Tienda no encontrada.' }
    if (!(store as { allow_followers: boolean }).allow_followers) {
      return { success: false, error: 'Esta tienda no acepta seguidores.' }
    }

    const { error } = await supabase
      .from('vendor_follower')
      .insert({ store_id: input.storeId, follower_id: user.id } as never)

    // 23505 = unique_violation -> already following, treat as success.
    if (error && (error as { code?: string }).code !== '23505') throw error

    revalidatePath(publicVendorPath(input.slug))
    return { success: true, following: true, followerCount: await readFollowerCount(supabase, input.storeId) }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo seguir la tienda.' }
  }
}

export async function unfollowVendorAction(input: {
  storeId: string
  slug: string
}): Promise<FollowActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Iniciá sesión para gestionar tus seguimientos.' }

    const { error } = await supabase
      .from('vendor_follower')
      .delete()
      .eq('store_id', input.storeId)
      .eq('follower_id', user.id)

    if (error) throw error

    revalidatePath(publicVendorPath(input.slug))
    return { success: true, following: false, followerCount: await readFollowerCount(supabase, input.storeId) }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo dejar de seguir.' }
  }
}
