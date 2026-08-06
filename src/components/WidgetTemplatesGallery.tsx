'use client'

import { useState } from 'react'
import { Eye, Sparkles, Phone, MessageSquareText, CircleCheck, SearchX } from 'lucide-react'
import { WIDGET_TEMPLATES, WIDGET_TEMPLATE_CATEGORIES, widgetTemplateName, type WidgetTemplate } from '@/constants'

// Friendly names for the hex swatches on WIDGET_TEMPLATES so the card can
// show "Navy" / "Rose" instead of a raw hex code, like the reference design.
const COLOR_NAMES: Record<string, string> = {
  '#166534': 'Forest Green',
  '#db2777': 'Rose',
  '#1e3a8a': 'Navy',
  '#0d9488': 'Teal',
  '#2563eb': 'Blue',
  '#7c3aed': 'Violet',
}

function colorName(hex: string): string {
  return COLOR_NAMES[hex] ?? hex
}

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
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <MessageSquareText className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Widget Templates</h2>
            <p className="text-sm text-[var(--text-3)]">One click to create a pre-configured widget for each of your AI agents</p>
          </div>
        </div>
        <span className="badge bg-[var(--bg-raised)] border-transparent text-[var(--text-3)]">
          {WIDGET_TEMPLATES.length} agents available
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

      {templates.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
            <SearchX className="w-5 h-5" />
          </span>
          <p className="text-sm text-[var(--text-3)]">No templates match this category.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => {
          const widgetName = widgetTemplateName(template)
          const alreadyActive = activeWidgetNames.includes(widgetName)
          const color = template.primaryColor

          return (
            <div
              key={template.id}
              className="relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,32,25,0.10)]"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />

              <div className="p-4 pb-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className="grid place-items-center w-11 h-11 rounded-xl shrink-0 text-white shadow-sm"
                    style={{ background: color }}
                  >
                    <MessageSquareText className="w-5 h-5" />
                  </span>
                  <span
                    className="grid place-items-center w-9 h-9 rounded-full shrink-0 text-white shadow-sm"
                    style={{ background: color }}
                    title={`${template.name} · voice agent`}
                  >
                    <Phone className="w-4 h-4" />
                  </span>
                </div>

                <p className="font-display font-semibold text-[var(--text-1)] leading-tight truncate">{template.name}</p>
                <div className="flex items-center justify-between gap-2 mb-2.5 mt-0.5">
                  <p className="text-xs text-[var(--text-3)] truncate">{template.role}</p>
                  <span
                    className="badge border-transparent shrink-0 !text-[10px]"
                    style={{ background: `${color}1F`, color }}
                  >
                    {template.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] mb-3 flex-wrap">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="font-medium text-[var(--text-2)]">{colorName(color)}</span>
                  <span>·</span>
                  <span className="capitalize">{template.position.replace('-', ' ')}</span>
                  <span>·</span>
                  <span>
                    {template.features.length} {template.features.length === 1 ? 'capability' : 'capabilities'}
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] mb-1">Greeting</p>
                <div
                  className="rounded-lg p-2.5 mb-3"
                  style={{ background: `${color}12`, border: `1px solid ${color}2A` }}
                >
                  <p className="text-xs italic text-[var(--text-2)] leading-snug line-clamp-3">
                    &quot;{template.greetingMessage}&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mb-3 mt-auto text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-[var(--text-3)]">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
                    Active agent
                  </span>
                  <span className="text-[var(--text-3)]">{template.toneLabel}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onActivate(template)}
                    disabled={alreadyActive}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-full transition-all duration-150 active:scale-[0.98] disabled:cursor-default ${
                      alreadyActive
                        ? 'border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-3)]'
                        : 'text-white'
                    }`}
                    style={alreadyActive ? undefined : { background: color }}
                    title={alreadyActive ? 'A widget from this template already exists' : undefined}
                  >
                    {alreadyActive ? <CircleCheck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {alreadyActive ? 'Widget already created' : 'Activate Widget'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreview(template)}
                    aria-label={`Preview ${template.name}`}
                    title="Preview"
                    className="grid place-items-center w-9 h-9 rounded-full border border-[var(--border)] text-[var(--text-3)] shrink-0 transition-colors hover:text-[var(--text-1)] hover:bg-[var(--bg-raised)]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
