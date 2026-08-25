'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
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

    router.push(searchParams.get('redirect') || '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised p-7 space-y-4">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-1)]">Bienvenido de nuevo</h1>
        <p className="text-sm text-[var(--text-3)]">
          Inicia sesión en tu panel de Esteti<span className="text-[var(--teal-700)] font-medium">C</span>all
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@ejemplo.com"
          className="input-field"
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
            className="input-field pr-9"
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
      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
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
        <a href="/signup" className="text-[var(--teal-700)] font-medium">
          Crea una gratis
        </a>
      </p>
      <p className="text-[11px] text-center text-[var(--text-4)] pt-1">
        Al iniciar sesión aceptas nuestros{' '}
        <a href="#" className="underline hover:text-[var(--text-3)]">
          Términos de Servicio
        </a>{' '}
        y{' '}
        <a href="#" className="underline hover:text-[var(--text-3)]">
          Política de Privacidad
        </a>
        .
      </p>
    </form>
  )
}
