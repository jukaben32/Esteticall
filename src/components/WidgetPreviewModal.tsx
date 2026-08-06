'use client'

import { X } from 'lucide-react'
import type { AiAgent, Widget } from '@/types'
import { FloatingWidgetLauncher } from './FloatingWidgetLauncher'

export function WidgetPreviewModal({
  businessId,
  widget,
  agents,
  onClose,
}: {
  businessId: string
  widget: Widget
  agents: AiAgent[]
  onClose: () => void
}) {
  const agent = agents.find((a) => a.id === widget.agent_id) ?? null
  const config = {
    widgetId: widget.id,
    name: widget.name,
    position: widget.position,
    theme: widget.theme,
    primaryColor: widget.primary_color,
    greetingMessage: widget.greeting_message,
    agentId: widget.agent_id,
    agentName: agent?.name ?? null,
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="card-raised w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Widget Preview</h2>
          <button onClick={onClose} aria-label="Close" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative h-72 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] overflow-hidden grid place-items-center">
            <p className="text-sm text-[var(--text-3)]">Your website here</p>
            <FloatingWidgetLauncher businessId={businessId} config={config} mode="inline" />
          </div>

          <div className="mt-4 card-surface p-3">
            <p className="font-medium text-sm text-[var(--text-1)]">{widget.name}</p>
            <p className="text-xs text-[var(--text-3)]">
              {widget.position} · {widget.primary_color}
            </p>
            <p className="text-xs italic text-[var(--text-3)] mt-1">&quot;{widget.greeting_message}&quot;</p>
          </div>
        </div>
      </div>
    </div>
  )
}
