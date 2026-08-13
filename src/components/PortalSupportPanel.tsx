'use client'

import { useEffect, useState } from 'react'
import { Plus, Send, MessageCircleQuestion } from 'lucide-react'
import type { PortalSupportTicket, SupportMessage } from '@/types'
import { formatRelativeTime } from '@/lib/formatDate'

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

export function PortalSupportPanel({
  initialTickets,
  businesses,
}: {
  initialTickets: PortalSupportTicket[]
  businesses: { id: string; name: string }[]
}) {
  const [tickets, setTickets] = useState(initialTickets)
  const [selectedId, setSelectedId] = useState<string | null>(initialTickets[0]?.id ?? null)
  const [messages, setMessages] = useState<SupportMessage[] | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newBusinessId, setNewBusinessId] = useState(businesses[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const [hadSelectedId, setHadSelectedId] = useState(selectedId != null)
  if (!selectedId && hadSelectedId) {
    setHadSelectedId(false)
    setMessages(null)
  } else if (selectedId && !hadSelectedId) {
    setHadSelectedId(true)
  }

  useEffect(() => {
    if (!selectedId) {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing state before an async fetch, not a render-sync anti-pattern
    setMessages(null)
    fetch(`/api/portal/support-tickets/${selectedId}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []))
  }, [selectedId])

  async function handleSend() {
    if (!selectedId || !reply.trim()) return
    setSending(true)
    setError(null)
    const res = await fetch(`/api/portal/support-tickets/${selectedId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: reply }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) {
      setError(data.error ?? 'No se pudo enviar el mensaje')
      return
    }
    setMessages((prev) => [...(prev ?? []), data.message])
    setReply('')
  }

  async function handleCreate() {
    if (!newBusinessId || !newBody.trim()) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/portal/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: newBusinessId, subject: newSubject || 'Support Request', body: newBody }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) {
      setError(data.error ?? 'No se pudo crear el ticket')
      return
    }
    const newTicket: PortalSupportTicket = {
      ...data.ticket,
      client: null,
      last_message: newBody,
      business_name: businesses.find((b) => b.id === newBusinessId)?.name ?? null,
    }
    setTickets((prev) => [newTicket, ...prev])
    setSelectedId(newTicket.id)
    setCreating(false)
    setNewSubject('')
    setNewBody('')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">Support</h1>
        {businesses.length > 0 && (
          <button type="button" onClick={() => setCreating((v) => !v)} className="btn-secondary !text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Ticket
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {creating && (
        <div className="card-raised p-4 mb-4 space-y-2">
          {businesses.length > 1 && (
            <select value={newBusinessId} onChange={(e) => setNewBusinessId(e.target.value)} className="input-field w-full">
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Asunto"
            className="input-field w-full"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="¿En qué te ayudamos?"
            rows={3}
            className="input-field w-full"
          />
          <button type="button" onClick={handleCreate} disabled={sending} className="btn-primary w-full justify-center">
            {sending ? 'Enviando…' : 'Crear ticket'}
          </button>
        </div>
      )}

      {tickets.length === 0 && !creating && (
        <div className="card-raised p-8 text-center">
          <MessageCircleQuestion className="w-6 h-6 mx-auto text-[var(--text-4)] mb-2" />
          <p className="text-sm text-[var(--text-3)]">No tienes tickets de soporte todavía.</p>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 space-y-1.5">
            {tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-3 rounded-xl border ${
                  selectedId === t.id ? 'border-[var(--teal-600)] bg-[var(--teal-50)]' : 'border-[var(--border)] bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">{t.subject}</p>
                  <span className="badge border-transparent bg-[var(--bg-raised)] text-[var(--text-3)] shrink-0">
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </div>
                {t.business_name && <p className="text-[11px] text-[var(--text-4)] mt-0.5">{t.business_name}</p>}
                {t.last_message && <p className="text-xs text-[var(--text-3)] truncate mt-1">{t.last_message}</p>}
              </button>
            ))}
          </div>

          <div className="sm:col-span-2 card-raised p-4 flex flex-col min-h-[320px]">
            {!selectedId && <p className="text-sm text-[var(--text-3)] m-auto">Selecciona un ticket</p>}
            {selectedId && (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto max-h-96">
                  {messages === null && <p className="text-sm text-[var(--text-3)]">Cargando…</p>}
                  {messages?.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          m.sender === 'client' ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-1)]'
                        }`}
                      >
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 ${m.sender === 'client' ? 'text-white/70' : 'text-[var(--text-4)]'}`}>
                          {formatRelativeTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje…"
                    className="input-field flex-1"
                  />
                  <button type="button" onClick={handleSend} disabled={sending || !reply.trim()} className="btn-primary !px-3">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
