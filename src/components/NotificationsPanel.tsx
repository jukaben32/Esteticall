'use client'

import { useState } from 'react'
import { UserPlus, CalendarCheck, CalendarX2, CreditCard, Settings, BellRing } from 'lucide-react'
import type { Notification } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

const TYPE_LABELS: Record<string, string> = {
  new_lead: 'Nuevo lead',
  appointment_booked: 'Cita agendada',
  appointment_cancelled: 'Cita cancelada',
  subscription: 'Facturación',
  system: 'Sistema',
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  new_lead: UserPlus,
  appointment_booked: CalendarCheck,
  appointment_cancelled: CalendarX2,
  subscription: CreditCard,
  system: Settings,
}

export function NotificationsPanel({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }
  }

  async function markAllRead() {
    const res = await fetch('/api/notifications', { method: 'PATCH' })
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button className="btn-secondary" onClick={markAllRead}>
            Marcar todas como leídas ({unreadCount})
          </button>
        </div>
      )}
      <div className="divide-y divide-[var(--border)]">
        {notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Settings
          return (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className="w-full py-3 flex items-start gap-3 text-left"
            >
              <span
                className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                  n.is_read ? 'bg-[var(--bg-subtle)] text-[var(--text-4)]' : 'bg-[var(--teal-100)] text-[var(--teal-800)]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className={`text-sm ${n.is_read ? 'text-[var(--text-3)]' : 'font-medium text-[var(--text-1)]'}`}>{n.title}</p>
                {n.body && <p className="text-xs text-[var(--text-3)]">{n.body}</p>}
                <p className="text-xs text-[var(--text-4)] mt-0.5">
                  {TYPE_LABELS[n.type] ?? n.type} · {formatDateTime(n.created_at)}
                </p>
              </div>
            </button>
          )
        })}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <BellRing className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">Todavía no hay notificaciones.</p>
          </div>
        )}
      </div>
    </div>
  )
}
