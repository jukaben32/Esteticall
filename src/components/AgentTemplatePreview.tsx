'use client'

import { X, Sparkles } from 'lucide-react'
import type { AgentTemplate } from '@/constants'

export function AgentTemplatePreview({
  template,
  onClose,
  onActivate,
  disabled,
}: {
  template: AgentTemplate
  onClose: () => void
  onActivate: () => void
  disabled: boolean
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="card-raised w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">{template.name}</h2>
            <p className="text-xs text-[var(--text-3)]">{template.role}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-medium text-[var(--text-2)] mb-1">Mensaje de saludo</p>
        <p className="text-sm text-[var(--text-1)] mb-3 italic">&quot;{template.greetingMessage}&quot;</p>

        <p className="text-xs font-medium text-[var(--text-2)] mb-1">Prompt del sistema</p>
        <p className="text-sm text-[var(--text-2)] mb-3">{template.systemPrompt}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.features.map((f) => (
            <span key={f} className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">
              {f}
            </span>
          ))}
        </div>

        <p className="text-xs text-[var(--text-3)] mb-4 capitalize">
          Voz: {template.voice} · {template.personalityLabel} · Ideal para: {template.bestFor}
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
          <button onClick={onActivate} disabled={disabled} className="btn-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Activar agente
          </button>
        </div>
      </div>
    </div>
  )
}
