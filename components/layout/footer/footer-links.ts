import {
  CATEGORIES_PATH,
  CONTACT_PATH,
  HELP_PATH,
  HOME_PATH,
  PRIVACY_PATH,
  STORES_PATH,
  TERMS_PATH,
} from '@/lib/routes'

export type FooterLink = {
  label: string
  href: string
}

export const FOOTER_NAV_LINKS: FooterLink[] = [
  { label: 'Inicio', href: HOME_PATH },
  { label: 'Tiendas', href: STORES_PATH },
  { label: 'Categorías', href: CATEGORIES_PATH },
  { label: 'Ayuda', href: HELP_PATH },
  { label: 'Términos y condiciones', href: TERMS_PATH },
  { label: 'Política de privacidad', href: PRIVACY_PATH },
  { label: 'Contacto', href: CONTACT_PATH },
]
