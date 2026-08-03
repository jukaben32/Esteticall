'use client'

import { useMemo, useState } from 'react'
import { Pencil, Trash2, ChevronDown, Plus, Sparkles, Search, Check, X, CheckCircle2 } from 'lucide-react'
import type { KnowledgeDocument } from '@/types'
import { FAQ_CATEGORIES, FAQ_TEMPLATES, type FaqTemplate } from '@/data/faqTemplates'

type ToastMsg = { id: number; message: string }

const CATEGORY_BADGE: Record<string, string> = {
  'Visitas a propiedades': 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  Compra: 'bg-emerald-50 text-emerald-700',
  Venta: 'bg-purple-50 text-purple-700',
  Alquiler: 'bg-amber-50 text-amber-700',
  'Horario y ubicación': 'bg-red-50 text-red-700',
  'Propiedades de inversión': 'bg-sky-50 text-sky-700',
  'Construcción nueva': 'bg-indigo-50 text-indigo-700',
  'Mercado y precios': 'bg-pink-50 text-pink-700',
  'Proceso y legal': 'bg-slate-100 text-slate-700',
}
const DEFAULT_BADGE = 'bg-[var(--bg-raised)] text-[var(--text-3)]'

function badgeClass(category: string | null) {
  if (!category) return DEFAULT_BADGE
  return CATEGORY_BADGE[category] ?? DEFAULT_BADGE
}

