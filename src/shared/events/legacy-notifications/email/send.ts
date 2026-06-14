// Server-only: single chokepoint for all operational email delivery.
import type { ReactElement } from 'react'
import { jsx } from 'react/jsx-runtime'

import { getEnvironmentBadge } from '@/shared/config/environment'
import type { DeliveryResult } from '@/shared/events/legacy-notifications/channels/types'

import { getResendClient } from './client'
import { getFromEmail, getReplyToEmail, isEmailConfigured } from './config'

export type SendEmailParams = {
  to: string | string[]
  subject: string
  react: ReactElement
}

/**
 * Send an operational email via Resend.
 *
 * Never throws — returns a structured result for fire-and-forget contexts
 * (`after()`, background jobs). Non-production subjects are prefixed with the
 * environment badge.
 */
export async function sendEmail(params: SendEmailParams): Promise<DeliveryResult> {
  if (!isEmailConfigured()) {
    return { delivered: false, reason: 'not_configured' }
  }

  const to = Array.isArray(params.to) ? params.to : [params.to]
  if (to.length === 0 || !to.every(Boolean)) {
    return { delivered: false, reason: 'no_recipient' }
  }

  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: `${getEnvironmentBadge()}${params.subject}`,
      react: params.react,
      ...(getReplyToEmail() ? { replyTo: getReplyToEmail() } : {}),
    })

    if (error) {
      console.error('[email] send failed:', error.message)
      return { delivered: false, reason: error.message }
    }

    return { delivered: true, id: data?.id }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown'
    console.error('[email] send failed:', reason)
    return { delivered: false, reason }
  }
}

/** Helper for .ts service files that cannot use JSX syntax directly. */
export function emailElement<P extends object>(
  Component: (props: P) => ReactElement,
  props: P,
): ReactElement {
  return jsx(Component, props)
}
