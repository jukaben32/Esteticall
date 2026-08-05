'use client'

import { useState } from 'react'
import { Mic, Square, PhoneCall, CalendarCheck, MessageSquare } from 'lucide-react'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { useVoiceStore } from '@/store/voice'
import { WidgetBookingPanel } from './WidgetBookingPanel'
import type { AiAgent } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  idle: 'Listo para probar',
  connecting: 'Conectando…',
  active: 'En llamada — toca para terminar',
  ending: 'Terminando…',
  error: 'Ocurrió un error',
}

const AGENT_STATUS_BADGE: Record<AiAgent['status'], string> = {
  live: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  paused: 'bg-[var(--bg-page)] text-[var(--text-3)]',
  draft: 'bg-[var(--bg-page)] text-[var(--text-3)]',
}
const AGENT_STATUS_LABEL: Record<AiAgent['status'], string> = {
  live: 'Activo',
  paused: 'Pausado',
  draft: 'Borrador',
}

const TESTING_TIPS = [
  'Permite el acceso al micrófono cuando el navegador lo pida',
  'Prueba agendar una visita de principio a fin',
  'Pregunta por servicios, horarios y precios',
]

export function AgentLiveTest({ agent, businessId }: { agent: AiAgent; businessId: string }) {
  const [mode, setMode] = useState<'voice' | 'booking'>('voice')
  const { startCall, endCall } = useRealtimeVoice()
  const { status, transcript, conversationId, error } = useVoiceStore()

  async function handleToolCall(name: string, args: Record<string, unknown>) {
    const res = await fetch('/api/ai/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, name, arguments: args }),
    })
    return res.json()
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-[var(--border)] p-1 bg-[var(--bg-surface)]">
        <ModeButton active={mode === 'voice'} onClick={() => setMode('voice')} icon={PhoneCall}>
          Llamada de voz
        </ModeButton>
        <ModeButton active={mode === 'booking'} onClick={() => setMode('booking')} icon={CalendarCheck}>
          Agendar cita
        </ModeButton>
      </div>

      {mode === 'booking' ? (
        <div className="card-surface p-5 max-w-lg">
          <div className="mb-4">
            <h2 className="font-display font-semibold text-[var(--text-1)]">Probar reserva de cita</h2>
            <p className="text-xs text-[var(--text-3)]">El mismo flujo que ve un cliente desde el widget público.</p>
          </div>
          <WidgetBookingPanel businessId={businessId} primaryColor="#0e7c5a" isDark={false} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <div className="card-surface p-5 flex flex-col">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-[var(--text-1)]">Prueba en vivo</h2>
              <p className="text-xs text-[var(--text-3)]">Habla con tu agente en tiempo real</p>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-raised)] mb-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-[var(--teal-50)] text-[var(--teal-700)] shrink-0">
                  <Mic className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">
                    {agent.name} — {agent.specialty}
                  </p>
                  <p className="text-xs text-[var(--text-3)] truncate capitalize">
                    Voz {agent.voice} · {agent.personality}
                  </p>
                </div>
              </div>
              <span className={`badge border-transparent shrink-0 ${AGENT_STATUS_BADGE[agent.status]}`}>
                {AGENT_STATUS_LABEL[agent.status]}
              </span>
            </div>

            <div className="flex-1 grid place-items-center py-6">
              <div className="relative w-24 h-24">
                {status === 'active' && (
                  <span className="absolute inset-0 rounded-full bg-[var(--teal-600)]/40 pulse-ring" />
                )}
                <button
                  onClick={() =>
                    status === 'active' ? endCall() : startCall({ agentId: agent.id, onToolCall: handleToolCall })
                  }
                  disabled={status === 'connecting' || status === 'ending'}
                  className={`absolute inset-0 grid place-items-center rounded-full transition-colors disabled:opacity-60 ${
                    status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--teal-700)] hover:bg-[var(--teal-800)]'
                  }`}
                  aria-label={status === 'active' ? 'Terminar llamada' : 'Iniciar llamada'}
                >
                  {status === 'active' ? <Square className="w-7 h-7 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                </button>
              </div>
              <p className="text-sm font-medium text-[var(--text-1)] mt-4">{STATUS_LABEL[status]}</p>
              <p className="text-xs text-[var(--text-3)] mt-1 text-center max-w-xs">
                {status === 'error' ? error : 'Toca el micrófono para iniciar una llamada'}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-3.5 bg-[var(--bg-raised)]">
              <p className="text-xs font-semibold text-[var(--text-2)] mb-2">Consejos para probar</p>
              <ul className="space-y-1.5">
                {TESTING_TIPS.map((tip) => (
                  <li key={tip} className="text-xs text-[var(--text-3)] flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[var(--text-4)] mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card-surface p-5 flex flex-col">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-[var(--text-1)]">Transcripción de la conversación</h2>
              <p className="text-xs text-[var(--text-3)]">Aparece aquí en tiempo real durante la llamada</p>
            </div>
            {transcript.length === 0 ? (
              <div className="flex-1 grid place-items-center text-center py-10">
                <div>
                  <div className="mx-auto grid place-items-center w-11 h-11 rounded-full bg-[var(--bg-raised)] mb-3">
                    <MessageSquare className="w-5 h-5 text-[var(--text-4)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-2)]">Todavía no hay conversación</p>
                  <p className="text-xs text-[var(--text-3)] mt-0.5">Inicia una llamada para ver la transcripción en vivo</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[26rem] pr-1">
                {transcript.map((t, i) => (
                  <div key={i} className={`flex ${t.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        t.role === 'agent' ? 'bg-[var(--bg-raised)] text-[var(--text-1)]' : 'bg-[var(--teal-700)] text-white'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-[var(--teal-700)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  )
}
