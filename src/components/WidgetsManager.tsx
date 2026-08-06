'use client'

import { useState } from 'react'
import { Eye, Pencil, Trash2, Copy, Check, MessagesSquare } from 'lucide-react'
import type { AiAgent, WidgetWithAgent, Widget } from '@/types'
import type { WidgetTemplate } from '@/constants'
import { WidgetFormModal } from './WidgetFormModal'
import { WidgetPreviewModal } from './WidgetPreviewModal'
import { WidgetTemplatesGallery } from './WidgetTemplatesGallery'
import { WidgetTemplatePreview } from './WidgetTemplatePreview'

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
  const [templateFromModal, setTemplateFromModal] = useState<WidgetTemplate | null>(null)
  const [previewWidget, setPreviewWidget] = useState<Widget | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<WidgetTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSaved(widget: Widget) {
    setWidgets((prev) => {
      const agentName = agents.find((a) => a.id === widget.agent_id)?.name ?? null
      const withAgent = { ...widget, agent_name: agentName }
      const exists = prev.some((w) => w.id === widget.id)
      return exists ? prev.map((w) => (w.id === widget.id ? withAgent : w)) : [withAgent, ...prev]
    })
    setModalWidget(null)
    setTemplateFromModal(null)
  }

  // Opens the Create Widget modal pre-filled with the template's persona
  // (color, greeting, theme, position). If an AI agent with the same name
  // is already active for this business (e.g. created from the matching
  // AI Agent Template on the Agents page), it's auto-selected too — same
  // "pick the agent, adjust color/branding, create" flow shown in the
  // reference video.
  function handleActivateTemplate(template: WidgetTemplate) {
    setPreviewTemplate(null)
    setTemplateFromModal(template)
    setModalWidget('new')
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
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <MessagesSquare className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-[var(--text-1)]">Embedded Widgets</h2>
              <p className="text-sm text-[var(--text-3)]">Deploy your AI voice widget on any website</p>
            </div>
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
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <MessagesSquare className="w-5 h-5" />
              </span>
              <p className="text-sm text-[var(--text-3)]">
                No widgets yet — click &quot;+ New Widget&quot; to embed your assistant on a website.
              </p>
            </div>
          )}
        </div>
      </section>

      <WidgetTemplatesGallery
        activeWidgetNames={widgets.map((w) => w.name)}
        onActivate={handleActivateTemplate}
        onPreview={setPreviewTemplate}
      />

      {modalWidget && (
        <WidgetFormModal
          businessId={businessId}
          widget={modalWidget === 'new' ? undefined : modalWidget}
          template={modalWidget === 'new' ? templateFromModal ?? undefined : undefined}
          agents={agents}
          onClose={() => {
            setModalWidget(null)
            setTemplateFromModal(null)
          }}
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

      {previewTemplate && (
        <WidgetTemplatePreview
          businessId={businessId}
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onActivate={() => handleActivateTemplate(previewTemplate)}
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
        <div className="min-w-0 flex items-start gap-2.5">
          <span
            className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-white"
            style={{ background: widget.primary_color }}
            title={`Color del widget: ${widget.primary_color}`}
          >
            <MessagesSquare className="w-4 h-4" />
          </span>
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
