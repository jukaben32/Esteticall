import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/encryption'
import { getProviderAccount, logSyncEvent, upsertBookingFromChannel } from '@/services/channels'
import type { ChannelHostConnection, ChannelListing } from '@/types'

// One URL PER BUSINESS (not a single shared endpoint) — each business
// connects its own separate Hostaway account, so this is the exact URL that
// business registers as its webhook in Hostaway's dashboard. That lets
// verification look up the right stored secret immediately, instead of
// having to trust an unverified payload just to find out whose secret to
// check against.
function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const receivedBuf = Buffer.from(signatureHeader, 'utf8')
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}

interface HostawayWebhookPayload {
  event?: string
  type?: string
  data?: {
    listingMapId?: number | string
    listingId?: number | string
    reservationId?: number | string
    id?: number | string
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    arrivalDate?: string
    departureDate?: string
    nights?: number
    totalPrice?: number
    currency?: string
    status?: string
  }
}

export async function POST(request: Request, props: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await props.params
  const rawBody = await request.text()
  const supabase = createAdminClient()

  const providerAccount = await getProviderAccount(supabase, businessId)
  if (!providerAccount?.webhook_secret_encrypted) {
    // Sin un secreto guardado no hay forma segura de verificar el origen —
    // se rechaza siempre, nunca se procesa un webhook sin firmar.
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 })
  }

  const secret = decryptSecret(providerAccount.webhook_secret_encrypted)
  // El nombre exacto del header de firma lo confirma Hostaway al registrar
  // el webhook en el dashboard de esa cuenta — se aceptan ambos nombres
  // habituales mientras tanto.
  const signature = request.headers.get('x-hostaway-signature') ?? request.headers.get('x-webhook-signature')

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody) as HostawayWebhookPayload
  const event = body.event ?? body.type ?? 'unknown'
  const data = body.data ?? {}

  await logSyncEvent(supabase, {
    businessId,
    action: 'webhook',
    direction: 'inbound',
    status: 'success',
    payload: { event },
  })

  const externalListingId = data.listingMapId ?? data.listingId
  if (externalListingId == null) return NextResponse.json({ received: true })

  const { data: channelListing } = await supabase
    .from('channel_listings')
    .select('*, hostConnection:channel_host_connections(*)')
    .eq('business_id', businessId)
    .eq('external_listing_id', String(externalListingId))
    .maybeSingle<ChannelListing & { hostConnection: ChannelHostConnection | null }>()

  if (!channelListing || !data.arrivalDate || !data.departureDate) {
    return NextResponse.json({ received: true })
  }

  await upsertBookingFromChannel(supabase, businessId, channelListing.id, channelListing.hostConnection?.commission_pct ?? 0, {
    externalBookingId: String(data.reservationId ?? data.id ?? ''),
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    checkIn: data.arrivalDate,
    checkOut: data.departureDate,
    nights: data.nights ?? 1,
    grossAmount: Number(data.totalPrice ?? 0),
    currency: data.currency === 'DOP' ? 'DOP' : 'USD',
    status: data.status === 'cancelled' ? 'cancelled' : 'confirmed',
  })

  return NextResponse.json({ received: true })
}
