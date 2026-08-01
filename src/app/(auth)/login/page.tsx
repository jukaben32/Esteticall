'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/validations'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data)
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    router.push(searchParams.get('redirect') || '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised p-7 space-y-4">
      <div className="text-center mb-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-1)]">EstateCall</h1>
        <p className="text-sm text-[var(--text-3)]">Accede a tu panel</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-sm text-center text-[var(--text-3)]">
        ¿No tienes cuenta? <a href="/signup" className="text-[var(--teal-700)] font-medium">Regístrate</a>
      </p>
    </form>
  )
}
