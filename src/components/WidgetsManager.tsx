'use client'

import { useState } from 'react'
import { Eye, Pencil, Trash2, Copy, Check } from 'lucide-react'
import type { AiAgent, WidgetWithAgent, Widget } from '@/types'
import { WidgetFormModal } from './WidgetFormModal'
import { WidgetPreviewModal } from './WidgetPreviewModal'

type SnippetTab = 'script' | 'react' | 'html'

function buildSnippets(appUrl: string, businessId: string, widget: Widget) {
  const attrs = {
    src: `${appUrl}/api/widget-script`,
    businessId,
    position: widget.position,
    color: widget.primary_color,
    agentId: widget.agent_id ?? '',
  }

  const script = `<!-- EstateCall AI Voice Widget -->
<script
  src="${attrs.src}"
  data-business-id="${attrs.businessId}"
  data-position="${attrs.position}"
  data-color="${attrs.color}"
  data-agent-id="${attrs.agentId}"
></script>`

  const react = `useEffect(() => {
  const script = document.createElement('script');
  script.src = '${attrs.src}';
  script.setAttribute('data-business-id', '${attrs.businessId}');
  script.setAttribute('data-position', '${attrs.position}');
  script.setAttribute('data-color', '${attrs.color}');
  script.setAttribute('data-agent-id', '${attrs.agentId}');
  document.body.appendChild(script);
  return () => document.body.removeChild(script);
}, []);`

  const html = `<!doctype html>
<html>
  <body>
    <!-- ...your page content... -->
    <script
      src="${attrs.src}"
      data-business-id="${attrs.businessId}"
      data-position="${attrs.position}"
      data-color="${attrs.color}"
      data-agent-id="${attrs.agentId}"
    ></script>
  </body>
</html>`

  return { script, react, html }
}

export function WidgetsManager({
  businessId,
  initialWidgets,
  agents,
  appUrl,
}: {
  businessId: string
  initialWidgets: WidgetWithAgent[]
  agents: AiAgent[]
  appUrl: string
}) {
  const [widgets, setWidgets] = useState(initialWidgets)
  const [modalWidget, setModalWidget] = useState<Widget | 'new' | null>(null)
  const [previewWidget, setPreviewWidget] = useState<Widget | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSaved(widget: Widget) {
    setWidgets((prev) => {
      const agentName = agents.find((a) => a.id === widget.agent_id)?.name ?? null
      const withAgent = { ...widget, agent_name: agentName }
      const exists = prev.some((w) => w.id === widget.id)
      return exists ? prev.map((w) => (w.id === widget.id ? withAgent : w)) : [withAgent, ...prev]
    })
    setModalWidget(null)
  }

  async function handleDelete(widget: Widget) {
    if (!confirm(`Delete widget "${widget.name}"? This can't be undone.`)) return
    setError(null)
    const res = await fetch(`/api/widget/${widget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setWidgets((prev) => prev.filter((w) => w.id !== widget.id))
    } else {
      setError('Could not delete the widget')
    }
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Embedded Widgets</h2>
            <p className="text-sm text-[var(--text-3)]">Deploy your AI voice widget on any website</p>
          </div>
          <button className="btn-primary" onClick={() => setModalWidget('new')}>
            + New Widget
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-4">
          {widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              appUrl={appUrl}
              businessId={businessId}
              onPreview={() => setPreviewWidget(widget)}
              onEdit={() => setModalWidget(widget)}
              onDelete={() => handleDelete(widget)}
            />
          ))}
          {widgets.length === 0 && (
            <p className="text-sm text-[var(--text-3)]">
              No widgets yet — click &quot;+ New Widget&quot; to embed your assistant on a website.
            </p>
          )}
        </div>
      </section>

      {modalWidget && (
        <WidgetFormModal
          businessId={businessId}
          widget={modalWidget === 'new' ? undefined : modalWidget}
          agents={agents}
          onClose={() => setModalWidget(null)}
          onSaved={handleSaved}
        />
      )}

      {previewWidget && (
        <WidgetPreviewModal
          businessId={businessId}
          widget={previewWidget}
          agents={agents}
          onClose={() => setPreviewWidget(null)}
        />
      )}
    </div>
  )
}

function WidgetCard({
  widget,
  appUrl,
  businessId,
  onPreview,
  onEdit,
  onDelete,
}: {
  widget: WidgetWithAgent
  appUrl: string
  businessId: string
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [tab, setTab] = useState<SnippetTab>('script')
  const [copied, setCopied] = useState(false)
  const snippets = buildSnippets(appUrl, businessId, widget)

  function copy() {
    navigator.clipboard.writeText(snippets[tab])
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${widget.is_enabled ? 'bg-[var(--teal-600)]' : 'bg-[var(--text-3)]'}`} />
            <p className="font-medium text-[var(--text-1)] truncate">{widget.name}</p>
            <span
              className={`badge border-transparent shrink-0 ${
                widget.is_enabled ? 'bg-[var(--teal-50)] text-[var(--teal-800)]' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
              }`}
            >
              {widget.is_enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            {widget.position} · {widget.agent_name ?? 'No agent assigned'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-[var(--text-3)] whitespace-nowrap">
            {widget.interactions} interactions · {widget.impressions} impressions
          </p>
          <div className="flex items-center gap-1">
            <IconButton label="Preview" onClick={onPreview}>
              <Eye className="w-4 h-4" />
            </IconButton>
            <IconButton label="Edit" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </IconButton>
            <IconButton label="Delete" onClick={onDelete} danger>
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs">
            {(['script', 'react', 'html'] as SnippetTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  tab === t ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
                }`}
              >
                {t === 'script' ? '<script>' : t === 'react' ? 'React / JSX' : 'Full HTML'}
              </button>
            ))}
          </div>
          <button onClick={copy} className="btn-secondary !py-1 !px-2 text-xs flex items-center gap-1">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-[var(--bg-subtle)] rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{snippets[tab]}</pre>
      </div>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors ${
        danger
          ? 'text-[var(--text-3)] hover:text-red-600 hover:bg-red-50'
          : 'text-[var(--text-3)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]'
      }`}
    >
      {children}
    </button>
  )
}
