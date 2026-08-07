'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/validations'

export default function PortalLoginPage() {
  return (
    <Suspense>
      <PortalLoginForm />
    </Suspense>
  )
}

function PortalLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    router.push(searchParams.get('redirect') || '/portal')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card-raised w-full max-w-sm p-7 space-y-4">
        <div className="text-center mb-2">
          <span className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-[var(--teal-700)] text-white mb-3">
            <Building2 className="w-6 h-6" />
          </span>
          <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">Client Portal</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Inicia sesión para ver tus citas</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@ejemplo.com"
            className="input-field w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-4)]"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full py-3 justify-center" disabled={loading}>
          {loading ? (
            'Entrando…'
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Entrar
            </>
          )}
        </button>
        <p className="text-sm text-center text-[var(--text-3)]">
          ¿No tienes cuenta?{' '}
          <a href="/portal/signup" className="text-[var(--teal-700)] font-medium">
            Crea una
          </a>
        </p>
      </form>
    </div>
  )
}
