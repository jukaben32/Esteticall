'use client'

import { useState } from 'react'
import { Eye, Sparkles } from 'lucide-react'
import { AGENT_TEMPLATES, AGENT_TEMPLATE_CATEGORIES, type AgentTemplate } from '@/constants'

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

      <div className="flex flex-wrap gap-2 mt-4 mb-4">
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
          return (
            <div key={template.id} className="card-surface p-4 flex flex-col">
              <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-700)] self-start mb-2">
                {template.badge}
              </span>
              <p className="font-display font-semibold text-[var(--text-1)]">{template.name}</p>
              <p className="text-xs text-[var(--text-3)] mb-2">{template.role}</p>
              <ul className="text-xs text-[var(--text-2)] space-y-1 mb-2 flex-1">
                {template.features.slice(0, 3).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--text-3)] mb-1">
                <span className="font-medium">Ideal para:</span> {template.bestFor}
              </p>
              <p className="text-[11px] text-[var(--text-3)] mb-3 capitalize">
                {template.voice} · {template.personalityLabel}
              </p>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => onActivate(template)}
                  disabled={alreadyActive || atLimit}
                  className="btn-primary flex-1 !text-[12px]"
                  title={atLimit ? 'Límite de agentes alcanzado' : undefined}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {alreadyActive ? 'Ya activo' : 'Activar agente'}
                </button>
                <button onClick={() => onPreview(template)} className="btn-secondary !text-[12px]">
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
