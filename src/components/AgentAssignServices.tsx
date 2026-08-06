'use client'

import { useMemo, useState } from 'react'
import { Briefcase } from 'lucide-react'
import type { BusinessService } from '@/types'
import { formatServicePrice } from '@/lib/serviceFormat'

export function AgentAssignServices({
  services,
  selectedIds,
  onChange,
}: {
  services: BusinessService[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase())),
    [services, filter]
  )
  const allSelected = services.length > 0 && selectedIds.length === services.length

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  function selectAll() {
    onChange(allSelected ? [] : services.map((s) => s.id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <Briefcase className="w-4 h-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--text-1)]">¿De qué servicios puede hablar este agente?</p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            El agente solo recomendará y responderá preguntas sobre los servicios que selecciones aquí. Distintos
            agentes pueden tener distintos alcances.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar servicios…"
          className="input-field flex-1"
        />
        <button type="button" onClick={selectAll} className="btn-secondary shrink-0">
          {allSelected ? 'Ninguno' : 'Seleccionar todos'}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
        <span>{services.length} servicios disponibles</span>
        <span>{selectedIds.length} seleccionados</span>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2">
        {filtered.map((service) => {
          const checked = selectedIds.includes(service.id)
          return (
            <label
              key={service.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                checked ? 'border-[var(--teal-500)] bg-[var(--teal-50)]' : 'border-[var(--border)]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(service.id)}
                className="mt-0.5 accent-[var(--teal-700)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">{service.name}</p>
                  <span className="text-xs font-semibold text-[var(--teal-700)] shrink-0">
                    {formatServicePrice(service)}
                  </span>
                </div>
                {service.description && (
                  <p className="text-xs text-[var(--text-3)] mt-0.5 line-clamp-2">{service.description}</p>
                )}
              </div>
            </label>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <Briefcase className="w-4 h-4" />
            </span>
            <p className="text-sm text-[var(--text-3)]">
              {services.length === 0
                ? 'Todavía no tienes servicios — créalos en Dashboard → Servicios.'
                : 'Ningún servicio coincide con ese filtro.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
