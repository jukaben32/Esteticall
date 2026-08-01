'use client'

import { useState } from 'react'
import type { Notification } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  new_lead: 'Nuevo lead',
  appointment_booked: 'Cita agendada',
  appointment_cancelled: 'Cita cancelada',
  subscription: 'Facturación',
  system: 'Sistema',
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
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.is_read && markRead(n.id)}
            className="w-full py-3 flex items-start gap-3 text-left"
          >
            <span
              className={`status-dot mt-1.5 shrink-0 ${n.is_read ? 'bg-[var(--border)]' : 'bg-[var(--teal-500)]'}`}
            />
            <div className="min-w-0">
              <p className={`text-sm ${n.is_read ? 'text-[var(--text-3)]' : 'font-medium text-[var(--text-1)]'}`}>{n.title}</p>
              {n.body && <p className="text-xs text-[var(--text-3)]">{n.body}</p>}
              <p className="text-xs text-[var(--text-4)] mt-0.5">
                {TYPE_LABELS[n.type] ?? n.type} · {new Date(n.created_at).toLocaleString('es-DO')}
              </p>
            </div>
          </button>
        ))}
        {notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">Todavía no hay notificaciones.</p>
        )}
      </div>
    </div>
  )
}
