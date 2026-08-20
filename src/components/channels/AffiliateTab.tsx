'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import type { BookingAffiliateSettings } from '@/types'

interface AffiliateTabProps {
  businessId: string
  initialSettings: BookingAffiliateSettings | null
}

export function AffiliateTab({ initialSettings }: AffiliateTabProps) {
  const [affiliateId, setAffiliateId] = useState(initialSettings?.affiliate_id ?? '')
  const [isEnabled, setIsEnabled] = useState(initialSettings?.is_enabled ?? false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    const res = await fetch('/api/channels/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliateId, isEnabled }),
    })
    setLoading(false)
    if (res.ok) setSaved(true)
  }

  const searchUrl = affiliateId ? `https://www.booking.com/index.html?aid=${affiliateId}` : ''
  const snippet = affiliateId
    ? `<a href="${searchUrl}" target="_blank" rel="noopener sponsored">Busca y reserva tu hotel con Booking.com</a>`
    : ''

  function copySnippet() {
    if (!snippet) return
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-display font-semibold text-[var(--text-1)]">Afiliados Booking.com</h2>
        <p className="text-sm text-[var(--text-3)] mt-1">
          Airbnb cerró su programa de afiliados abierto en 2021 (hoy solo acepta creadores de contenido grandes, por
          invitación) — Booking.com sí tiene un programa abierto y de auto-registro, con hasta 25-40% de su comisión.
          Regístrate en{' '}
          <a
            href="https://www.booking.com/affiliate-program/v2/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--teal-700)] underline inline-flex items-center gap-0.5"
          >
            partners.booking.com <ExternalLink className="w-3 h-3" />
          </a>{' '}
          y pega aquí tu Affiliate ID (aid).
        </p>
      </div>

      <form onSubmit={handleSave} className="card-surface p-5 space-y-3">
        <input
          placeholder="Tu Affiliate ID (aid) de Booking.com"
          value={affiliateId}
          onChange={(e) => setAffiliateId(e.target.value)}
          className="input-field w-full"
        />
        <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
          <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
          Activo — muestra el widget en tu sitio web
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
          {saved && <span className="text-sm text-green-600">Guardado</span>}
        </div>
      </form>

      {snippet && (
        <div className="card-surface p-5">
          <p className="text-sm font-medium text-[var(--text-1)] mb-2">Código para tu sitio web</p>
          <div className="flex items-center gap-2 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)] px-3 py-2">
            <code className="text-xs text-[var(--text-3)] truncate flex-1">{snippet}</code>
            <button onClick={copySnippet} className="p-1.5 rounded text-[var(--text-3)] hover:bg-white shrink-0">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-[var(--text-3)] mt-2">
            Pégalo en el editor de tu sitio (Dashboard → Sitio Web) o en cualquier página que uses para captar visitantes.
            Cada reserva hecha desde ese enlace en los siguientes 30 días te genera comisión.
          </p>
        </div>
      )}
    </div>
  )
}
