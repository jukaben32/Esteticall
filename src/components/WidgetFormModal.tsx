'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { AiAgent, Widget } from '@/types'
import { FloatingWidgetLauncher } from './FloatingWidgetLauncher'

const COLOR_SWATCHES = ['#166534', '#7c3aed', '#2563eb', '#0d9488', '#dc2626', '#db2777', '#1e3a8a', '#111827']

interface WidgetFormValue {
  name: string
  agentId: string | null
  position: 'bottom-right' | 'bottom-left'
  primaryColor: string
  greetingMessage: string
  theme: 'light' | 'dark'
  isEnabled: boolean
}

function defaultsFromWidget(widget?: Widget): WidgetFormValue {
  if (!widget) {
    return {
      name: 'Main Widget',
      agentId: null,
      position: 'bottom-right',
      primaryColor: '#166534',
      greetingMessage: 'Hi! How can I help you today?',
      theme: 'light',
      isEnabled: true,
    }
  }
  return {
    name: widget.name,
    agentId: widget.agent_id,
    position: widget.position,
    primaryColor: widget.primary_color,
    greetingMessage: widget.greeting_message,
    theme: widget.theme,
    isEnabled: widget.is_enabled,
  }
}

export function WidgetFormModal({
  businessId,
  widget,
  agents,
  onClose,
  onSaved,
}: {
  businessId: string
  widget?: Widget
  agents: AiAgent[]
  onClose: () => void
  onSaved: (widget: Widget) => void
}) {
  const isEdit = Boolean(widget)
  const [form, setForm] = useState<WidgetFormValue>(defaultsFromWidget(widget))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function patch(update: Partial<WidgetFormValue>) {
    setForm((prev) => ({ ...prev, ...update }))
  }

  const selectedAgent = agents.find((a) => a.id === form.agentId) ?? null
  const previewConfig = {
    name: form.name || 'Widget',
    position: form.position,
    theme: form.theme,
    primaryColor: form.primaryColor,
    greetingMessage: form.greetingMessage || 'Hi! How can I help you today?',
    agentId: form.agentId,
    agentName: selectedAgent?.name ?? null,
  }

  async function handleSave() {
    if (form.name.trim().length < 2) {
      setError('Give the widget a name first.')
      return
    }
    if (form.greetingMessage.trim().length < 5) {
      setError('The greeting message needs a bit more detail.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        agentId: form.agentId,
        position: form.position,
        primaryColor: form.primaryColor,
        greetingMessage: form.greetingMessage,
        theme: form.theme,
        isEnabled: form.isEnabled,
        allowedOrigins: [],
      }
      const res = await fetch(isEdit ? `/api/widget/${widget!.id}` : '/api/widget', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save the widget')
        return
      }
      const { widget: saved } = await res.json()
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="card-raised w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">
            {isEdit ? 'Edit Widget' : 'Create Widget'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <p className="text-xs font-medium text-[var(--text-3)] mb-1">Live Preview</p>
            <p className="text-[11px] text-[var(--text-3)] mb-2">Updates as you change colour and position</p>
            <div className="relative h-28 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] overflow-hidden">
              <FloatingWidgetLauncher businessId={businessId} config={previewConfig} mode="inline" />
              <span className="absolute top-2 left-2 text-[10px] font-mono text-[var(--text-3)]">{form.primaryColor}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-3)]">Widget Name *</label>
            <input
              className="input-field w-full"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Main Widget"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-3)]">AI Agent</label>
            <select
              className="input-field w-full"
              value={form.agentId ?? ''}
              onChange={(e) => patch({ agentId: e.target.value || null })}
            >
              <option value="">Default (first active agent)</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-3)]">Position</label>
              <select
                className="input-field w-full"
                value={form.position}
                onChange={(e) => patch({ position: e.target.value as WidgetFormValue['position'] })}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-3)]">Primary Color</label>
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => patch({ primaryColor: e.target.value })}
                className="block h-9 w-full border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Pick color ${color}`}
                onClick={() => patch({ primaryColor: color })}
                className="w-6 h-6 rounded-full border-2"
                style={{
                  backgroundColor: color,
                  borderColor: form.primaryColor.toLowerCase() === color ? 'var(--text-1)' : 'transparent',
                }}
              />
            ))}
          </div>

          <div>
            <label className="text-xs text-[var(--text-3)]">Greeting Message</label>
            <input
              className="input-field w-full"
              value={form.greetingMessage}
              onChange={(e) => patch({ greetingMessage: e.target.value })}
              placeholder="Hi! How can I help you today?"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-3)] block mb-1">Widget Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => patch({ theme: 'dark' })}
                className={form.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => patch({ theme: 'light' })}
                className={form.theme === 'light' ? 'btn-primary' : 'btn-secondary'}
              >
                Light
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isEnabled} onChange={(e) => patch({ isEnabled: e.target.checked })} />
            Widget is active
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 pt-0">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Widget'}
          </button>
        </div>
      </div>
    </div>
  )
}
