import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { HostawayClient, type HostawayListingPayload } from '@/lib/hostaway'
import { decryptSecret } from '@/lib/encryption'
import {
  getHostConnectionById,
  getProviderAccount,
  logSyncEvent,
  normalizeToNightlyRate,
  updateChannelListing,
  updateHostConnection,
  upsertBookingFromChannel,
} from './channels'
import type { ChannelHostConnection, ChannelListing, ChannelProviderAccount, Listing, ListingPhoto } from '@/types'

type DB = SupabaseClient<Database>

function buildClient(providerAccount: ChannelProviderAccount): HostawayClient {
  if (!providerAccount.account_id || !providerAccount.client_secret_encrypted) {
    throw new Error('La cuenta de Hostaway no está conectada')
  }
  return new HostawayClient({
    accountId: providerAccount.account_id,
    clientSecret: decryptSecret(providerAccount.client_secret_encrypted),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTBOUND: tu app → Hostaway → Airbnb/Booking/VRBO
// ═══════════════════════════════════════════════════════════════════════════

export async function pushListingToHostaway(
  supabase: DB,
  providerAccount: ChannelProviderAccount,
  hostConnection: ChannelHostConnection,
  channelListing: ChannelListing,
  listing: Listing,
  photos: ListingPhoto[]
): Promise<{ externalListingId: string }> {
  const client = buildClient(providerAccount)

  const payload: HostawayListingPayload = {
    name: listing.title,
    price: Number(channelListing.nightly_price ?? normalizeToNightlyRate(listing)),
    currencyCode: channelListing.currency,
    personCapacity: Math.max(listing.bedrooms * 2, 2),
    bedroomsNumber: listing.bedrooms,
    bathroomsNumber: listing.bathrooms,
    address: listing.address_line ?? undefined,
    city: listing.city ?? undefined,
    lat: listing.latitude ?? undefined,
    lng: listing.longitude ?? undefined,
    description: listing.description ?? undefined,
    listingImages: photos.map((p) => ({ url: p.url })),
  }

  try {
    let externalListingId: string
    if (channelListing.external_listing_id) {
      await client.updateListing(Number(channelListing.external_listing_id), payload)
      externalListingId = channelListing.external_listing_id
    } else {
      const result = await client.createListing(payload)
      externalListingId = String(result.id)
    }

    await updateChannelListing(supabase, hostConnection.business_id, channelListing.id, {
      external_listing_id: externalListingId,
      channel_status: 'active',
      last_synced_at: new Date().toISOString(),
      error_message: null,
    })
    await logSyncEvent(supabase, {
      businessId: hostConnection.business_id,
      hostConnectionId: hostConnection.id,
      listingId: listing.id,
      action: 'push',
      direction: 'outbound',
      status: 'success',
      payload: { externalListingId, photosSynced: photos.length },
    })

    return { externalListingId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    await updateChannelListing(supabase, hostConnection.business_id, channelListing.id, {
      channel_status: 'error',
      error_message: message,
    })
    await logSyncEvent(supabase, {
      businessId: hostConnection.business_id,
      hostConnectionId: hostConnection.id,
      listingId: listing.id,
      action: 'push',
      direction: 'outbound',
      status: 'error',
      errorMessage: message,
    })
    throw err
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INBOUND: Airbnb/Booking/VRBO → Hostaway → tu app (reservas + comisión)
// ═══════════════════════════════════════════════════════════════════════════

export async function pullBookingsForListing(
  supabase: DB,
  providerAccount: ChannelProviderAccount,
  hostConnection: ChannelHostConnection,
  channelListing: ChannelListing
): Promise<number> {
  if (!channelListing.external_listing_id) return 0
  const client = buildClient(providerAccount)

  try {
    const bookings = await client.getBookings({ listingId: Number(channelListing.external_listing_id) })

    for (const booking of bookings) {
      if (!booking.arrivalDate || !booking.departureDate) continue
      const nights =
        booking.nights ??
        Math.max(1, Math.round((new Date(booking.departureDate).getTime() - new Date(booking.arrivalDate).getTime()) / 86_400_000))

      await upsertBookingFromChannel(supabase, hostConnection.business_id, channelListing.id, hostConnection.commission_pct, {
        externalBookingId: String(booking.reservationId ?? booking.id),
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        checkIn: booking.arrivalDate,
        checkOut: booking.departureDate,
        nights,
        grossAmount: Number(booking.totalPrice ?? 0),
        currency: booking.currency === 'DOP' ? 'DOP' : 'USD',
        status: booking.status === 'cancelled' ? 'cancelled' : 'confirmed',
      })
    }

    await updateChannelListing(supabase, hostConnection.business_id, channelListing.id, {
      last_synced_at: new Date().toISOString(),
    })
    await logSyncEvent(supabase, {
      businessId: hostConnection.business_id,
      hostConnectionId: hostConnection.id,
      listingId: channelListing.listing_id,
      action: 'pull',
      direction: 'inbound',
      status: 'success',
      payload: { bookingsFound: bookings.length },
    })

    return bookings.length
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    await logSyncEvent(supabase, {
      businessId: hostConnection.business_id,
      hostConnectionId: hostConnection.id,
      listingId: channelListing.listing_id,
      action: 'pull',
      direction: 'inbound',
      status: 'error',
      errorMessage: message,
    })
    throw err
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC COMPLETA de un dueño (todas sus propiedades: push + pull)
// ═══════════════════════════════════════════════════════════════════════════

type ChannelListingWithListing = ChannelListing & {
  listing: (Listing & { listing_photos: ListingPhoto[] | null }) | null
}

export async function syncHostConnection(
  supabase: DB,
  businessId: string,
  hostConnectionId: string
): Promise<{ pushed: number; pulled: number; errors: number }> {
  const providerAccount = await getProviderAccount(supabase, businessId)
  if (!providerAccount) throw new Error('No hay una cuenta de Hostaway conectada')

  const hostConnection = await getHostConnectionById(supabase, businessId, hostConnectionId)
  if (!hostConnection) throw new Error('Conexión de dueño no encontrada')

  const { data, error } = await supabase
    .from('channel_listings')
    .select('*, listing:listings(*, listing_photos(*))')
    .eq('business_id', businessId)
    .eq('host_connection_id', hostConnectionId)
  if (error) throw error

  const channelListings = (data ?? []) as unknown as ChannelListingWithListing[]

  let pushed = 0
  let pulled = 0
  let errors = 0

  for (const cl of channelListings) {
    if (!cl.listing) continue
    try {
      const { externalListingId } = await pushListingToHostaway(
        supabase,
        providerAccount,
        hostConnection,
        cl,
        cl.listing,
        cl.listing.listing_photos ?? []
      )
      pushed++

      const bookingsCount = await pullBookingsForListing(supabase, providerAccount, hostConnection, {
        ...cl,
        external_listing_id: externalListingId,
      })
      pulled += bookingsCount
    } catch {
      errors++
    }
  }

  await updateHostConnection(supabase, businessId, hostConnectionId, {
    status: errors === 0 && channelListings.length > 0 ? 'active' : errors > 0 ? 'error' : hostConnection.status,
    last_sync_at: new Date().toISOString(),
  })

  return { pushed, pulled, errors }
}
