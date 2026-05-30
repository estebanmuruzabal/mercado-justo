import { isEmailConfigured } from '@/lib/notifications/email/config'
import { emailElement, sendEmail } from '@/lib/notifications/email/send'
import type { DeliveryResult } from '@/lib/notifications/channels/types'
import type { ModerationReportedPayload } from '@/lib/notifications/events/types'
import { ModerationAlertEmail } from '@/emails/moderation-alert'

import { getUserEmail } from './recipients'

export async function sendModerationAlertEmail(
  input: ModerationReportedPayload,
): Promise<DeliveryResult> {
  if (!isEmailConfigured()) return { delivered: false, reason: 'not_configured' }

  const email = await getUserEmail(input.userId)
  if (!email) return { delivered: false, reason: 'no_recipient' }

  return sendEmail({
    to: email,
    subject: `Acción requerida: ${input.entityTitle}`,
    react: emailElement(ModerationAlertEmail, {
      recipientName: 'Vendedor',
      entityType: input.entityType,
      entityTitle: input.entityTitle,
      reason: input.reason,
      actionUrl: input.actionUrl,
    }),
  })
}
