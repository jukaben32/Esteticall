import { Resend } from 'resend'

let resendClient: Resend | null = null
function getResend() {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

// RESEND_DEV_OVERRIDE_TO redirects every outgoing email to the developer's own
// inbox in non-production environments, so local testing never spams a real lead.
function resolveRecipient(to: string): string {
  if (process.env.NODE_ENV !== 'production' && process.env.RESEND_DEV_OVERRIDE_TO) {
    return process.env.RESEND_DEV_OVERRIDE_TO
  }
  return to
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const resend = getResend()
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
    to: resolveRecipient(opts.to),
    subject: opts.subject,
    html: opts.html,
  })
}

export async function sendAppointmentConfirmationEmail(opts: {
  to: string
  clientName: string
  businessName: string
  scheduledAt: string
  listingTitle?: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Your viewing with ${opts.businessName} is confirmed`,
    html: `
      <p>Hi ${opts.clientName},</p>
      <p>Your viewing${opts.listingTitle ? ` for <strong>${opts.listingTitle}</strong>` : ''}
      with <strong>${opts.businessName}</strong> is confirmed for
      <strong>${new Date(opts.scheduledAt).toLocaleString()}</strong>.</p>
      <p>See you then!</p>
    `,
  })
}

export async function sendNewLeadEmail(opts: {
  to: string
  clientName: string
  clientPhone?: string
  businessName: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `New lead: ${opts.clientName}`,
    html: `
      <p>Your AI agent just captured a new lead for ${opts.businessName}:</p>
      <p><strong>${opts.clientName}</strong>${opts.clientPhone ? ` · ${opts.clientPhone}` : ''}</p>
    `,
  })
}
