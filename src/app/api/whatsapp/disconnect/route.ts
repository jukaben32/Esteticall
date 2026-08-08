import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getWhatsappConnection, disconnectWhatsapp } from '@/services/whatsapp'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 401 })

  const connection = await getWhatsappConnection(supabase, business.id)
  if (!connection) return NextResponse.json({ ok: true })

  try {
    await disconnectWhatsapp(supabase, connection)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo desconectar'
    return NextResponse.json({ error: message }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
