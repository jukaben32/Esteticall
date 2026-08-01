'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createBusiness } from '@/services/businesses'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Lands here when a user has a confirmed, logged-in session but no business
// row yet — e.g. their first signup attempt failed partway through (RLS
// rejected the insert because email confirmation was still pending at the
// time). Re-running /signup would fail with "already registered", so this
// picks up exactly where things left off using the session that already exists.
export default function OnboardingPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
        return
      }
      setCheckingSession(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.replace('/login')
      return
    }

    try {
      await createBusiness(supabase, {
        ownerId: user.id,
        name: businessName,
        slug: `${slugify(businessName)}-${user.id.slice(0, 6)}`,
      })
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'No se pudo crear el negocio')
      return
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  if (checkingSession) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="card-raised p-7 space-y-4">
          <div className="text-center mb-2">
            <h1 className="font-display text-2xl font-semibold text-[var(--text-1)]">Un último paso</h1>
            <p className="text-sm text-[var(--text-3)]">¿Cómo se llama tu negocio?</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input-field"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Creando…' : 'Continuar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
