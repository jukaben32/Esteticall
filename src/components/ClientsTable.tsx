'use client'

import { useMemo, useState } from 'react'
import type { Client } from '@/types'

const SOURCE_LABELS: Record<string, string> = {
  ai_call: 'Llamada IA',
  widget_chat: 'Chat del widget',
  manual: 'Manual',
  website_form: 'Formulario del sitio',
}

export function ClientsTable({ initialClients }: { initialClients: Client[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return initialClients
    const q = search.toLowerCase()
    return initialClients.filter((c) =>
      `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)
    )
  }, [initialClients, search])

  return (
    <div>
      <input
        placeholder="Buscar por nombre, teléfono o correo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field w-full mb-4"
      />
      <div className="divide-y divide-[var(--border)]">
        {filtered.map((client) => (
          <div key={client.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-1)]">{client.name}</p>
              <p className="text-xs text-[var(--text-3)] truncate">
                {[client.phone, client.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {client.budget != null && (
                <p className="text-sm font-semibold sm:w-28 sm:text-right text-[var(--teal-700)]">${client.budget.toLocaleString()}</p>
              )}
              <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-700)]">
                {SOURCE_LABELS[client.source] ?? client.source}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">Ningún cliente coincide con esta búsqueda.</p>
        )}
      </div>
    </div>
  )
}
