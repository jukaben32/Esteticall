'use client'

import { X, Sparkles } from 'lucide-react'
import type { WidgetTemplate } from '@/constants'
import { widgetTemplateName } from '@/constants'
import { FloatingWidgetLauncher } from './FloatingWidgetLauncher'

export function WidgetTemplatePreview({
  businessId,
  template,
  onClose,
  onActivate,
  disabled,
}: {
  businessId: string
  template: WidgetTemplate
  onClose: () => void
  onActivate: () => void
  disabled?: boolean
}) {
  const config = {
    name: widgetTemplateName(template),
    position: template.position,
    theme: template.theme,
    primaryColor: template.primaryColor,
    greetingMessage: template.greetingMessage,
    agentId: null,
    agentName: template.name,
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="card-raised w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">{widgetTemplateName(template)}</h2>
            <p className="text-xs text-[var(--text-3)]">{template.role}</p>
          </div>
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
            <p className="font-medium text-sm text-[var(--text-1)]">
              {template.position} · {template.primaryColor} · {template.theme}
            </p>
            <p className="text-xs italic text-[var(--text-3)] mt-1">&quot;{template.greetingMessage}&quot;</p>
            <p className="text-xs text-[var(--text-3)] mt-2">
              <span className="font-medium">Best for:</span> {template.bestFor}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 pt-0">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button type="button" onClick={onActivate} disabled={disabled} className="btn-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Activate Widget
          </button>
        </div>
      </div>
    </div>
  )
}
