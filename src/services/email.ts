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

function formatEmailDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'full',
    timeStyle: 'short',
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
    subject: `Tu cita con ${opts.businessName} fue confirmada`,
    html: `
      <p>Hola ${opts.clientName},</p>
      <p>Tu cita${opts.listingTitle ? ` para <strong>${opts.listingTitle}</strong>` : ''}
      con <strong>${opts.businessName}</strong> quedó confirmada para el
      <strong>${formatEmailDateTime(opts.scheduledAt)}</strong>.</p>
      <p>¡Te esperamos!</p>
    `,
  })
}

export async function sendAppointmentCompletedEmail(opts: {
  to: string
  clientName: string
  businessName: string
  listingTitle?: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Tu cita con ${opts.businessName} fue completada`,
    html: `
      <p>Hola ${opts.clientName},</p>
      <p>Tu cita${opts.listingTitle ? ` para <strong>${opts.listingTitle}</strong>` : ''}
      con <strong>${opts.businessName}</strong> se marcó como completada. Gracias por tu tiempo,
      esperamos poder ayudarte pronto con el siguiente paso.</p>
    `,
  })
}

export async function sendAppointmentCancelledEmail(opts: {
  to: string
  clientName: string
  businessName: string
  scheduledAt: string
  listingTitle?: string
  reason?: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Tu cita con ${opts.businessName} fue cancelada`,
    html: `
      <p>Hola ${opts.clientName},</p>
      <p>Tu cita${opts.listingTitle ? ` para <strong>${opts.listingTitle}</strong>` : ''}
      con <strong>${opts.businessName}</strong>, programada para el
      <strong>${formatEmailDateTime(opts.scheduledAt)}</strong>, fue cancelada.</p>
      ${opts.reason ? `<p>Motivo: ${opts.reason}</p>` : ''}
      <p>Si deseas reagendar, contáctanos cuando gustes.</p>
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
    subject: `Nuevo lead: ${opts.clientName}`,
    html: `
      <p>Tu agente de IA acaba de captar un nuevo lead para ${opts.businessName}:</p>
      <p><strong>${opts.clientName}</strong>${opts.clientPhone ? ` · ${opts.clientPhone}` : ''}</p>
    `,
  })
}
