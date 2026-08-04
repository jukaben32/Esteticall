'use client'

import { useState } from 'react'
import { Building2, MapPin, Globe2 } from 'lucide-react'
import type { Business } from '@/types'

const TIMEZONES = [
  'America/Santo_Domingo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/Madrid',
  'UTC',
]

interface FormState {
  name: string
  phone: string
  contactEmail: string
  website: string
  address: string
  city: string
  state: string
  zipCode: string
  timezone: string
}

function toForm(business: Business): FormState {
  return {
    name: business.name ?? '',
    phone: business.phone ?? '',
    contactEmail: business.contact_email ?? '',
    website: business.website ?? '',
    address: business.address ?? '',
    city: business.city ?? '',
    state: business.state ?? '',
    zipCode: business.zip_code ?? '',
    timezone: business.timezone ?? 'UTC',
  }
}

export function BusinessProfileForm({ business }: { business: Business }) {
  const [form, setForm] = useState<FormState>(toForm(business))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function patch(p: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...p }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-[var(--teal-700)]" />
          <p className="text-sm font-semibold text-[var(--text-1)]">Identidad de la agencia</p>
        </div>
        <p className="text-xs text-[var(--text-3)] mb-4">Nombre y datos de contacto de tu agencia.</p>

        <div className="mb-3">
          <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Nombre de la agencia *</label>
          <input
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Sunrise Realty Group"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Teléfono</label>
            <input
              value={form.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="(555) 000-0000"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Correo electrónico</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => patch({ contactEmail: e.target.value })}
              placeholder="info@tuagencia.com"
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Sitio web</label>
          <input
            value={form.website}
            onChange={(e) => patch({ website: e.target.value })}
            placeholder="https://tuagencia.com"
            className="input-field"
          />
        </div>
      </div>

      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-[var(--teal-700)]" />
          <p className="text-sm font-semibold text-[var(--text-1)]">Ubicación de la agencia</p>
        </div>
        <p className="text-xs text-[var(--text-3)] mb-4">Dirección física que se muestra a los clientes.</p>

        <div className="mb-3">
          <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Dirección</label>
          <input
            value={form.address}
            onChange={(e) => patch({ address: e.target.value })}
            placeholder="123 Realty Street, Suite 100"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Ciudad</label>
            <input value={form.city} onChange={(e) => patch({ city: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Estado / Provincia</label>
            <input value={form.state} onChange={(e) => patch({ state: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1 block">Código postal</label>
            <input
              value={form.zipCode}
              onChange={(e) => patch({ zipCode: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe2 className="w-4 h-4 text-[var(--teal-700)]" />
          <p className="text-sm font-semibold text-[var(--text-1)]">Configuración regional</p>
        </div>
        <p className="text-xs text-[var(--text-3)] mb-4">Zona horaria usada para agendar citas.</p>

        <select value={form.timezone} onChange={(e) => patch({ timezone: e.target.value })} className="input-field">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-[var(--teal-700)] font-medium">Guardado ✓</span>}
        <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
