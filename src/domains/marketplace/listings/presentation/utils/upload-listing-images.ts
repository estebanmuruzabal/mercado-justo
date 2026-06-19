import { createClient } from '@/shared/database/supabase/client'

const STORE_ASSETS_BUCKET = 'store-assets'

export async function uploadListingImageFiles(listingId: string, files: File[]): Promise<string[]> {
  if (files.length === 0) return []

  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('No se pudo identificar el vendedor.')

  const uploaded: string[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/listings/${listingId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(STORE_ASSETS_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) throw error

    const { data } = supabase.storage.from(STORE_ASSETS_BUCKET).getPublicUrl(path)
    uploaded.push(data.publicUrl)
  }

  return uploaded
}
