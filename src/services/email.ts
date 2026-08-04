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

// Sent to the business owner (businesses.contact_email) the moment a visitor
// books through the public website's "Book" widget tab — mirrors the
// reference video's "New Appointment Booked" email.
export async function sendNewAppointmentOwnerEmail(opts: {
  to: string
  businessName: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
  serviceName?: string
  scheduledAt: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `New appointment booked — ${opts.clientName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background:#166534;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
          <p style="margin:0;font-size:18px;font-weight:600;">📅 New Appointment Booked</p>
          <p style="margin:4px 0 0;opacity:0.85;">${opts.businessName}</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
          <p>A new appointment has been booked. Here are the details:</p>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;">Client</td><td style="padding:6px 0;font-weight:600;">${opts.clientName}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Date &amp; Time</td><td style="padding:6px 0;font-weight:600;">${formatEmailDateTime(opts.scheduledAt)}</td></tr>
            ${opts.serviceName ? `<tr><td style="padding:6px 0;color:#6b7280;">Service</td><td style="padding:6px 0;font-weight:600;">${opts.serviceName}</td></tr>` : ''}
            ${opts.clientPhone ? `<tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;font-weight:600;">${opts.clientPhone}</td></tr>` : ''}
            ${opts.clientEmail ? `<tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;font-weight:600;">${opts.clientEmail}</td></tr>` : ''}
          </table>
          <p style="margin-top:20px;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/schedule" style="background:#166534;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">View in Dashboard →</a></p>
        </div>
      </div>
    `,
  })
}

// Sent to the client right after a public-site booking. Points to the
// unauthenticated /portal/[appointmentId] page so the client can revisit
// their booking details without an account — matches the reference video's
// "Viewing Confirmed" email + "View in Client Portal" button.
export async function sendPublicBookingConfirmationEmail(opts: {
  to: string
  clientName: string
  businessName: string
  serviceName?: string
  scheduledAt: string
  budget?: string
  businessAddress?: string
  businessPhone?: string
  businessContactEmail?: string
  appointmentId: string
}) {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/portal/${opts.appointmentId}`
  return sendEmail({
    to: opts.to,
    subject: `Viewing Confirmed — ${opts.businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background:#166534;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
          <p style="margin:0;font-size:18px;font-weight:600;">✓ Viewing Confirmed</p>
          <p style="margin:4px 0 0;opacity:0.85;">${opts.businessName}</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
          <p>Hi ${opts.clientName},</p>
          <p>Your ${opts.serviceName ?? 'viewing'} has been successfully booked. Here are your details:</p>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;">Date &amp; Time</td><td style="padding:6px 0;font-weight:600;">${formatEmailDateTime(opts.scheduledAt)}</td></tr>
            ${opts.serviceName ? `<tr><td style="padding:6px 0;color:#6b7280;">Property / Service</td><td style="padding:6px 0;font-weight:600;">${opts.serviceName}</td></tr>` : ''}
            ${opts.budget ? `<tr><td style="padding:6px 0;color:#6b7280;">Budget Range</td><td style="padding:6px 0;font-weight:600;">${opts.budget}</td></tr>` : ''}
            ${opts.businessAddress ? `<tr><td style="padding:6px 0;color:#6b7280;">Agency Location</td><td style="padding:6px 0;font-weight:600;">${opts.businessAddress}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#6b7280;">Contact</td><td style="padding:6px 0;font-weight:600;">${opts.businessPhone ?? ''} ${opts.businessContactEmail ? `· ${opts.businessContactEmail}` : ''}</td></tr>
          </table>
          <p style="margin:16px 0;color:#6b7280;font-size:13px;">If you need to reschedule or cancel, please contact us at least 24 hours in advance. You can also manage your viewings through our client portal.</p>
          <p><a href="${portalUrl}" style="background:#166534;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">View in Client Portal →</a></p>
        </div>
      </div>
    `,
  })
}


