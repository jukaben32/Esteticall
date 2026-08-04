'use client'

import { useMemo, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import type { SupportMessage, SupportTicketWithClient } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  resolved: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
  closed: 'bg-[var(--bg-raised)] text-[var(--text-4)]',
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function SupportTicketsPanel({ initialTickets }: { initialTickets: SupportTicketWithClient[] }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId])

  async function openTicket(ticketId: string) {
    setSelectedId(ticketId)
    setLoadingThread(true)
    const res = await fetch(`/api/support-tickets/${ticketId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages)
    }
    setLoadingThread(false)
  }

  async function sendReply() {
    if (!selectedId || !reply.trim()) return
    setSending(true)
    const res = await fetch(`/api/support-tickets/${selectedId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: reply.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setReply('')
      setTickets((prev) =>
        prev
          .map((t) =>
            t.id === selectedId
              ? { ...t, status: t.status === 'open' ? 'in_progress' : t.status, last_message: data.message.body }
              : t
          )
          .sort((a, b) => (a.id === selectedId ? -1 : b.id === selectedId ? 1 : 0))
      )
    }
    setSending(false)
  }

  async function changeStatus(status: string) {
    if (!selectedId) return
    const res = await fetch(`/api/support-tickets/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setTickets((prev) => prev.map((t) => (t.id === selectedId ? { ...t, status: data.ticket.status } : t)))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 border border-[var(--border)] rounded-2xl overflow-hidden min-h-[520px]">
      {/* ─── Lista de tickets ─────────────────────────── */}
      <div className="border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto max-h-[600px]">
        {tickets.length === 0 && (
          <p className="p-4 text-sm text-[var(--text-3)]">No hay solicitudes de soporte todavía.</p>
        )}
        {tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => openTicket(t.id)}
            className={`w-full text-left p-4 border-b border-[var(--border)] transition-colors ${
              selectedId === t.id ? 'bg-[var(--teal-50)]' : 'hover:bg-[var(--bg-raised)]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-[var(--text-1)] truncate">
                {t.client?.name ?? 'Cliente'}
              </span>
              <span className={`badge border-transparent shrink-0 ${STATUS_STYLES[t.status]}`}>
                {STATUS_LABELS[t.status]}
              </span>
            </div>
            <p className="text-xs text-[var(--text-2)] truncate">{t.subject}</p>
            {t.last_message && <p className="text-xs text-[var(--text-3)] truncate mt-0.5">{t.last_message}</p>}
            <p className="text-[10px] text-[var(--text-4)] mt-1">{formatDateTime(t.updated_at)}</p>
          </button>
        ))}
      </div>

      {/* ─── Hilo de mensajes ─────────────────────────── */}
      <div className="flex flex-col">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
            <MessageSquare className="w-8 h-8 text-[var(--text-4)]" />
            <p className="text-sm font-medium text-[var(--text-2)]">Selecciona un ticket</p>
            <p className="text-xs text-[var(--text-4)]">Elige una solicitud de cliente de la lista</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] text-xs font-semibold shrink-0">
                  {initials(selected.client?.name ?? 'C')}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">{selected.subject}</p>
                  <p className="text-xs text-[var(--text-3)] truncate">
                    {selected.client?.name}
                    {selected.client?.email ? ` · ${selected.client.email}` : ''}
                    {selected.client?.phone ? ` · ${selected.client.phone}` : ''}
                  </p>
                </div>
              </div>
              <select
                value={selected.status}
                onChange={(e) => changeStatus(e.target.value)}
                className="input-field w-auto shrink-0 py-1.5 text-xs"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingThread ? (
                <p className="text-sm text-[var(--text-3)]">Cargando…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-[var(--text-3)]">Todavía no hay mensajes en este ticket.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'business' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.sender === 'business'
                          ? 'bg-[var(--teal-700)] text-white rounded-br-sm'
                          : 'bg-[var(--bg-raised)] text-[var(--text-1)] rounded-bl-sm'
                      }`}
                    >
                      <p>{m.body}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          m.sender === 'business' ? 'text-white/70' : 'text-[var(--text-4)]'
                        }`}
                      >
                        {formatDateTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-[var(--border)]">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                placeholder="Escribe una respuesta…"
                className="input-field flex-1"
                disabled={sending}
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="btn-primary shrink-0"
                aria-label="Enviar respuesta"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
