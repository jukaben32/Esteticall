'use client'

import { useEffect, useState } from 'react'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { useVoiceStore } from '@/store/voice'

interface WidgetConfig {
  agentId: string | null
  agentName: string | null
  primary_color: string
  greeting_message: string
}

// The embeddable voice widget: fetches this business's public config, then
// drives useRealtimeVoice to open a WebRTC call straight to OpenAI. Tool
// calls the model makes are relayed through /api/ai/tools (never Supabase
// directly — the browser only ever holds a conversationId).
export function VoiceWidget({ businessId }: { businessId: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { startCall, endCall } = useRealtimeVoice()
  const { status, transcript, conversationId, error } = useVoiceStore()

  useEffect(() => {
    fetch(`/api/widget/${businessId}/config`)
      .then((res) => {
        if (!res.ok) throw new Error('Widget unavailable')
        return res.json()
      })
      .then(setConfig)
      .catch((err) => setLoadError(err.message))
  }, [businessId])

  async function handleToolCall(name: string, args: Record<string, unknown>) {
    const res = await fetch('/api/ai/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, name, arguments: args }),
    })
    return res.json()
  }

  if (loadError) return <div className="card-surface p-4 text-sm text-red-600">{loadError}</div>
  if (!config) return <div className="card-surface p-4 text-sm">Loading assistant…</div>
  if (!config.agentId) {
    return <div className="card-surface p-4 text-sm">No live AI agent for this business yet.</div>
  }

  return (
    <div className="card-surface p-4 max-w-sm" style={{ borderColor: config.primary_color }}>
      <p className="font-semibold mb-1">{config.agentName}</p>
      <p className="text-sm text-[var(--text-3)] mb-3">{config.greeting_message}</p>

      {status === 'idle' && (
        <button
          className="btn-primary"
          onClick={() =>
            startCall({ agentId: config.agentId!, onToolCall: handleToolCall })
          }
        >
          Start call
        </button>
      )}
      {status === 'connecting' && <p className="text-sm">Connecting…</p>}
      {status === 'active' && (
        <button className="btn-secondary" onClick={endCall}>
          End call
        </button>
      )}
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-3 space-y-1 max-h-48 overflow-y-auto text-sm">
        {transcript.map((t, i) => (
          <p key={i}>
            <strong>{t.role === 'agent' ? config.agentName : 'You'}:</strong> {t.text}
          </p>
        ))}
      </div>
    </div>
  )
}
