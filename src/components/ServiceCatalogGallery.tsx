'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Check, Plus, X } from 'lucide-react'
import { CATALOG_SERVICES, SERVICE_CATALOG_CATEGORIES, type CatalogService } from '@/constants'

export function ServiceCatalogGallery({
  addedCatalogKeys,
  onAddMany,
}: {
  addedCatalogKeys: Set<string>
  onAddMany: (items: CatalogService[]) => Promise<void>
}) {
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)

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

  const selectedItems = useMemo(
    () => CATALOG_SERVICES.filter((i) => selectedKeys.has(i.key) && !addedCatalogKeys.has(i.key)),
    [selectedKeys, addedCatalogKeys]
  )

  function toggleSelect(item: CatalogService) {
    if (addedCatalogKeys.has(item.key)) return
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(item.key)) next.delete(item.key)
      else next.add(item.key)
      return next
    })
  }

  function selectAllInCategory(items: CatalogService[]) {
    const pending = items.filter((i) => !addedCatalogKeys.has(i.key))
    if (pending.length === 0) return
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      pending.forEach((i) => next.add(i.key))
      return next
    })
  }

  function clearSelection() {
    setSelectedKeys(new Set())
  }

  async function handleAddSelected() {
    if (selectedItems.length === 0 || adding) return
    setAdding(true)
    try {
      await onAddMany(selectedItems)
      setSelectedKeys(new Set())
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="card-surface p-5 relative">
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

          <div className={selectedItems.length > 0 ? 'space-y-6 pb-16' : 'space-y-6'}>
            {[...grouped.entries()].map(([cat, items]) => {
              const allAdded = items.every((i) => addedCatalogKeys.has(i.key))
              const allSelectedOrAdded = items.every(
                (i) => addedCatalogKeys.has(i.key) || selectedKeys.has(i.key)
              )
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[var(--text-1)]">
                      {cat} <span className="text-[var(--text-3)] font-normal">· {items.length}</span>
                    </p>
                    <button
                      onClick={() => selectAllInCategory(items)}
                      disabled={allAdded || allSelectedOrAdded}
                      className="text-xs font-medium text-[var(--teal-700)] hover:underline disabled:text-[var(--text-3)] disabled:no-underline"
                    >
                      {allAdded ? 'Todos agregados' : allSelectedOrAdded ? 'Todos seleccionados' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => {
                      const added = addedCatalogKeys.has(item.key)
                      const selected = !added && selectedKeys.has(item.key)
                      return (
                        <div
                          key={item.key}
                          className={`card-surface p-3 transition-colors ${
                            selected ? 'ring-2 ring-[var(--teal-500)] bg-[var(--teal-50)]' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[var(--text-1)]">{item.name}</p>
                            <button
                              onClick={() => toggleSelect(item)}
                              disabled={added}
                              aria-label={added ? 'Ya agregado' : selected ? 'Quitar de la selección' : 'Seleccionar servicio'}
                              className={`shrink-0 grid place-items-center w-6 h-6 rounded-full border ${
                                added
                                  ? 'bg-[var(--teal-700)] border-[var(--teal-700)] text-white'
                                  : selected
                                    ? 'bg-[var(--teal-600)] border-[var(--teal-600)] text-white'
                                    : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--teal-500)] hover:text-[var(--teal-700)]'
                              }`}
                            >
                              {added || selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span
                              className={
                                added
                                  ? 'text-[var(--teal-700)] font-medium'
                                  : selected
                                    ? 'text-[var(--teal-700)] font-medium'
                                    : 'text-[var(--text-3)]'
                              }
                            >
                              {added
                                ? '✓ Agregado a tu catálogo'
                                : selected
                                  ? '✓ Seleccionado'
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

      {/* Sticky selection bar */}
      {open && selectedItems.length > 0 && (
        <div className="sticky bottom-4 z-20 mt-4">
          <div className="flex items-center justify-between gap-3 bg-[var(--text-1)] text-white rounded-xl px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[var(--teal-600)] grid place-items-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedItems.length === 1 ? '1 servicio seleccionado' : `${selectedItems.length} servicios seleccionados`}
                </p>
                <p className="text-xs text-white/60 hidden sm:block">
                  Clic en &ldquo;Agregar&rdquo; para añadirlos a tu catálogo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clearSelection}
                disabled={adding}
                className="flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white px-2 py-1.5 rounded-lg disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
              <button
                onClick={handleAddSelected}
                disabled={adding}
                className="flex items-center gap-1.5 bg-[var(--teal-600)] hover:bg-[var(--teal-700)] text-white text-xs font-semibold px-3.5 py-2 rounded-lg disabled:opacity-60"
              >
                <Plus className="w-3.5 h-3.5" />
                {adding
                  ? 'Agregando…'
                  : `Agregar ${selectedItems.length === 1 ? '1 servicio' : `todos (${selectedItems.length})`}`}
              </button>
            </div>
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
