import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listTicketsForClientUser, listClientRowsForUser, createTicketForClient } from '@/services/clientPortal'
import { portalSupportTicketSchema } from '@/validations'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const tickets = await listTicketsForClientUser(createAdminClient(), user.id)
  return NextResponse.json({ tickets })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const parsed = portalSupportTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const clientRows = await listClientRowsForUser(admin, user.id)
  const ownClientRow = clientRows.find((c) => c.business_id === parsed.data.businessId)
  if (!ownClientRow) {
    return NextResponse.json({ error: 'No tienes una relación con este negocio' }, { status: 403 })
  }

  const ticket = await createTicketForClient(
    admin,
    parsed.data.businessId,
    ownClientRow.id,
    parsed.data.subject,
    parsed.data.body
  )
  return NextResponse.json({ ticket })
}
