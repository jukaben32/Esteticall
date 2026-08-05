'use client'

import { useState } from 'react'
import { Eye, Check, Home, Heart, Star, Building2, ClipboardList, Building, BarChart3 } from 'lucide-react'
import {
  AGENT_TEMPLATES,
  AGENT_TEMPLATE_CATEGORIES,
  AGENT_TEMPLATE_ACCENT_STYLES,
  type AgentTemplate,
} from '@/constants'

const ICONS = {
  home: Home,
  heart: Heart,
  star: Star,
  building2: Building2,
  'clipboard-list': ClipboardList,
  building: Building,
  'bar-chart-3': BarChart3,
} as const

export function AgentTemplatesGallery({
  activeAgentNames,
  atLimit,
  onActivate,
  onPreview,
}: {
  activeAgentNames: string[]
  atLimit: boolean
  onActivate: (template: AgentTemplate) => void
  onPreview: (template: AgentTemplate) => void
}) {
  const [category, setCategory] = useState<string | null>(null)

  const templates = category ? AGENT_TEMPLATES.filter((t) => t.category === category) : AGENT_TEMPLATES

  return (
    <section className="card-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-display font-semibold text-[var(--text-1)]">Plantillas de Agentes IA</h2>
          <p className="text-sm text-[var(--text-3)]">Elige un especialista y actívalo en un clic</p>
        </div>
        <span className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">
          {AGENT_TEMPLATES.length} plantillas disponibles
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 mb-5">
        <button
          onClick={() => setCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            category === null
              ? 'bg-[var(--teal-700)] text-white'
              : 'bg-[var(--bg-raised)] text-[var(--text-2)] hover:bg-[var(--teal-50)]'
          }`}
        >
          Todas
        </button>
        {AGENT_TEMPLATE_CATEGORIES.map((cat) => {
          const count = AGENT_TEMPLATES.filter((t) => t.category === cat).length
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-[var(--teal-700)] text-white'
                  : 'bg-[var(--bg-raised)] text-[var(--text-2)] hover:bg-[var(--teal-50)]'
              }`}
            >
              {cat} · {count}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => {
          const alreadyActive = activeAgentNames.includes(template.name)
          const accent = AGENT_TEMPLATE_ACCENT_STYLES[template.accent]
          const Icon = ICONS[template.icon]
          return (
            <div key={template.id} className="card-surface p-4 flex flex-col relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <span
                  className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: accent.iconBg, color: accent.iconText }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span
                  className="badge border-transparent shrink-0 max-w-[55%] text-right justify-end"
                  style={{ background: accent.badgeBg, color: accent.badgeText }}
                >
                  {template.badge}
                </span>
              </div>

              <p className="font-display font-semibold text-[var(--text-1)] leading-tight">{template.name}</p>
              <p className="text-xs font-medium mb-2.5" style={{ color: accent.roleText }}>
                {template.role}
              </p>

              <ul className="text-xs text-[var(--text-2)] space-y-1.5 mb-3 flex-1">
                {template.features.slice(0, 2).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: accent.dot }} />
                    <span>{f}</span>
                  </li>
                ))}
                {template.features.length > 2 && (
                  <li className="text-[var(--text-3)] pl-[18px]">+{template.features.length - 2} más</li>
                )}
              </ul>

              <p className="text-[11px] text-[var(--text-3)] mb-3 leading-snug">
                <span className="font-semibold text-[var(--text-2)]">Ideal para:</span> {template.bestFor}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] mb-3">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent.dot }} />
                <span className="capitalize">
                  {template.voice} · {template.personalityLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => onActivate(template)}
                  disabled={alreadyActive || atLimit}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-full text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ background: accent.buttonBg }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = accent.buttonBgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = accent.buttonBg)}
                  title={atLimit ? 'Límite de agentes alcanzado' : undefined}
                >
                  {alreadyActive ? 'Ya activo' : 'Activar agente'}
                </button>
                <button onClick={() => onPreview(template)} className="btn-secondary !text-[12px] !px-3">
                  <Eye className="w-3.5 h-3.5" />
                  Vista previa
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
