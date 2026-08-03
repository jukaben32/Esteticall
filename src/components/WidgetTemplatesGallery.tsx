'use client'

import { useState } from 'react'
import { Eye, Sparkles } from 'lucide-react'
import { WIDGET_TEMPLATES, WIDGET_TEMPLATE_CATEGORIES, widgetTemplateName, type WidgetTemplate } from '@/constants'

export function WidgetTemplatesGallery({
  activeWidgetNames,
  onActivate,
  onPreview,
}: {
  activeWidgetNames: string[]
  onActivate: (template: WidgetTemplate) => void
  onPreview: (template: WidgetTemplate) => void
}) {
  const [category, setCategory] = useState<string | null>(null)

  const templates = category ? WIDGET_TEMPLATES.filter((t) => t.category === category) : WIDGET_TEMPLATES

  return (
    <section className="card-surface p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-semibold text-[var(--text-1)]">Widget Templates</h2>
          <p className="text-sm text-[var(--text-3)]">Choose a specialist and activate it in one click</p>
        </div>
        <span className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">
          {WIDGET_TEMPLATES.length} templates available
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 mb-4">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            category === null
              ? 'bg-[var(--teal-700)] text-white'
              : 'bg-[var(--bg-raised)] text-[var(--text-2)] hover:bg-[var(--teal-50)]'
          }`}
        >
          All
        </button>
        {WIDGET_TEMPLATE_CATEGORIES.map((cat) => {
          const count = WIDGET_TEMPLATES.filter((t) => t.category === cat).length
          return (
            <button
              type="button"
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
          const widgetName = widgetTemplateName(template)
          const alreadyActive = activeWidgetNames.includes(widgetName)
          return (
            <div key={template.id} className="card-surface p-4 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-700)]">
                  {template.badge}
                </span>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: template.primaryColor }}
                  title={template.primaryColor}
                />
              </div>
              <p className="font-display font-semibold text-[var(--text-1)]">{template.name}</p>
              <p className="text-xs text-[var(--text-3)] mb-2">{template.role}</p>
              <ul className="text-xs text-[var(--text-2)] space-y-1 mb-2 flex-1">
                {template.features.slice(0, 3).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--text-3)] mb-1">
                <span className="font-medium">Best for:</span> {template.bestFor}
              </p>
              <p className="text-[11px] text-[var(--text-3)] mb-3">{template.toneLabel}</p>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => onActivate(template)}
                  disabled={alreadyActive}
                  className="btn-primary flex-1 !text-[12px]"
                  title={alreadyActive ? 'A widget from this template already exists' : undefined}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {alreadyActive ? 'Already active' : 'Activate Widget'}
                </button>
                <button type="button" onClick={() => onPreview(template)} className="btn-secondary !text-[12px]">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
