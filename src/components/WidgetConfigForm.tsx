'use client'

import { useState } from 'react'
import type { Widget } from '@/types'

export function WidgetConfigForm({
  businessId,
  initialWidget,
  appUrl,
}: {
  businessId: string
  initialWidget: Widget | null
  appUrl: string
}) {
  const [form, setForm] = useState({
    isEnabled: initialWidget?.is_enabled ?? true,
    primaryColor: initialWidget?.primary_color ?? '#0E7C5A',
    greetingMessage: initialWidget?.greeting_message ?? '¡Hola! Pregúntame sobre cualquiera de nuestras propiedades.',
    allowedOrigins: (initialWidget?.allowed_origins ?? []).join('\n'),
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const embedUrl = `${appUrl}/embed/${businessId}`
  const embedSnippet = `<iframe src="${embedUrl}" width="380" height="480" style="border:0;border-radius:14px;" title="AI assistant"></iframe>`

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/widget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isEnabled: form.isEnabled,
        primaryColor: form.primaryColor,
        greetingMessage: form.greetingMessage,
        allowedOrigins: form.allowedOrigins.split('\n').map((o) => o.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
  }

  function copySnippet() {
    navigator.clipboard.writeText(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <form onSubmit={save} className="card-surface p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
          />
          Widget activado
        </label>
        <div>
          <label className="text-xs text-[var(--text-3)]">Color principal</label>
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            className="block h-9 w-16 border rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-3)]">Mensaje de saludo</label>
          <textarea
            value={form.greetingMessage}
            onChange={(e) => setForm({ ...form, greetingMessage: e.target.value })}
            className="input-field w-full"
            rows={2}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-3)]">
            Orígenes permitidos (uno por línea, ej. https://miinmobiliaria.com) — déjalo vacío para permitir cualquier sitio
          </label>
          <textarea
            value={form.allowedOrigins}
            onChange={(e) => setForm({ ...form, allowedOrigins: e.target.value })}
            className="input-field w-full"
            rows={3}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </form>

      <div className="card-surface p-4">
        <h2 className="font-display font-semibold mb-2 text-[var(--text-1)]">Embeber en tu sitio web</h2>
        <p className="text-sm text-[var(--text-3)] mb-3">
          Pega este código en cualquier página de tu sitio para agregar el asistente de voz.
        </p>
        <pre className="bg-[var(--bg-subtle)] rounded-lg p-3 text-xs overflow-x-auto">{embedSnippet}</pre>
        <button className="btn-secondary mt-3" onClick={copySnippet}>
          {copied ? '¡Copiado!' : 'Copiar código'}
        </button>
      </div>
    </div>
  )
}
