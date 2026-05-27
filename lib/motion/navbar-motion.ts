import type { Variants } from 'framer-motion'
import { springSoft, springQuick } from './transitions'

export const overlayVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
}

export const drawerVariants: Variants = {
  closed: { x: '20%', opacity: 0 },
  open: {
    x: '0%',
    opacity: 1,
    transition: springQuick,
  },
}

export const tabUnderlineVariants: Variants = {
  inactive: { scaleX: 0, opacity: 0 },
  active: {
    scaleX: 1,
    opacity: 1,
    transition: springSoft,
  },
}

export const tabLabelVariants: Variants = {
  inactive: { opacity: 0.75 },
  active: { opacity: 1, transition: springSoft },
}

