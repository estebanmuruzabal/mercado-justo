import type { MotionProps } from 'framer-motion'

export const springSoft: MotionProps['transition'] = {
  type: 'spring',
  stiffness: 320,
  damping: 34,
  mass: 0.9,
}

export const springQuick: MotionProps['transition'] = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.8,
}

export const fadeInUp: MotionProps = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: springSoft,
}

