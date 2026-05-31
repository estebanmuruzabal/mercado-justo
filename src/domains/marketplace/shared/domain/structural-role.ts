export const STRUCTURAL_ROLES = ['root', 'child'] as const

export type StructuralRole = (typeof STRUCTURAL_ROLES)[number]

/** Maps legacy publication.kind values to StructuralRole during Strangler migration. */
export function structuralRoleFromLegacyKind(kind: string | null | undefined): StructuralRole {
  if (kind === 'variant' || kind === 'child') return 'child'
  return 'root'
}

export function isRootPublication(role: StructuralRole): boolean {
  return role === 'root'
}
