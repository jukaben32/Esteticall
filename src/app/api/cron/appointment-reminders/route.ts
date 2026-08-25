import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDueAppointmentReminders } from '@/services/reminders'

export const dynamic = 'force-dynamic'

// Invoked by Vercel Cron (see vercel.json) once a day. Vercel signs
// cron requests with an `Authorization: Bearer ${CRON_SECRET}` header
// automatically whenever CRON_SECRET is set as a project env var — this
// check is what stops anyone else from hitting the route and mass-texting
// every business's clients.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const result = await sendDueAppointmentReminders(admin)
  return NextResponse.json(result)
}
