'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createBusiness } from '@/services/businesses'
import { signupSchema } from '@/validations'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function SignupPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = signupSchema.safeParse({ businessName, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (authError || !data.user) {
      setLoading(false)
      setError(authError?.message ?? 'No se pudo crear la cuenta')
      return
    }

    try {
      await createBusiness(supabase, {
        ownerId: data.user.id,
        name: parsed.data.businessName,
        slug: `${slugify(parsed.data.businessName)}-${data.user.id.slice(0, 6)}`,
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

  return (
    <form onSubmit={handleSubmit} className="card-raised p-7 space-y-4">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-1)]">Crea tu cuenta</h1>
        <p className="text-sm text-[var(--text-3)]">Empieza gratis, sin tarjeta</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Nombre del negocio</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Mi Agencia Inmobiliaria"
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Correo</label>
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
            minLength={8}
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
          'Creando…'
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            Crear cuenta
          </>
        )}
      </button>
      <p className="text-sm text-center text-[var(--text-3)]">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-[var(--teal-700)] font-medium">
          Inicia sesión
        </a>
      </p>
      <p className="text-[11px] text-center text-[var(--text-4)] pt-1">
        Al crear tu cuenta aceptas nuestros{' '}
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
