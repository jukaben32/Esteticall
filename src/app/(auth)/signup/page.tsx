'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Rocket, MailCheck, ArrowLeft } from 'lucide-react'
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
  // Set once signUp() succeeds but Supabase requires email confirmation
  // before a session exists — matches the reference video's "we got the
  // email sending confirmation, click Back to Sign Up" screen.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

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
      options: {
        data: { business_name: parsed.data.businessName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    // An existing, already-confirmed account signing up again comes back
    // with a user but an empty identities array and no error.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false)
      setError('Ya existe una cuenta con este correo. Intenta iniciar sesión.')
      return
    }

    // No session yet → Supabase is waiting on email confirmation. Business
    // creation needs an authenticated session (RLS), so it happens later —
    // either automatically after the user confirms + logs in for the first
    // time and /dashboard finds no business, sending them to /onboarding.
    if (!data.session) {
      setLoading(false)
      setPendingEmail(parsed.data.email)
      return
    }

    try {
      await createBusiness(supabase, {
        ownerId: data.user!.id,
        name: parsed.data.businessName,
        slug: `${slugify(parsed.data.businessName)}-${data.user!.id.slice(0, 6)}`,
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

  if (pendingEmail) {
    return (
      <div className="card-raised p-7 space-y-4 text-center">
        <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-[var(--teal-50)]">
          <MailCheck className="w-7 h-7 text-[var(--teal-700)]" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">Revisa tu correo</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">
            Te enviamos un enlace de confirmación a <span className="font-medium text-[var(--text-1)]">{pendingEmail}</span>.
            Ábrelo para verificar tu cuenta y luego inicia sesión.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPendingEmail(null)
            setPassword('')
          }}
          className="btn-secondary w-full py-2.5 justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a registro
        </button>
        <a href="/login" className="block text-sm text-[var(--teal-700)] font-medium">
          Ya confirmé mi correo, iniciar sesión
        </a>
      </div>
    )
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
