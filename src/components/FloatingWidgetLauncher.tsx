'use client'

import { useEffect, useState } from 'react'
import { Phone, PhoneOff, X } from 'lucide-react'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { useVoiceStore } from '@/store/voice'

export interface WidgetVisualConfig {
  widgetId?: string
  name: string
  position: 'bottom-right' | 'bottom-left'
  theme: 'light' | 'dark'
  primaryColor: string
  greetingMessage: string
  agentId: string | null
  agentName: string | null
}

// The actual widget UI: a floating round call button that expands into a
// small panel. Rendered two ways:
//  - mode="embed": inside /embed/[businessId], loaded by the public
//    widget-script iframe on a real third-party site — posts open/close
//    state to the parent so the outer iframe can resize around it.
//  - mode="inline": inside the dashboard (Live Preview in the Create/Edit
//    modal, and the Widget Preview mockup) — same component, positioned
//    relative to its own container instead of the viewport.
export function FloatingWidgetLauncher({
  businessId,
  config,
  mode = 'inline',
  defaultOpen = false,
}: {
  businessId: string
  config: WidgetVisualConfig
  mode?: 'embed' | 'inline'
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { startCall, endCall } = useRealtimeVoice()
  const { status, transcript, conversationId, error } = useVoiceStore()

  useEffect(() => {
    if (mode !== 'embed') return
    window.parent.postMessage({ type: open ? 'estatecall-widget-open' : 'estatecall-widget-close' }, '*')
  }, [open, mode])

  async function handleToolCall(name: string, args: Record<string, unknown>) {
    const res = await fetch('/api/ai/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, name, arguments: args }),
    })
    return res.json()
  }

  function handleStart() {
    if (!config.agentId) return
    startCall({ agentId: config.agentId, onToolCall: handleToolCall })
    if (config.widgetId) {
      fetch(`/api/widget/public/${businessId}/interaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId: config.widgetId }),
      }).catch(() => {})
    }
  }

  const isDark = config.theme === 'dark'
  const posSide = config.position === 'bottom-left' ? 'left-4' : 'right-4'
  const wrap = mode === 'embed' ? 'fixed bottom-4' : 'absolute bottom-4'

  return (
    <div className={`${wrap} ${posSide} z-50 flex flex-col items-end gap-3`}>
      {open && (
        <div
          className={`w-72 rounded-2xl shadow-xl overflow-hidden border ${
            isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: config.primaryColor }}>
            <p className="text-sm font-semibold text-white truncate">{config.agentName ?? config.name}</p>
            <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className={`text-sm italic ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              &quot;{config.greetingMessage}&quot;
            </p>

            {!config.agentId ? (
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                No hay un agente activo asignado a este widget todavía.
              </p>
            ) : status === 'active' ? (
              <button
                onClick={endCall}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="w-4 h-4" /> Terminar llamada
              </button>
            ) : status === 'connecting' ? (
              <p className="text-sm text-center py-2">Conectando…</p>
            ) : (
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Phone className="w-4 h-4" /> Iniciar llamada
              </button>
            )}
            {status === 'error' && error && <p className="text-xs text-red-500">{error}</p>}

            {transcript.length > 0 && (
              <div className={`max-h-32 overflow-y-auto text-xs space-y-1 border-t pt-2 ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                {transcript.map((t, i) => (
                  <p key={i}>
                    <strong>{t.role === 'agent' ? (config.agentName ?? 'Agente') : 'Tú'}:</strong> {t.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="w-14 h-14 rounded-full shadow-lg grid place-items-center text-white transition-transform hover:scale-105"
        style={{ backgroundColor: config.primaryColor }}
      >
        {open ? <X className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
      </button>
    </div>
  )
}
