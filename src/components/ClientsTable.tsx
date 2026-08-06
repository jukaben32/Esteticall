'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Eye, Home, UsersRound } from 'lucide-react'
import type { Client, AppointmentWithDetails } from '@/types'
import { formatDateTime } from '@/lib/formatDate'
import {
  APPOINTMENT_STATUS_STYLES as STATUS_STYLES,
  APPOINTMENT_STATUS_LABELS as STATUS_LABELS,
  PAYMENT_STYLES,
  PAYMENT_LABELS,
} from '@/lib/appointmentFormat'
import { AppointmentDetailsPanel } from '@/components/AppointmentDetailsPanel'

const SOURCE_LABELS: Record<string, string> = {
  ai_call: 'Llamada IA',
  widget_chat: 'Chat del widget',
  manual: 'Manual',
  website_form: 'Formulario del sitio',
}

export function ClientsTable({
  initialClients,
  appointments,
  durationMinutes,
}: {
  initialClients: Client[]
  appointments: AppointmentWithDetails[]
  durationMinutes: number
}) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<AppointmentWithDetails | null>(null)

  const filtered = useMemo(() => {
    if (!search) return initialClients
    const q = search.toLowerCase()
    return initialClients.filter((c) =>
      `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)
    )
  }, [initialClients, search])

  const appointmentsByClient = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>()
    for (const appt of appointments) {
      if (!appt.client_id) continue
      const list = map.get(appt.client_id) ?? []
      list.push(appt)
      map.set(appt.client_id, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    }
    return map
  }, [appointments])

  return (
    <div>
      <input
        placeholder="Buscar por nombre, teléfono o presupuesto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field w-full mb-4"
      />
      <div className="divide-y divide-[var(--border)]">
        {filtered.map((client) => {
          const clientAppointments = appointmentsByClient.get(client.id) ?? []
          const expanded = expandedId === client.id
          return (
            <div key={client.id}>
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : client.id)}
                className="w-full py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-left"
              >
                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-1)]">{client.name}</p>
                    <p className="text-xs text-[var(--text-3)] truncate">
                      {[client.phone, client.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {clientAppointments.length > 0 && (
                    <span className="text-xs text-[var(--text-3)]">
                      {clientAppointments.length} {clientAppointments.length === 1 ? 'visita' : 'visitas'}
                    </span>
                  )}
                  {client.budget != null && (
                    <p className="text-sm font-semibold sm:w-28 sm:text-right text-[var(--teal-700)]">
                      ${client.budget.toLocaleString()}
                    </p>
                  )}
                  <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-700)]">
                    {SOURCE_LABELS[client.source] ?? client.source}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-3)] transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {expanded && (
                <div className="pb-4 -mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="card-surface px-3.5 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                        Presupuesto
                      </p>
                      <p className="text-sm font-semibold text-[var(--text-1)]">
                        {client.budget != null ? `$${client.budget.toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <div className="card-surface px-3.5 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                        No. de pre-aprobación
                      </p>
                      <p className="text-sm font-semibold text-[var(--text-1)]">
                        {client.pre_approval_number ?? '—'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--teal-700)] mb-2">
                    Historial de visitas ({clientAppointments.length})
                  </p>

                  {clientAppointments.length === 0 ? (
                    <p className="text-sm text-[var(--text-3)] card-surface p-3.5 flex items-center gap-2">
                      <Home className="w-4 h-4 text-[var(--text-4)] shrink-0" />
                      Este cliente todavía no tiene citas registradas.
                    </p>
                  ) : (
                    <div className="card-surface overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wide text-[var(--text-3)] border-b border-[var(--border)]">
                            <th className="text-left font-semibold px-3.5 py-2">Fecha y hora</th>
                            <th className="text-left font-semibold px-3.5 py-2">Propiedad/Servicio</th>
                            <th className="text-left font-semibold px-3.5 py-2 hidden sm:table-cell">Duración</th>
                            <th className="text-left font-semibold px-3.5 py-2">Estado</th>
                            <th className="text-left font-semibold px-3.5 py-2 hidden sm:table-cell">Pago</th>
                            <th className="text-right font-semibold px-3.5 py-2">Ver</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {clientAppointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-[var(--bg-raised)]">
                              <td className="px-3.5 py-2.5 whitespace-nowrap text-[var(--text-1)]">
                                {formatDateTime(appt.scheduled_at)}
                              </td>
                              <td className="px-3.5 py-2.5 text-[var(--text-2)]">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <Home className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0" />
                                  <span className="truncate">
                                    {appt.service?.name ?? appt.listing?.title ?? 'Visita de propiedad'}
                                  </span>
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-[var(--text-2)] hidden sm:table-cell whitespace-nowrap">
                                {durationMinutes} min
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className={`badge border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}>
                                  {STATUS_LABELS[appt.status] ?? appt.status}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 hidden sm:table-cell">
                                <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
                                  {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                <button
                                  onClick={() => setViewing(appt)}
                                  title="Ver detalles"
                                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-page)] hover:text-[var(--teal-700)] inline-flex"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <UsersRound className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">Ningún cliente coincide con esta búsqueda.</p>
          </div>
        )}
      </div>

      {viewing && (
        <AppointmentDetailsPanel appt={viewing} durationMinutes={durationMinutes} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
