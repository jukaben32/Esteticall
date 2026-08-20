import { Palmtree } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listListingsForBusiness } from '@/services/listings'
import {
  getAffiliateSettings,
  getProviderAccount,
  listBookingsForBusiness,
  listChannelListingsForBusiness,
  listHostConnectionsForBusiness,
  listSyncLogs,
} from '@/services/channels'
import { ChannelsManager } from '@/components/channels/ChannelsManager'

export default async function ChannelsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [providerAccount, hostConnections, channelListings, bookings, syncLogs, affiliateSettings, allListings] =
    await Promise.all([
      getProviderAccount(supabase, business.id),
      listHostConnectionsForBusiness(supabase, business.id),
      listChannelListingsForBusiness(supabase, business.id),
      listBookingsForBusiness(supabase, business.id),
      listSyncLogs(supabase, business.id, 30),
      getAffiliateSettings(supabase, business.id),
      listListingsForBusiness(supabase, business.id, { status: 'all' }),
    ])

  const eligibleListings = allListings.filter((l) => l.listing_type === 'vacation_rental')
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/webhook/${business.id}`
  const pendingCommission = hostConnections.reduce((sum, c) => sum + c.pendingCommission, 0)
  const activeListingsCount = channelListings.filter((c) => c.channel_status === 'active').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Dueños conectados" value={String(hostConnections.length)} />
        <StatCard label="Propiedades activas" value={String(activeListingsCount)} />
        <StatCard label="Reservas totales" value={String(bookings.length)} />
        <StatCard label="Comisión pendiente" value={`$${pendingCommission.toFixed(0)}`} />
      </div>

      <div className="card-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <Palmtree className="w-4 h-4" />
          </span>
          <div>
            <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Airbnb &amp; Canales</h1>
            <p className="text-sm text-[var(--text-3)]">
              Co-anfitrionaje real con Airbnb, Booking y VRBO — conecta propietarios, sincroniza calendarios y cobra tu
              comisión
            </p>
          </div>
        </div>

        <ChannelsManager
          businessId={business.id}
          initialProviderAccount={providerAccount}
          initialHostConnections={hostConnections}
          initialChannelListings={channelListings}
          initialBookings={bookings}
          initialSyncLogs={syncLogs}
          initialAffiliateSettings={affiliateSettings}
          eligibleListings={eligibleListings}
          webhookUrl={webhookUrl}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card p-4">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