// --- Add/Edit FAQ modal (shared by "Editar FAQ" and "FAQ personalizado") ---
function FaqFormModal({
  title,
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  title: string
  initial: { question: string; answer: string; category: string }
  onCancel: () => void
  onSubmit: (values: { question: string; answer: string; category: string }) => Promise<void>
  submitLabel: string
}) {
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.question.trim() || !values.answer.trim()) return
    setSaving(true)
    await onSubmit(values)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-[var(--bg-page)] rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg text-[var(--text-1)]">{title}</h3>
          <button type="button" onClick={onCancel} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Pregunta *</label>
          <input
            value={values.question}
            onChange={(e) => setValues({ ...values, question: e.target.value })}
            className="input-field w-full mt-1"
            placeholder="¿Cuál es el horario de la agencia?"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Respuesta *</label>
          <textarea
            value={values.answer}
            onChange={(e) => setValues({ ...values, answer: e.target.value })}
            className="input-field w-full mt-1"
            rows={4}
            placeholder="Atendemos de lunes a viernes de 8:00 a.m. a 6:00 p.m..."
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Categoría (opcional)</label>
          <input
            value={values.category}
            onChange={(e) => setValues({ ...values, category: e.target.value })}
            className="input-field w-full mt-1"
            placeholder="Horario, Seguros, Servicios..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export function KnowledgeManager({ initialDocuments }: { initialDocuments: KnowledgeDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null)
  const [addingCustom, setAddingCustom] = useState(false)
  const [addingKeys, setAddingKeys] = useState<Set<string>>(new Set())

  const [templatesOpen, setTemplatesOpen] = useState(true)
  const [templateSearch, setTemplateSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [previewKey, setPreviewKey] = useState<string | null>(null)

  const [toasts, setToasts] = useState<ToastMsg[]>([])

  function pushToast(message: string) {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
  }

  const addedCatalogKeys = useMemo(
    () => new Set(documents.map((d) => d.catalog_key).filter((k): k is string => !!k)),
    [documents]
  )

  const templateCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of FAQ_TEMPLATES) counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1)
    return counts
  }, [])

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase()
    return FAQ_TEMPLATES.filter((t) => {
      if (activeCategory !== 'all' && t.categoryId !== activeCategory) return false
      if (q && !t.question.toLowerCase().includes(q) && !t.answer.toLowerCase().includes(q)) return false
      return true
    })
  }, [templateSearch, activeCategory])

  const templatesByCategory = useMemo(() => {
    const groups = new Map<string, FaqTemplate[]>()
    for (const t of filteredTemplates) {
      const list = groups.get(t.categoryId) ?? []
      list.push(t)
      groups.set(t.categoryId, list)
    }
    return groups
  }, [filteredTemplates])

  async function createDocument(input: { question: string; answer: string; category: string; catalogKey?: string }) {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.question,
        content: input.answer,
        category: input.category || undefined,
        catalogKey: input.catalogKey,
      }),
    })
    if (!res.ok) return null
    const { document } = await res.json()
    return document as KnowledgeDocument
  }

  async function addTemplate(template: FaqTemplate) {
    if (addedCatalogKeys.has(template.key) || addingKeys.has(template.key)) return
    setAddingKeys((prev) => new Set(prev).add(template.key))
    const categoryLabel = FAQ_CATEGORIES.find((c) => c.id === template.categoryId)?.label ?? ''
    const document = await createDocument({
      question: template.question,
      answer: template.answer,
      category: categoryLabel,
      catalogKey: template.key,
    })
    setAddingKeys((prev) => {
      const next = new Set(prev)
      next.delete(template.key)
      return next
    })
    if (document) {
      setDocuments((prev) => [document, ...prev])
      pushToast('FAQ agregada')
    }
  }

  async function addAllInCategory(categoryId: string) {
    const pending = (templatesByCategory.get(categoryId) ?? []).filter((t) => !addedCatalogKeys.has(t.key))
    if (pending.length === 0) return
    setAddingKeys((prev) => {
      const next = new Set(prev)
      pending.forEach((t) => next.add(t.key))
      return next
    })
    const categoryLabel = FAQ_CATEGORIES.find((c) => c.id === categoryId)?.label ?? ''
    const created = await Promise.all(
      pending.map((t) => createDocument({ question: t.question, answer: t.answer, category: categoryLabel, catalogKey: t.key }))
    )
    const successful = created.filter((d): d is KnowledgeDocument => !!d)
    setAddingKeys((prev) => {
      const next = new Set(prev)
      pending.forEach((t) => next.delete(t.key))
      return next
    })
    if (successful.length > 0) {
      setDocuments((prev) => [...successful, ...prev])
      pushToast(successful.length === 1 ? 'FAQ agregada' : `${successful.length} FAQs agregadas`)
    }
  }

  async function saveCustomFaq(values: { question: string; answer: string; category: string }) {
    const document = await createDocument(values)
    if (document) {
      setDocuments((prev) => [document, ...prev])
      pushToast('FAQ agregada')
      setAddingCustom(false)
    }
  }

  async function saveEditFaq(values: { question: string; answer: string; category: string }) {
    if (!editingDoc) return
    const res = await fetch(`/api/knowledge/${editingDoc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: values.question, content: values.answer, category: values.category || undefined }),
    })
    if (res.ok) {
      const { document } = await res.json()
      setDocuments((prev) => prev.map((d) => (d.id === document.id ? document : d)))
      setEditingDoc(null)
    }
  }

  async function removeDoc(documentId: string) {
    if (!confirm('¿Eliminar esta pregunta de tu base de conocimiento?')) return
    const res = await fetch(`/api/knowledge/${documentId}`, { method: 'DELETE' })
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
      pushToast('FAQ eliminada')
    }
  }

  return (
    <div className="relative">
      {/* Header actions */}
      <div className="flex justify-end mb-4">
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setAddingCustom(true)}>
          <Plus className="w-4 h-4" />
          FAQ personalizado
        </button>
      </div>

      {/* Main FAQ list */}
      <div className="space-y-2 mb-6">
        {documents.map((doc) => {
          const expanded = expandedId === doc.id
          return (
            <div key={doc.id} className="card-surface p-3.5">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : doc.id)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-3)] shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                  <span className="font-medium text-[var(--text-1)] truncate">{doc.title}</span>
                  {doc.category && (
                    <span className={`badge border-transparent shrink-0 ${badgeClass(doc.category)}`}>{doc.category}</span>
                  )}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingDoc(doc)}
                    title="Editar"
                    className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--teal-700)]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeDoc(doc.id)}
                    title="Eliminar"
                    className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expanded && (
                <p className="text-sm text-[var(--text-2)] mt-2 pl-6 whitespace-pre-wrap">{doc.content}</p>
              )}
            </div>
          )
        })}
        {documents.length === 0 && (
          <p className="text-sm text-[var(--text-3)] card-surface p-4">
            Todavía no hay conocimiento cargado — agrega preguntas frecuentes desde las plantillas de abajo o crea una
            personalizada.
          </p>
        )}
      </div>

      {/* FAQ Templates library */}
      <div className="card-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setTemplatesOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4"
        >
          <div className="flex items-center gap-2.5 text-left">
            <Sparkles className="w-4 h-4 text-[var(--teal-700)] shrink-0" />
            <div>
              <p className="font-display font-semibold text-[var(--text-1)]">Plantillas de FAQ</p>
              <p className="text-xs text-[var(--text-3)]">
                {FAQ_TEMPLATES.length} preguntas y respuestas listas en {FAQ_CATEGORIES.length} temas — agrégalas con un
                clic
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-3)] shrink-0 transition-transform ${templatesOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {templatesOpen && (
          <div className="px-4 pb-4 border-t border-[var(--border)] pt-4">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Buscar preguntas..."
                className="input-field w-full pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setActiveCategory('all')}
                className={`badge border-transparent ${
                  activeCategory === 'all' ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-raised)] text-[var(--text-2)]'
                }`}
              >
                Todos los temas · {FAQ_TEMPLATES.length}
              </button>
              {FAQ_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`badge border-transparent ${
                    activeCategory === c.id ? 'bg-[var(--teal-700)] text-white' : badgeClass(c.label)
                  }`}
                >
                  {c.label} · {templateCountByCategory.get(c.id) ?? 0}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {FAQ_CATEGORIES.filter((c) => templatesByCategory.has(c.id)).map((cat) => {
                const items = templatesByCategory.get(cat.id) ?? []
                const pendingCount = items.filter((t) => !addedCatalogKeys.has(t.key)).length
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-3)]">
                        {cat.label} · {items.length}
                      </p>
                      {pendingCount > 0 && (
                        <button
                          onClick={() => addAllInCategory(cat.id)}
                          className="text-xs font-semibold text-[var(--teal-700)] hover:underline"
                        >
                          Agregar todas
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((t) => {
                        const added = addedCatalogKeys.has(t.key)
                        const adding = addingKeys.has(t.key)
                        const previewing = previewKey === t.key
                        return (
                          <div key={t.key} className="rounded-lg border border-[var(--border)] p-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-[var(--text-1)] min-w-0 truncate">{t.question}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setPreviewKey(previewing ? null : t.key)}
                                  className="text-xs font-medium text-[var(--text-3)] hover:text-[var(--teal-700)]"
                                >
                                  {previewing ? 'Ocultar' : 'Vista previa'}
                                </button>
                                {added ? (
                                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--teal-700)]">
                                    <Check className="w-3.5 h-3.5" />
                                    Agregada
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => addTemplate(t)}
                                    disabled={adding}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--teal-700)] text-white hover:bg-[var(--teal-800)] disabled:opacity-60 flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {adding ? 'Agregando...' : 'Agregar'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {previewing && <p className="text-xs text-[var(--text-2)] mt-2">{t.answer}</p>}
                            {added && !previewing && (
                              <p className="text-[11px] text-[var(--teal-700)] mt-1">✓ En tu base de conocimiento</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {filteredTemplates.length === 0 && (
                <p className="text-sm text-[var(--text-3)] py-2">Ninguna plantilla coincide con esta búsqueda.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {editingDoc && (
        <FaqFormModal
          title="Editar FAQ"
          submitLabel="Guardar"
          initial={{ question: editingDoc.title, answer: editingDoc.content, category: editingDoc.category ?? '' }}
          onCancel={() => setEditingDoc(null)}
          onSubmit={saveEditFaq}
        />
      )}

      {addingCustom && (
        <FaqFormModal
          title="Agregar FAQ personalizado"
          submitLabel="Agregar FAQ"
          initial={{ question: '', answer: '', category: '' }}
          onCancel={() => setAddingCustom(false)}
          onSubmit={saveCustomFaq}
        />
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
