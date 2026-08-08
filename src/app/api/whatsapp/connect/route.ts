import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { connectWhatsapp } from '@/services/whatsapp'
import { EvolutionApiNotConfiguredError } from '@/lib/evolutionApi'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  try {
    const { connection, qrCode } = await connectWhatsapp(supabase, business.id, body.agentId ?? null, appUrl)
    return NextResponse.json({ connection, qrCode })
  } catch (err) {
    if (err instanceof EvolutionApiNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'No se pudo conectar WhatsApp'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
