'use client'

import { useState } from 'react'
import type { Conversation, ConversationMessage } from '@/types'

const OUTCOME_STYLES: Record<string, string> = {
  booked_viewing: 'bg-[var(--teal-50)] text-[var(--teal-800)]',
  qualified_lead: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  no_action: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
  escalated: 'bg-[var(--gold)]/15 text-[var(--gold)]',
}

const OUTCOME_LABELS: Record<string, string> = {
  booked_viewing: 'Cita agendada',
  qualified_lead: 'Lead calificado',
  no_action: 'Sin acción',
  escalated: 'Escalado',
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

export function CallLogTable({ initialConversations }: { initialConversations: Conversation[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(false)

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
    <div className="divide-y divide-[var(--border)]">
      {initialConversations.map((conv) => (
        <div key={conv.id}>
          <button
            onClick={() => toggleExpand(conv.id)}
            className="w-full py-3 flex items-center gap-4 text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-1)]">{new Date(conv.started_at).toLocaleString('es-DO')}</p>
              <p className="text-xs text-[var(--text-3)]">{CHANNEL_LABELS[conv.channel] ?? conv.channel}</p>
            </div>
            <span className="text-sm w-14 text-right">{formatDuration(conv.duration_seconds)}</span>
            <span className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">
              {STATUS_LABELS[conv.status] ?? conv.status}
            </span>
            {conv.outcome && (
              <span className={`badge border-transparent ${OUTCOME_STYLES[conv.outcome] ?? ''}`}>
                {OUTCOME_LABELS[conv.outcome] ?? conv.outcome.replace('_', ' ')}
              </span>
            )}
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
      {initialConversations.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--text-3)]">Todavía no hay llamadas registradas.</p>
      )}
    </div>
  )
}
