'use client'

import { X, Sparkles, Home, Heart, Star, Building2, ClipboardList, Building, BarChart3 } from 'lucide-react'
import { AGENT_TEMPLATE_ACCENT_STYLES, type AgentTemplate } from '@/constants'

const ICONS = {
  home: Home,
  heart: Heart,
  star: Star,
  building2: Building2,
  'clipboard-list': ClipboardList,
  building: Building,
  'bar-chart-3': BarChart3,
} as const

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
  const accent = AGENT_TEMPLATE_ACCENT_STYLES[template.accent]
  const Icon = ICONS[template.icon]
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="card-raised w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span
              className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: accent.iconBg, color: accent.iconText }}
            >
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">{template.name}</h2>
              <p className="text-xs font-medium" style={{ color: accent.roleText }}>
                {template.role}
              </p>
            </div>
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
