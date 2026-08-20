import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type {
  ChannelProviderAccount,
  ChannelHostConnection,
  ChannelHostConnectionWithStats,
  ChannelListing,
  ChannelListingWithDetails,
  ChannelBooking,
  ChannelBookingWithDetails,
  ChannelSyncLogEntry,
  BookingAffiliateSettings,
  Listing,
} from '@/types'
import type {
  ChannelProviderAccountInput,
  ChannelHostConnectionInput,
  ChannelListingLinkInput,
  BookingAffiliateSettingsInput,
} from '@/validations'
import { encryptSecret } from '@/lib/encryption'

type DB = SupabaseClient<Database>

// Airbnb/Booking/VRBO pricing is always per night. `listings.price` is
// ambiguous on its own — it can be a sale price, a monthly rent, or a
// vacation rate quoted by night/week/month (rental_period) — so this is the
// single place that turns it into the nightly rate a channel actually needs.
export function normalizeToNightlyRate(listing: Pick<Listing, 'price' | 'rental_period'>): number {
  const price = Number(listing.price)
  if (listing.rental_period === 'week') return Math.round((price / 7) * 100) / 100
  if (listing.rental_period === 'month') return Math.round((price / 30) * 100) / 100
  return price
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER ACCOUNT (one master Hostaway account per business)
// ═══════════════════════════════════════════════════════════════════════════

export async function getProviderAccount(supabase: DB, businessId: string): Promise<ChannelProviderAccount | null> {
  const { data, error } = await supabase
    .from('channel_provider_accounts')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function connectProviderAccount(
  supabase: DB,
  businessId: string,
  input: ChannelProviderAccountInput
): Promise<ChannelProviderAccount> {
  const { data, error } = await supabase
    .from('channel_provider_accounts')
    .upsert(
      {
        business_id: businessId,
        provider: 'hostaway',
        account_id: input.accountId,
        client_secret_encrypted: encryptSecret(input.clientSecret),
        webhook_secret_encrypted: input.webhookSecret ? encryptSecret(input.webhookSecret) : null,
        status: 'active',
        error_message: null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function markProviderAccountError(supabase: DB, businessId: string, message: string) {
  const { error } = await supabase
    .from('channel_provider_accounts')
    .update({ status: 'error', error_message: message })
    .eq('business_id', businessId)
  if (error) throw error
}

export async function disconnectProviderAccount(supabase: DB, businessId: string) {
  // Cascades: every host connection, listing link, booking and sync log
  // under this account goes with it — you can't keep managing Airbnb
  // accounts through a channel-manager connection you just removed.
  const { error } = await supabase.from('channel_provider_accounts').delete().eq('business_id', businessId)
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// HOST CONNECTIONS (one per third-party property owner's own Airbnb account)
// ═══════════════════════════════════════════════════════════════════════════

export async function listHostConnectionsForBusiness(
  supabase: DB,
  businessId: string
): Promise<ChannelHostConnectionWithStats[]> {
  const { data, error } = await supabase
    .from('channel_host_connections')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const connections = data ?? []

  return Promise.all(
    connections.map(async (conn) => {
      const { count: listingCount } = await supabase
        .from('channel_listings')
        .select('id', { count: 'exact', head: true })
        .eq('host_connection_id', conn.id)

      const { count: activeListingCount } = await supabase
        .from('channel_listings')
        .select('id', { count: 'exact', head: true })
        .eq('host_connection_id', conn.id)
        .eq('channel_status', 'active')

      const { data: listingIds } = await supabase
        .from('channel_listings')
        .select('id')
        .eq('host_connection_id', conn.id)
      const ids = (listingIds ?? []).map((l) => l.id)

      let pendingCommission = 0
      let paidCommission = 0
      if (ids.length) {
        const { data: bookings } = await supabase
          .from('channel_bookings')
          .select('commission_amount, commission_status')
          .in('channel_listing_id', ids)
          .neq('status', 'cancelled')
        for (const b of bookings ?? []) {
          if (b.commission_status === 'paid') paidCommission += Number(b.commission_amount)
          else pendingCommission += Number(b.commission_amount)
        }
      }

      return { ...conn, listingCount: listingCount ?? 0, activeListingCount: activeListingCount ?? 0, pendingCommission, paidCommission }
    })
  )
}

export async function getHostConnectionById(
  supabase: DB,
  businessId: string,
  hostConnectionId: string
): Promise<ChannelHostConnection | null> {
  const { data, error } = await supabase
    .from('channel_host_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', hostConnectionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createHostConnection(
  supabase: DB,
  businessId: string,
  providerAccountId: string,
  input: ChannelHostConnectionInput
): Promise<ChannelHostConnection> {
  const { data, error } = await supabase
    .from('channel_host_connections')
    .insert({
      business_id: businessId,
      provider_account_id: providerAccountId,
      client_id: input.clientId || null,
      owner_name: input.ownerName,
      owner_phone: input.ownerPhone || null,
      owner_email: input.ownerEmail || null,
      channel: input.channel,
      commission_pct: input.commissionPct,
      status: 'pending',
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateHostConnection(
  supabase: DB,
  businessId: string,
  hostConnectionId: string,
  patch: Partial<ChannelHostConnection>
): Promise<ChannelHostConnection> {
  const { data, error } = await supabase
    .from('channel_host_connections')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', hostConnectionId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteHostConnection(supabase: DB, businessId: string, hostConnectionId: string) {
  const { error } = await supabase
    .from('channel_host_connections')
    .delete()
    .eq('business_id', businessId)
    .eq('id', hostConnectionId)
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// CHANNEL LISTINGS
// ═══════════════════════════════════════════════════════════════════════════

export async function listChannelListingsForBusiness(
  supabase: DB,
  businessId: string
): Promise<ChannelListingWithDetails[]> {
  const { data, error } = await supabase
    .from('channel_listings')
    .select(
      `*,
      listing:listings(id, title, listing_code, price, currency, cover_photo_url, listing_type, rental_period),
      hostConnection:channel_host_connections(id, owner_name, channel, status, commission_pct)`
    )
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ChannelListingWithDetails[]
}

// Only vacation-rental inventory makes sense on Airbnb/Booking/VRBO — a
// "for sale" or long-term "rent" listing pushed there would be nonsensical
// and could accidentally publish it as a short-term stay.
export async function assertListingIsChannelEligible(supabase: DB, businessId: string, listingId: string): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Propiedad no encontrada')
  if (data.listing_type !== 'vacation_rental') {
    throw new Error('Solo propiedades de tipo "Alquiler vacacional" pueden conectarse a Airbnb, Booking o VRBO')
  }
  return data
}

export async function linkListingToChannel(
  supabase: DB,
  businessId: string,
  input: ChannelListingLinkInput
): Promise<ChannelListing> {
  const listing = await assertListingIsChannelEligible(supabase, businessId, input.listingId)

  const nightlyPrice = input.overridePrice && input.nightlyPrice != null ? input.nightlyPrice : normalizeToNightlyRate(listing)

  const { data, error } = await supabase
    .from('channel_listings')
    .insert({
      business_id: businessId,
      host_connection_id: input.hostConnectionId,
      listing_id: input.listingId,
      channel_status: 'pending',
      nightly_price: nightlyPrice,
      currency: input.currency ?? listing.currency,
      override_price: input.overridePrice,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateChannelListing(
  supabase: DB,
  businessId: string,
  channelListingId: string,
  patch: Partial<ChannelListing>
): Promise<ChannelListing> {
  const { data, error } = await supabase
    .from('channel_listings')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', channelListingId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function unlinkListingFromChannel(supabase: DB, businessId: string, channelListingId: string) {
  const { error } = await supabase
    .from('channel_listings')
    .delete()
    .eq('business_id', businessId)
    .eq('id', channelListingId)
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS (drives the co-host commission ledger)
// ═══════════════════════════════════════════════════════════════════════════

export async function listBookingsForBusiness(supabase: DB, businessId: string): Promise<ChannelBookingWithDetails[]> {
  const { data, error } = await supabase
    .from('channel_bookings')
    .select(
      `*,
      listing:channel_listings(id, listing_id, listing:listings(title), hostConnection:channel_host_connections(owner_name, channel))`
    )
    .eq('business_id', businessId)
    .order('check_in', { ascending: false })
  if (error) throw error

  type Row = ChannelBooking & {
    listing: {
      id: string
      listing_id: string
      listing: { title: string } | null
      hostConnection: { owner_name: string; channel: ChannelHostConnection['channel'] } | null
    } | null
  }

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    ...row,
    listing: {
      id: row.listing?.id ?? '',
      listing_id: row.listing?.listing_id ?? '',
      listingTitle: row.listing?.listing?.title ?? 'Propiedad',
      ownerName: row.listing?.hostConnection?.owner_name ?? '—',
      channel: row.listing?.hostConnection?.channel ?? 'airbnb',
    },
  }))
}

export async function updateBookingCommissionStatus(
  supabase: DB,
  businessId: string,
  bookingId: string,
  commissionStatus: ChannelBooking['commission_status']
): Promise<ChannelBooking> {
  const { data, error } = await supabase
    .from('channel_bookings')
    .update({ commission_status: commissionStatus })
    .eq('business_id', businessId)
    .eq('id', bookingId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Called from the sync job and the webhook handler. Looks up any existing
// row by (channel_listing_id, external_booking_id) first — Hostaway sends
// the same reservation on every calendar pull and every webhook retry, and
// this must never create duplicate commission entries for one real stay.
export async function upsertBookingFromChannel(
  supabase: DB,
  businessId: string,
  channelListingId: string,
  commissionPct: number,
  booking: {
    externalBookingId: string
    guestName?: string | null
    guestEmail?: string | null
    guestPhone?: string | null
    checkIn: string
    checkOut: string
    nights: number
    grossAmount: number
    currency: 'USD' | 'DOP'
    status: ChannelBooking['status']
  }
): Promise<ChannelBooking> {
  const { data: existing, error: findError } = await supabase
    .from('channel_bookings')
    .select('id, commission_pct')
    .eq('channel_listing_id', channelListingId)
    .eq('external_booking_id', booking.externalBookingId)
    .maybeSingle()
  if (findError) throw findError

  const commissionAmount = Math.round(booking.grossAmount * (commissionPct / 100) * 100) / 100

  if (existing) {
    const { data, error } = await supabase
      .from('channel_bookings')
      .update({
        guest_name: booking.guestName ?? null,
        guest_email: booking.guestEmail ?? null,
        guest_phone: booking.guestPhone ?? null,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        nights: booking.nights,
        gross_amount: booking.grossAmount,
        currency: booking.currency,
        status: booking.status,
        // commission_pct/amount intentionally NOT overwritten on update —
        // they stay a snapshot of what was owed when the stay was first seen.
      })
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('channel_bookings')
    .insert({
      business_id: businessId,
      channel_listing_id: channelListingId,
      external_booking_id: booking.externalBookingId,
      guest_name: booking.guestName ?? null,
      guest_email: booking.guestEmail ?? null,
      guest_phone: booking.guestPhone ?? null,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      nights: booking.nights,
      gross_amount: booking.grossAmount,
      currency: booking.currency,
      commission_pct: commissionPct,
      commission_amount: commissionAmount,
      status: booking.status,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOG
// ═══════════════════════════════════════════════════════════════════════════

export async function logSyncEvent(
  supabase: DB,
  params: {
    businessId: string
    hostConnectionId?: string
    listingId?: string
    action: ChannelSyncLogEntry['action']
    direction: ChannelSyncLogEntry['direction']
    status?: ChannelSyncLogEntry['status']
    payload?: Json
    errorMessage?: string
  }
): Promise<ChannelSyncLogEntry> {
  const { data, error } = await supabase
    .from('channel_sync_log')
    .insert({
      business_id: params.businessId,
      host_connection_id: params.hostConnectionId || null,
      listing_id: params.listingId || null,
      action: params.action,
      direction: params.direction,
      status: params.status || 'success',
      payload: params.payload || null,
      error_message: params.errorMessage || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listSyncLogs(supabase: DB, businessId: string, limit = 30): Promise<ChannelSyncLogEntry[]> {
  const { data, error } = await supabase
    .from('channel_sync_log')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKING.COM AFFILIATE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export async function getAffiliateSettings(supabase: DB, businessId: string): Promise<BookingAffiliateSettings | null> {
  const { data, error } = await supabase
    .from('booking_affiliate_settings')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertAffiliateSettings(
  supabase: DB,
  businessId: string,
  input: BookingAffiliateSettingsInput
): Promise<BookingAffiliateSettings> {
  const { data, error } = await supabase
    .from('booking_affiliate_settings')
    .upsert(
      { business_id: businessId, affiliate_id: input.affiliateId || null, is_enabled: input.isEnabled },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}
