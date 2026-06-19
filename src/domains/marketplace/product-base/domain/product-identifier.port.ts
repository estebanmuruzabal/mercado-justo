export type ImageIdentificationInput = {
  buffer: Buffer
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
}

export type ProductIdentificationCandidate = {
  name: string
  confidence: number
}

export interface ProductIdentifierPort {
  identify(input: ImageIdentificationInput): Promise<ProductIdentificationCandidate[]>
}
