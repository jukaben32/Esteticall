'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Check, Plus } from 'lucide-react'
import { CATALOG_SERVICES, SERVICE_CATALOG_CATEGORIES, type CatalogService } from '@/constants'

export function ServiceCatalogGallery({
  addedCatalogKeys,
  onAddOne,
  onAddMany,
}: {
  addedCatalogKeys: Set<string>
  onAddOne: (item: CatalogService) => Promise<void>
  onAddMany: (items: CatalogService[]) => Promise<void>
}) {
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [addingKey, setAddingKey] = useState<string | null>(null)
  const [addingCategory, setAddingCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return CATALOG_SERVICES.filter((s) => {
      if (category && s.category !== category) return false
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, category])

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogService[]>()
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [filtered])

  async function handleAddOne(item: CatalogService) {
    setAddingKey(item.key)
    try {
      await onAddOne(item)
    } finally {
      setAddingKey(null)
    }
  }

  async function handleSelectAll(cat: string, items: CatalogService[]) {
    const pending = items.filter((i) => !addedCatalogKeys.has(i.key))
    if (pending.length === 0) return
    setAddingCategory(cat)
    try {
      await onAddMany(pending)
    } finally {
      setAddingCategory(null)
    }
  }

  return (
    <section className="card-surface p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h2 className="font-display font-semibold text-[var(--text-1)]">Catálogo de servicios</h2>
          <p className="text-sm text-[var(--text-3)]">
            {CATALOG_SERVICES.length} servicios en {SERVICE_CATALOG_CATEGORIES.length} especialidades — clic para agregar
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
      </button>

      {open && (
        <div className="mt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicios…"
            className="input-field mb-3"
          />

          <div className="flex flex-wrap gap-2 mb-5">
            <CategoryPill
              label="Todas las especialidades"
              count={CATALOG_SERVICES.length}
              active={category === null}
              onClick={() => setCategory(null)}
            />
            {SERVICE_CATALOG_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                count={CATALOG_SERVICES.filter((s) => s.category === cat).length}
                active={category === cat}
                onClick={() => setCategory(cat)}
              />
            ))}
          </div>

          <div className="space-y-6">
            {[...grouped.entries()].map(([cat, items]) => {
              const allAdded = items.every((i) => addedCatalogKeys.has(i.key))
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[var(--text-1)]">
                      {cat} <span className="text-[var(--text-3)] font-normal">· {items.length}</span>
                    </p>
                    <button
                      onClick={() => handleSelectAll(cat, items)}
                      disabled={allAdded || addingCategory === cat}
                      className="text-xs font-medium text-[var(--teal-700)] hover:underline disabled:text-[var(--text-3)] disabled:no-underline"
                    >
                      {allAdded ? 'Todos agregados' : addingCategory === cat ? 'Agregando…' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => {
                      const added = addedCatalogKeys.has(item.key)
                      return (
                        <div key={item.key} className="card-surface p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[var(--text-1)]">{item.name}</p>
                            <button
                              onClick={() => handleAddOne(item)}
                              disabled={added || addingKey === item.key}
                              aria-label={added ? 'Ya agregado' : 'Agregar servicio'}
                              className={`shrink-0 grid place-items-center w-6 h-6 rounded-full border ${
                                added
                                  ? 'bg-[var(--teal-700)] border-[var(--teal-700)] text-white'
                                  : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--teal-500)] hover:text-[var(--teal-700)]'
                              }`}
                            >
                              {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span
                              className={added ? 'text-[var(--teal-700)] font-medium' : 'text-[var(--text-3)]'}
                            >
                              {added
                                ? '✓ Agregado a tu catálogo'
                                : item.priceType === 'starting_at'
                                  ? `Desde $${item.price.toLocaleString()}`
                                  : `$${item.price.toLocaleString()}`}
                            </span>
                            <span className="text-[var(--text-3)]">{item.durationMinutes} min</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-[var(--text-3)] py-4 text-center">Ningún servicio coincide con esa búsqueda.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-raised)] text-[var(--text-2)] hover:bg-[var(--teal-50)]'
      }`}
    >
      {label} · {count}
    </button>
  )
}
