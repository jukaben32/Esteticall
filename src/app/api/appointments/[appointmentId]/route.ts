import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import {
  updateAppointmentStatus,
  updateAppointmentPayment,
  updateAppointment,
  getAppointmentWithDetails,
} from '@/services/appointments'
import { sendAppointmentConfirmationEmail, sendAppointmentCompletedEmail, sendAppointmentCancelledEmail } from '@/services/email'
import type { Appointment } from '@/types'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { supabase, business }
}

export async function PATCH(request: Request, { params }: { params: { appointmentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const { status, scheduled_at, notes, service_id, listing_id, cancellationReason, payment_status } = body as {
    status?: Appointment['status']
    scheduled_at?: string
    notes?: string
    service_id?: string | null
    listing_id?: string | null
    cancellationReason?: string
    payment_status?: Appointment['payment_status']
  }

  let appointment: Appointment
  if (status) {
    appointment = await updateAppointmentStatus(ctx.supabase, ctx.business.id, params.appointmentId, status, {
      cancellationReason,
    })
  } else if (payment_status) {
    appointment = await updateAppointmentPayment(ctx.supabase, ctx.business.id, params.appointmentId, payment_status)
  } else {
    appointment = await updateAppointment(ctx.supabase, ctx.business.id, params.appointmentId, {
      ...(scheduled_at !== undefined && { scheduled_at }),
      ...(notes !== undefined && { notes }),
      ...(service_id !== undefined && { service_id }),
      ...(listing_id !== undefined && { listing_id }),
    })
  }

  // Best-effort — a client without an email on file, or a transient Resend
  // error, should never fail the status update itself.
  if (status && (status === 'scheduled' || status === 'completed' || status === 'cancelled')) {
    try {
      const details = await getAppointmentWithDetails(ctx.supabase, ctx.business.id, params.appointmentId)
      if (details?.client?.email) {
        const emailOpts = {
          to: details.client.email,
          clientName: details.client.name,
          businessName: ctx.business.name,
          listingTitle: details.listing?.title,
        }
        if (status === 'scheduled') {
          void sendAppointmentConfirmationEmail({ ...emailOpts, scheduledAt: appointment.scheduled_at })
        } else if (status === 'completed') {
          void sendAppointmentCompletedEmail(emailOpts)
        } else if (status === 'cancelled') {
          void sendAppointmentCancelledEmail({
            ...emailOpts,
            scheduledAt: appointment.scheduled_at,
            reason: cancellationReason,
          })
        }
      }
    } catch {
      // notification failure shouldn't surface as a failed status update
    }
  }

  return NextResponse.json({ appointment })
}
