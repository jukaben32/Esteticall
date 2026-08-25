'use client'

import { useState } from 'react'
import { PhoneCall, Code2, Palette } from 'lucide-react'
import type { Widget } from '@/types'
import { VoiceWidget } from '@/components/VoiceWidget'

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
    greetingMessage: initialWidget?.greeting_message ?? '¡Hola! Pregúntame sobre nuestros tratamientos y disponibilidad.',
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
      <div className="card-surface p-4 lg:col-span-2">
        <h2 className="font-display font-semibold mb-1 text-[var(--text-1)] flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </span>
          Probar el asistente
        </h2>
        <p className="text-sm text-[var(--text-3)] mb-3">
          Haz una llamada de prueba real ahora mismo, sin salir del panel. Necesitas al menos un
          agente IA en estado &quot;Activo&quot; (sección Agentes IA) y darle permiso al navegador para usar
          el micrófono.
        </p>
        <VoiceWidget businessId={businessId} />
      </div>

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
          <label className="text-xs text-[var(--text-3)] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[var(--teal-700)]" /> Color principal
          </label>
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
            Orígenes permitidos (uno por línea, ej. https://miclinica.com) — déjalo vacío para permitir cualquier sitio
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
        <h2 className="font-display font-semibold mb-2 text-[var(--text-1)] flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <Code2 className="w-4 h-4" />
          </span>
          Embeber en tu sitio web
        </h2>
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
