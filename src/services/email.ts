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
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
    to: resolveRecipient(opts.to),
    subject: opts.subject,
    html: opts.html,
  })
  // Resend's SDK resolves (doesn't throw) on API-level failures — e.g. an
  // unverified "from" domain, or sending to an address other than the
  // account owner's while still in sandbox mode — leaving result.error set
  // instead. Callers fire-and-forget these (`.catch(() => {})` / `void`) so
  // a booking never fails just because the notification email did; without
  // this log, that kind of failure is invisible everywhere, including here.
  if (result.error) {
    console.error(`[email] Resend rejected "${opts.subject}" to ${opts.to}:`, result.error)
    throw new Error(result.error.message)
  }
  return result
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

// Sent to the business when the client cancels through the Client Portal —
// the cancel route also inserts an in-app `notifications` row for the
// dashboard bell, but that alone doesn't reach an inbox, and every other
// client-initiated action (booking, reschedule) already emails the owner.
export async function sendAppointmentCancelledOwnerEmail(opts: {
  to: string
  businessName: string
  clientName: string
  scheduledAt: string
  listingTitle?: string
  reason?: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Cita cancelada por el cliente — ${opts.clientName}`,
    html: `
      <p><strong>${opts.clientName}</strong> canceló su cita con <strong>${opts.businessName}</strong>${
      opts.listingTitle ? ` para <strong>${opts.listingTitle}</strong>` : ''
    }, programada para el <strong>${formatEmailDateTime(opts.scheduledAt)}</strong>.</p>
      ${opts.reason ? `<p>Motivo: ${opts.reason}</p>` : ''}
    `,
  })
}

// Sent to the client right after they mark an appointment as paid (cash or
// online) through the Client Portal.
export async function sendAppointmentPaidClientEmail(opts: {
  to: string
  clientName: string
  businessName: string
  method: 'cash' | 'card'
  amount: number
  scheduledAt: string
}) {
  const methodLabel = opts.method === 'cash' ? 'en efectivo, en la agencia' : 'en línea con tarjeta'
  return sendEmail({
    to: opts.to,
    subject: `Pago registrado — ${opts.businessName}`,
    html: `
      <p>Hola ${opts.clientName},</p>
      <p>Registramos tu pago de <strong>$${opts.amount.toLocaleString()}</strong> (${methodLabel}) para tu cita con
      <strong>${opts.businessName}</strong> del <strong>${formatEmailDateTime(opts.scheduledAt)}</strong>.</p>
      <p>¡Gracias!</p>
    `,
  })
}

// Sent to the business the moment a client marks a payment (cash or online)
// through the Client Portal — same reasoning as sendAppointmentCancelledOwnerEmail.
export async function sendAppointmentPaidOwnerEmail(opts: {
  to: string
  businessName: string
  clientName: string
  method: 'cash' | 'card'
  amount: number
  scheduledAt: string
}) {
  const methodLabel = opts.method === 'cash' ? 'Efectivo (a confirmar en la visita)' : 'Tarjeta (en línea)'
  return sendEmail({
    to: opts.to,
    subject: `Pago recibido — ${opts.clientName}`,
    html: `
      <p><strong>${opts.clientName}</strong> registró un pago de <strong>$${opts.amount.toLocaleString()}</strong> para su cita
      con <strong>${opts.businessName}</strong> del <strong>${formatEmailDateTime(opts.scheduledAt)}</strong>.</p>
      <p>Método: ${methodLabel}</p>
    `,
  })
}

// Sent to the business when a client requests a reschedule through the
// Client Portal — the appointment moves to 'pending_confirmation' and stays
// there until the business picks a new status (typically back to
// 'scheduled'), which is what actually sends the client their confirmation
// (see the appointments PATCH route's existing sendAppointmentConfirmationEmail).
export async function sendAppointmentRescheduleRequestedEmail(opts: {
  to: string
  businessName: string
  clientName: string
  previousScheduledAt: string
  requestedScheduledAt: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Solicitud de reprogramación — ${opts.clientName}`,
    html: `
      <p><strong>${opts.clientName}</strong> solicitó reprogramar su cita con <strong>${opts.businessName}</strong>.</p>
      <p>Horario anterior: ${formatEmailDateTime(opts.previousScheduledAt)}</p>
      <p>Nuevo horario solicitado: <strong>${formatEmailDateTime(opts.requestedScheduledAt)}</strong></p>
      <p>Confirma o ajusta esta cita desde tu panel de Citas.</p>
    `,
  })
}

// Sent to the client right after they submit a reschedule request — sets
// the expectation that it's pending, not yet final (the business still has
// to confirm it).
export async function sendAppointmentRescheduleReceivedEmail(opts: {
  to: string
  clientName: string
  businessName: string
  requestedScheduledAt: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Tu solicitud de reprogramación con ${opts.businessName} fue recibida`,
    html: `
      <p>Hola ${opts.clientName},</p>
      <p>Recibimos tu solicitud para reprogramar tu cita con <strong>${opts.businessName}</strong> para el
      <strong>${formatEmailDateTime(opts.requestedScheduledAt)}</strong>.</p>
      <p>Está pendiente de confirmación por parte de la agencia — te avisaremos por correo en cuanto la confirmen.</p>
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

// Sent to the business owner (businesses.contact_email) when a visitor
// submits the public website's Contact lead form.
export async function sendNewWebsiteLeadEmail(opts: {
  to: string
  businessName: string
  name?: string
  email: string
  phone?: string
  message?: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `New website lead — ${opts.name || opts.email}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background:#166534;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
          <p style="margin:0;font-size:18px;font-weight:600;">📬 New Website Lead</p>
          <p style="margin:4px 0 0;opacity:0.85;">${opts.businessName}</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
          <p>Someone just submitted your website's contact form:</p>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            ${opts.name ? `<tr><td style="padding:6px 0;color:#6b7280;">Name</td><td style="padding:6px 0;font-weight:600;">${opts.name}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;font-weight:600;">${opts.email}</td></tr>
            ${opts.phone ? `<tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;font-weight:600;">${opts.phone}</td></tr>` : ''}
          </table>
          ${opts.message ? `<p style="margin-top:12px;">${opts.message}</p>` : ''}
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


