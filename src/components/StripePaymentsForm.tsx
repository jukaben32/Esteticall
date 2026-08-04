'use client'

import { useState } from 'react'
import { CreditCard, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import type { Business } from '@/types'

export function StripePaymentsForm({ business }: { business: Business }) {
  const [publishableKey, setPublishableKey] = useState(business.stripe_publishable_key ?? '')
  const [secretKey, setSecretKey] = useState(business.stripe_secret_key ?? '')
  const [showSecret, setShowSecret] = useState(false)
  const [connected, setConnected] = useState(business.stripe_connected)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/settings/stripe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishableKey, secretKey }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      setConnected(data.business.stripe_connected)
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'No se pudo guardar la configuración de Stripe.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-[var(--teal-700)]" />
          <p className="text-sm font-semibold text-[var(--text-1)]">Pago de citas (tu cuenta de Stripe)</p>
        </div>
        <p className="text-xs text-[var(--text-3)] mb-4">
          Los clientes pagan las cuotas de visita directamente a tu cuenta de Stripe. Estas llaves son distintas de
          las llaves de suscripción del SaaS.
        </p>

        {connected ? (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-[var(--teal-50)] text-[var(--teal-800)] text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Conectado — tus clientes ya pueden pagar en línea.
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            No conectado — los clientes solo pueden pagar en efectivo.
            <span className="text-amber-700/80">Ingresa tus llaves de Stripe para habilitar pagos en línea.</span>
          </div>
        )}

        <div className="mb-3">
          <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">
            Llave publicable (empieza con pk_)
          </label>
          <input
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="pk_live_... o pk_test_..."
            className="input-field font-mono text-xs"
          />
          <p className="text-[11px] text-[var(--text-4)] mt-1">Segura de guardar — esta llave es pública.</p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">
            Llave secreta (empieza con sk_)
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_... o sk_test_..."
              className="input-field font-mono text-xs pr-9"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-4)]"
              aria-label={showSecret ? 'Ocultar' : 'Mostrar'}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-4)] mt-1">
            Guardada de forma encriptada. Nunca se comparte con los clientes. Solo se usa desde el servidor para
            crear intents de pago.
          </p>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <button onClick={handleConnect} disabled={saving} className="btn-primary">
          {saving ? 'Conectando…' : 'Conectar Stripe'}
        </button>
        <span className="text-xs text-[var(--text-4)] ml-3">
          Obtén tus llaves en dashboard.stripe.com → Developers → API Keys
        </span>
      </div>

      <div className="card-surface p-4">
        <p className="text-sm font-semibold text-[var(--text-1)] mb-2">Cómo funcionan las dos cuentas de Stripe</p>
        <ul className="text-xs text-[var(--text-3)] space-y-1.5">
          <li>
            <span className="font-medium text-[var(--text-2)]">Suscripción del plan (Free → Pro → Business):</span>{' '}
            se cobra a la cuenta de Stripe del creador del SaaS (configurada en las variables de entorno del
            servidor).
          </li>
          <li>
            <span className="font-medium text-[var(--text-2)]">Pagos de visitas de clientes:</span> se cobran a tu
            cuenta de Stripe — el dinero va directo a ti.
          </li>
        </ul>
      </div>
    </div>
  )
}
