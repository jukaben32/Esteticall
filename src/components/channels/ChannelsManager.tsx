'use client'

import { useState } from 'react'
import { Handshake, Home, Calendar, Sparkles, Activity } from 'lucide-react'
import type {
  ChannelProviderAccount,
  ChannelHostConnectionWithStats,
  ChannelListingWithDetails,
  ChannelBookingWithDetails,
  ChannelSyncLogEntry,
  BookingAffiliateSettings,
  ListingWithPhotos,
} from '@/types'
import { ConnectionsTab } from './ConnectionsTab'
import { ListingsTab } from './ListingsTab'
import { BookingsTab } from './BookingsTab'
import { AffiliateTab } from './AffiliateTab'
import { ActivityTab } from './ActivityTab'

const TABS = [
  { id: 'connections', label: 'Conexiones', icon: Handshake },
  { id: 'listings', label: 'Propiedades', icon: Home },
  { id: 'bookings', label: 'Reservas & Comisión', icon: Calendar },
  { id: 'affiliate', label: 'Afiliados Booking.com', icon: Sparkles },
  { id: 'activity', label: 'Actividad', icon: Activity },
] as const

type TabId = (typeof TABS)[number]['id']

interface ChannelsManagerProps {
  businessId: string
  initialProviderAccount: ChannelProviderAccount | null
  initialHostConnections: ChannelHostConnectionWithStats[]
  initialChannelListings: ChannelListingWithDetails[]
  initialBookings: ChannelBookingWithDetails[]
  initialSyncLogs: ChannelSyncLogEntry[]
  initialAffiliateSettings: BookingAffiliateSettings | null
  eligibleListings: ListingWithPhotos[]
  webhookUrl: string
}

export function ChannelsManager({
  businessId,
  initialProviderAccount,
  initialHostConnections,
  initialChannelListings,
  initialBookings,
  initialSyncLogs,
  initialAffiliateSettings,
  eligibleListings,
  webhookUrl,
}: ChannelsManagerProps) {
  const [tab, setTab] = useState<TabId>('connections')
  const [providerAccount, setProviderAccount] = useState(initialProviderAccount)
  const [hostConnections, setHostConnections] = useState(initialHostConnections)
  const [channelListings, setChannelListings] = useState(initialChannelListings)
  const [bookings, setBookings] = useState(initialBookings)
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs)

  async function refreshLogs() {
    const res = await fetch('/api/channels/logs')
    if (res.ok) {
      const { logs } = await res.json()
      setSyncLogs(logs)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-5 border-b border-[var(--border)]">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-[var(--teal-700)] text-[var(--teal-700)]'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'connections' && (
        <ConnectionsTab
          providerAccount={providerAccount}
          setProviderAccount={setProviderAccount}
          hostConnections={hostConnections}
          setHostConnections={setHostConnections}
          webhookUrl={webhookUrl}
          onSynced={refreshLogs}
        />
      )}

      {tab === 'listings' && (
        <ListingsTab
          channelListings={channelListings}
          setChannelListings={setChannelListings}
          hostConnections={hostConnections}
          eligibleListings={eligibleListings}
        />
      )}

      {tab === 'bookings' && <BookingsTab bookings={bookings} setBookings={setBookings} />}

      {tab === 'affiliate' && <AffiliateTab businessId={businessId} initialSettings={initialAffiliateSettings} />}

      {tab === 'activity' && <ActivityTab logs={syncLogs} onRefresh={refreshLogs} />}
    </div>
  )
}
