'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, PhoneCall, PhoneOff, X, MessageSquareText, CalendarCheck, FileText } from 'lucide-react'
import type { ConversationWithClient, ConversationMessage, AppointmentWithDetails } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

export type CallLogEntry =
  | { kind: 'call'; id: string; timestamp: string; relativeTime: string; viewingBooked: boolean; conv: ConversationWithClient }
  | { kind: 'form'; id: string; timestamp: string; relativeTime: string; viewingBooked: boolean; appointment: AppointmentWithDetails }

const OUTCOME_STYLES: Record<string, string> = {
  booked_viewing: 'bg-[var(--teal-50)] text-[var(--teal-800)]',
  qualified_lead: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  no_action: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
  escalated: 'bg-[var(--gold)]/15 text-[var(--gold)]',
}

const OUTCOME_LABELS: Record<string, string> = {
  booked_viewing: '✓ Cita agendada',
  qualified_lead: 'Lead calificado',
  no_action: 'Sin acción',
  escalated: 'Escalado',
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'bg-[var(--teal-50)] text-[var(--teal-800)]',
  neutral: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
  negative: 'bg-red-50 text-red-700',
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: '🙂 Positivo',
  neutral: '😐 Neutral',
  negative: '🙁 Negativo',
}

const CHANNEL_LABELS: Record<string, string> = {
  widget_voice: 'Voz · widget',
  widget_chat: 'Chat · widget',
  phone: 'Teléfono',
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'En curso',
  completed: 'Completada',
  failed: 'Fallida',
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Normalizes both entry kinds into the fields the row/columns need, so the
// render logic below doesn't have to branch on `kind` for every cell.
function entryView(entry: CallLogEntry) {
  if (entry.kind === 'call') {
    const { conv } = entry
    return {
      clientName: conv.client?.name ?? 'Cliente sin identificar',
      subtitle: [conv.client?.phone, conv.client?.email].filter(Boolean).join(' · ') || CHANNEL_LABELS[conv.channel] || conv.channel,
      statusLabel: STATUS_LABELS[conv.status] ?? conv.status,
      failed: conv.status === 'failed',
      duration: conv.status === 'completed' && conv.duration_seconds > 0 ? formatDuration(conv.duration_seconds) : '—',
      sentimentLabel: conv.sentiment ? SENTIMENT_LABELS[conv.sentiment] ?? conv.sentiment : '—',
      sentimentClass: conv.sentiment ? SENTIMENT_STYLES[conv.sentiment] ?? '' : 'bg-[var(--bg-raised)] text-[var(--text-4)]',
    }
  }
  const { appointment } = entry
  return {
    clientName: appointment.client?.name ?? 'Cliente sin identificar',
    subtitle: [appointment.client?.phone, appointment.client?.email].filter(Boolean).join(' · ') || 'Reserva por formulario',
    statusLabel: 'Sin llamada',
    failed: false,
    duration: '—',
    sentimentLabel: '—',
    sentimentClass: 'bg-[var(--bg-raised)] text-[var(--text-4)]',
  }
}

function CallDetailsModal({ entry, onClose }: { entry: CallLogEntry; onClose: () => void }) {
  return entry.kind === 'call' ? (
    <ConversationDetails conv={entry.conv} onClose={onClose} />
  ) : (
    <FormBookingDetails appointment={entry.appointment} onClose={onClose} />
  )
}

function ConversationDetails({ conv, onClose }: { conv: ConversationWithClient; onClose: () => void }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting loading state before an async fetch, not a render-sync anti-pattern
    setLoading(true)
    setLoadError(false)
    fetch(`/api/conversations/${conv.id}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then(({ messages: fetched }) => {
        if (!cancelled) setMessages(fetched ?? [])
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [conv.id])

  return (
    <ModalShell
      icon={PhoneCall}
      title="Detalles de la llamada"
      subtitle={`${formatDateTime(conv.started_at)} · ${conv.client?.name ?? 'Cliente sin identificar'} · ${
        conv.status === 'completed' ? formatDuration(conv.duration_seconds) : 'Duración desconocida'
      }`}
      onClose={onClose}
    >
      <div className="flex flex-wrap gap-2">
        <span className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">
          {STATUS_LABELS[conv.status] ?? conv.status}
        </span>
        <span
          className={`badge border-transparent ${conv.sentiment ? SENTIMENT_STYLES[conv.sentiment] ?? '' : 'bg-[var(--bg-raised)] text-[var(--text-4)]'}`}
        >
          {conv.sentiment ? SENTIMENT_LABELS[conv.sentiment] ?? conv.sentiment : 'Sentimiento —'}
        </span>
        <span
          className={`badge border-transparent ${conv.outcome ? OUTCOME_STYLES[conv.outcome] ?? '' : 'bg-[var(--bg-raised)] text-[var(--text-4)]'}`}
        >
          {conv.outcome ? OUTCOME_LABELS[conv.outcome] ?? conv.outcome.replace('_', ' ') : 'Sin resultado'}
        </span>
      </div>

      <ContactGrid name={conv.client?.name} phone={conv.client?.phone} email={conv.client?.email} />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--teal-700)] mb-2 flex items-center gap-1.5">
          <MessageSquareText className="w-3.5 h-3.5" /> Transcripción
        </p>
        {loading && <p className="text-sm text-[var(--text-3)]">Cargando transcripción…</p>}
        {!loading && loadError && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="w-9 h-9 rounded-full bg-red-50 text-red-600 grid place-items-center">
              <MessageSquareText className="w-4 h-4" />
            </span>
            <p className="text-sm text-red-600">No se pudo cargar la transcripción — intenta de nuevo.</p>
          </div>
        )}
        {!loading && !loadError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <MessageSquareText className="w-4 h-4" />
            </span>
            <p className="text-sm text-[var(--text-3)]">Esta llamada no tiene transcripción registrada.</p>
          </div>
        )}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {messages.map((m) => (
            <p key={m.id} className="text-sm">
              <span className="font-semibold capitalize">
                {m.role === 'agent' ? 'Agente' : m.role === 'caller' ? 'Cliente' : 'Sistema'}:
              </span>{' '}
              {m.content}
            </p>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}

function FormBookingDetails({ appointment, onClose }: { appointment: AppointmentWithDetails; onClose: () => void }) {
  return (
    <ModalShell
      icon={CalendarCheck}
      title="Reserva por formulario"
      subtitle={`${formatDateTime(appointment.created_at)} · ${appointment.client?.name ?? 'Cliente sin identificar'}`}
      onClose={onClose}
    >
      <div className="flex flex-wrap gap-2">
        <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-800)]">✓ Cita agendada</span>
        {appointment.service && (
          <span className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">{appointment.service.name}</span>
        )}
      </div>

      <ContactGrid name={appointment.client?.name} phone={appointment.client?.phone} email={appointment.client?.email} />

      <div className="bg-[var(--bg-raised)] rounded-lg p-3 text-sm">
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Fecha de la visita</p>
        <p className="text-[var(--text-1)] font-medium">{formatDateTime(appointment.scheduled_at)}</p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--teal-700)] mb-2 flex items-center gap-1.5">
          <MessageSquareText className="w-3.5 h-3.5" /> Transcripción
        </p>
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
            <FileText className="w-4 h-4" />
          </span>
          <p className="text-sm text-[var(--text-3)]">
            Este cliente reservó directo por el formulario del widget — no hubo llamada con el agente IA, así que no
            hay transcripción.
          </p>
        </div>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  icon: Icon,
  title,
  subtitle,
  onClose,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-raised w-full max-w-lg my-6 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">{title}</h2>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ContactGrid({ name, phone, email }: { name?: string | null; phone?: string | null; email?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-3 bg-[var(--bg-raised)] rounded-lg p-3 text-sm">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Cliente</p>
        <p className="text-[var(--text-1)] font-medium truncate">{name ?? '—'}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Teléfono</p>
        <p className="text-[var(--text-1)] font-medium truncate">{phone ?? '—'}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Correo</p>
        <p className="text-[var(--text-1)] font-medium truncate">{email ?? '—'}</p>
      </div>
    </div>
  )
}

export function CallLogTable({ initialEntries }: { initialEntries: CallLogEntry[] }) {
  const [selected, setSelected] = useState<CallLogEntry | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return initialEntries.filter((entry) => {
      const client = entry.kind === 'call' ? entry.conv.client : entry.appointment.client
      if (status === 'form') {
        if (entry.kind !== 'form') return false
      } else if (status !== 'all') {
        if (entry.kind !== 'call' || entry.conv.status !== status) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const haystack = `${client?.name ?? ''} ${client?.phone ?? ''} ${client?.email ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [initialEntries, search, status])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Buscar por nombre, teléfono o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 min-w-[200px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
          <option value="form">Sin llamada (formulario)</option>
        </select>
      </div>

      <div className="hidden sm:flex items-center gap-2 px-1 pb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
        <span className="flex-1">Cliente</span>
        <span className="w-24 text-center">Estado</span>
        <span className="w-14 text-right">Duración</span>
        <span className="w-24 text-center">Sentimiento</span>
        <span className="w-28 text-center">Visita</span>
        <span className="w-24 text-right">Inicio</span>
        <span className="w-4" />
      </div>

      <div className="divide-y divide-[var(--border)]">
        {filtered.map((entry) => {
          const view = entryView(entry)
          return (
            <button
              key={entry.id}
              onClick={() => setSelected(entry)}
              className="w-full py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-left"
            >
              <div className="flex-1 min-w-0 flex items-center gap-2.5">
                <span
                  className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                    view.failed ? 'bg-red-50 text-red-600' : 'bg-[var(--teal-100)] text-[var(--teal-800)]'
                  }`}
                >
                  {entry.kind === 'form' ? (
                    <CalendarCheck className="w-4 h-4" />
                  ) : view.failed ? (
                    <PhoneOff className="w-4 h-4" />
                  ) : (
                    <PhoneCall className="w-4 h-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-1)] truncate">{view.clientName}</p>
                  <p className="text-xs text-[var(--text-3)] truncate">{view.subtitle}</p>
                  <p className="text-xs text-[var(--text-4)] sm:hidden">{entry.relativeTime}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-0">
                <span
                  className={`badge border-transparent sm:w-24 sm:justify-center ${
                    view.failed ? 'bg-red-50 text-red-700' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
                  }`}
                >
                  {view.statusLabel}
                </span>
                <span className="text-sm sm:w-14 sm:text-right">{view.duration}</span>
                <span className={`badge border-transparent sm:w-24 sm:justify-center ${view.sentimentClass}`}>
                  {view.sentimentLabel}
                </span>
                <span
                  className={`badge border-transparent sm:w-28 sm:justify-center ${
                    entry.viewingBooked ? 'bg-[var(--teal-50)] text-[var(--teal-800)]' : 'bg-[var(--bg-raised)] text-[var(--text-4)]'
                  }`}
                >
                  {entry.viewingBooked ? '✓ Agendada' : 'Sin agendar'}
                </span>
                <span className="hidden sm:inline text-xs text-[var(--text-4)] w-24 text-right">{entry.relativeTime}</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-4)] shrink-0" />
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <PhoneCall className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">
              {initialEntries.length === 0 ? 'Todavía no hay llamadas ni reservas registradas.' : 'Ningún contacto coincide con estos filtros.'}
            </p>
          </div>
        )}
      </div>

      {selected && <CallDetailsModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
