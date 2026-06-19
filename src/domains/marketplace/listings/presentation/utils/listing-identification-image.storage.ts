const STORAGE_KEY = 'mj:listing-identification-image'

export type StoredIdentificationImage = {
  name: string
  type: string
  size: number
  dataUrl: string
  origin: 'product-base-identification'
  productBaseId: string | null
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export async function saveIdentificationImage(file: File, productBaseId: string | null = null): Promise<void> {
  const dataUrl = await fileToDataUrl(file)
  const payload: StoredIdentificationImage = {
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl,
    origin: 'product-base-identification',
    productBaseId,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function loadIdentificationImage(): StoredIdentificationImage | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredIdentificationImage
    if (parsed.origin !== 'product-base-identification' || !parsed.dataUrl) return null
    return parsed
  } catch {
    return null
  }
}

export function clearIdentificationImageStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function attachProductBaseToIdentificationImage(productBaseId: string): void {
  const stored = loadIdentificationImage()
  if (!stored) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, productBaseId }))
}

export async function dataUrlToFile(stored: StoredIdentificationImage): Promise<File> {
  const response = await fetch(stored.dataUrl)
  const blob = await response.blob()
  return new File([blob], stored.name, { type: stored.type })
}
