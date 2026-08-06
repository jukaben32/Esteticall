'use client'

import { useState } from 'react'
import { GripVertical, Pencil, Trash2, Sparkles, CheckCircle2, Briefcase } from 'lucide-react'
import type { BusinessService } from '@/types'
import type { CatalogService } from '@/constants'
import { formatServicePrice } from '@/lib/serviceFormat'
import { ServiceEditModal } from './ServiceEditModal'
import { ServiceCatalogGallery } from './ServiceCatalogGallery'

type ToastMsg = { id: number; message: string }

export function ServicesManager({ initialServices }: { initialServices: BusinessService[] }) {
  const [services, setServices] = useState(
    [...initialServices].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessService | undefined>(undefined)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  function pushToast(message: string) {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
  }

  const addedCatalogKeys = new Set(services.map((s) => s.catalog_key).filter(Boolean) as string[])

  function openCreate() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function openEdit(service: BusinessService) {
    setEditing(service)
    setModalOpen(true)
  }

  function handleSaved(service: BusinessService) {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === service.id)
      return exists ? prev.map((s) => (s.id === service.id ? service : s)) : [...prev, service]
    })
    setModalOpen(false)
  }

  async function toggleActive(service: BusinessService) {
    const res = await fetch(`/api/services/${service.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !service.is_active }),
    })
    if (res.ok) {
      const { service: updated } = await res.json()
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    }
  }

  async function remove(serviceId: string) {
    if (!confirm('¿Eliminar este servicio? Ya no estará disponible para tus agentes.')) return
    const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' })
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      pushToast('Servicio eliminado')
    }
  }

  async function addManyFromCatalog(items: CatalogService[]) {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item, i) => ({
          name: item.name,
          description: item.description,
          durationMinutes: item.durationMinutes,
          priceType: item.priceType,
          price: item.price,
          catalogKey: item.key,
          isActive: true,
          sortOrder: services.length + i,
        })),
      }),
    })
    if (res.ok) {
      const { services: created } = await res.json()
      setServices((prev) => [...prev, ...created])
      pushToast(created.length === 1 ? '1 servicio agregado' : `${created.length} servicios agregados`)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudieron agregar los servicios')
    }
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    setServices((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      // Persist new order in the background — one PATCH per row that moved.
      next.forEach((s, i) => {
        if (s.sort_order !== i) {
          fetch(`/api/services/${s.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: i }),
          }).catch(() => {})
        }
      })
      return next.map((s, i) => ({ ...s, sort_order: i }))
    })
    setDragIndex(null)
  }

  return (
    <div className="space-y-6">
      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Servicios de la agencia</h2>
            <p className="text-sm text-[var(--text-3)]">{services.length} servicios en tu catálogo</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <Sparkles className="w-3.5 h-3.5" />
            Servicio personalizado
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-2">
          {services.map((service, i) => (
            <div
              key={service.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className="card-surface p-3 flex items-center gap-3"
            >
              <GripVertical className="w-4 h-4 text-[var(--text-4)] cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-[var(--text-1)]">{service.name}</p>
                  <span className="text-xs text-[var(--text-3)]">
                    {service.duration_minutes} min · {formatServicePrice(service)}
                  </span>
                </div>
                {service.description && <p className="text-xs text-[var(--text-3)] mt-0.5">{service.description}</p>}
              </div>
              <button
                onClick={() => toggleActive(service)}
                className={`badge border-transparent shrink-0 ${
                  service.is_active ? 'bg-[var(--teal-50)] text-[var(--teal-800)]' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
                }`}
              >
                {service.is_active ? 'Activo' : 'Inactivo'}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(service)}
                  aria-label="Editar"
                  className="p-2 rounded-lg text-[var(--text-3)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(service.id)}
                  aria-label="Eliminar"
                  className="p-2 rounded-lg text-[var(--text-3)] hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <Briefcase className="w-5 h-5" />
              </span>
              <p className="text-sm text-[var(--text-3)]">
                Todavía no hay servicios — agrega uno del catálogo abajo o crea el tuyo.
              </p>
            </div>
          )}
        </div>
      </section>

      <ServiceCatalogGallery
        addedCatalogKeys={addedCatalogKeys}
        onAddMany={addManyFromCatalog}
      />

      {modalOpen && (
        <ServiceEditModal service={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-[var(--teal-800)] text-white text-sm px-3.5 py-2.5 rounded-lg shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
