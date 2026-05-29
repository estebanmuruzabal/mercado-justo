'use client'

import { useCallback } from 'react'

import { useLocationContext } from '@/components/location/location-context'
import { useLocationStore } from '@/stores/location.store'

export function useRequireReceiveMode() {
  const mode = useLocationStore((s) => s.mode)
  const { openReceiveModeChoice } = useLocationContext()

  const hasReceiveMode = mode !== null

  const promptReceiveMode = useCallback(() => {
    openReceiveModeChoice()
  }, [openReceiveModeChoice])

  const guardReceiveMode = useCallback(
    (action: () => void) => {
      if (!hasReceiveMode) {
        promptReceiveMode()
        return false
      }
      action()
      return true
    },
    [hasReceiveMode, promptReceiveMode],
  )

  return { hasReceiveMode, promptReceiveMode, guardReceiveMode }
}
