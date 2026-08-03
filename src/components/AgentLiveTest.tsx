'use client'

import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { useVoiceStore } from '@/store/voice'

export function AgentLiveTest({ agentId, agentName }: { agentId: string; agentName: string }) {
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
    <div className="card-surface p-5 max-w-lg">
      <p className="font-medium text-[var(--text-1)] mb-1">Probar a {agentName} en vivo</p>
      <p className="text-xs text-[var(--text-3)] mb-4">
        Inicia una llamada real con este agente desde tu micrófono para escuchar cómo responde.
      </p>

      {status === 'idle' && (
        <button className="btn-primary" onClick={() => startCall({ agentId, onToolCall: handleToolCall })}>
          Iniciar llamada de prueba
        </button>
      )}
      {status === 'connecting' && <p className="text-sm text-[var(--text-3)]">Conectando…</p>}
      {status === 'active' && (
        <button className="btn-secondary" onClick={endCall}>
          Terminar llamada
        </button>
      )}
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

      {transcript.length > 0 && (
        <div className="mt-4 space-y-1.5 max-h-64 overflow-y-auto text-sm border-t border-[var(--border)] pt-3">
          {transcript.map((t, i) => (
            <p key={i}>
              <strong className="text-[var(--text-1)]">{t.role === 'agent' ? agentName : 'Tú'}:</strong>{' '}
              <span className="text-[var(--text-2)]">{t.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
