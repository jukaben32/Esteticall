'use client'

import { useMemo, useState } from 'react'
import type { ConversationWithClient, ConversationMessage } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

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

export function CallLogTable({ initialConversations }: { initialConversations: ConversationWithClient[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return initialConversations.filter((conv) => {
      if (status !== 'all' && conv.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = `${conv.client?.name ?? ''} ${conv.client?.phone ?? ''} ${conv.client?.email ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [initialConversations, search, status])

  async function toggleExpand(conversationId: string) {
    if (expandedId === conversationId) {
      setExpandedId(null)
      return
    }
    setExpandedId(conversationId)
    setLoading(true)
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    if (res.ok) {
      const { messages: fetched } = await res.json()
      setMessages(fetched)
    }
    setLoading(false)
  }

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
        </select>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {filtered.map((conv) => (
          <div key={conv.id}>
            <button
              onClick={() => toggleExpand(conv.id)}
              className="w-full py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-1)] truncate">
                  {conv.client?.name ?? 'Cliente sin identificar'}
                </p>
                <p className="text-xs text-[var(--text-3)] truncate">
                  {[conv.client?.phone, conv.client?.email].filter(Boolean).join(' · ') || CHANNEL_LABELS[conv.channel] || conv.channel}
                </p>
                <p className="text-xs text-[var(--text-4)]">{formatDateTime(conv.started_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm sm:w-14 sm:text-right">{formatDuration(conv.duration_seconds)}</span>
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
            </button>

            {expandedId === conv.id && (
              <div className="pb-4 pl-2 border-l-2 border-[var(--border)] ml-2">
                {loading && <p className="text-sm text-[var(--text-3)]">Cargando transcripción…</p>}
                {!loading && messages.length === 0 && (
                  <p className="text-sm text-[var(--text-3)]">Esta llamada no tiene transcripción registrada.</p>
                )}
                <div className="space-y-2">
                  {messages.map((m) => (
                    <p key={m.id} className="text-sm">
                      <span className="font-semibold capitalize">{m.role === 'agent' ? 'Agente' : m.role === 'caller' ? 'Cliente' : 'Sistema'}:</span> {m.content}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">
            {initialConversations.length === 0 ? 'Todavía no hay llamadas registradas.' : 'Ninguna llamada coincide con estos filtros.'}
          </p>
        )}
      </div>
    </div>
  )
}
