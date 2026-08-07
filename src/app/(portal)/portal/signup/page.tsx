'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, Building2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { portalSignupSchema } from '@/validations'

export default function PortalSignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    const parsed = portalSignupSchema.safeParse({ name, email, phone, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      return
    }

    setLoading(true)
    const res = await fetch('/api/portal/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    const data = await res.json()
    if (!res.ok) {
      setLoading(false)
      setError(data.error ?? 'No se pudo crear la cuenta')
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password })
    setLoading(false)
    if (signInError) {
      setError('Tu cuenta se creó, pero no se pudo iniciar sesión automáticamente. Intenta iniciar sesión.')
      return
    }

    router.push('/portal')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card-raised w-full max-w-sm p-7 space-y-4">
        <div className="text-center mb-2">
          <span className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-[var(--teal-700)] text-white mb-3">
            <Building2 className="w-6 h-6" />
          </span>
          <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">Create Client Account</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Use the same email you provided when booking</p>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-[var(--teal-50)] p-3 text-xs text-[var(--teal-800)]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Your email must match the one you used when booking a property viewing via our AI receptionist.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field w-full" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full pr-9"
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
        <div>
          <label className="block text-sm font-medium text-[var(--text-1)] mb-1">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field w-full"
            required
            minLength={8}
          />
        </div>

        <button type="submit" className="btn-primary w-full py-3 justify-center" disabled={loading}>
          {loading ? (
            'Creando…'
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create Account
            </>
          )}
        </button>
        <p className="text-sm text-center text-[var(--text-3)]">
          Already have an account?{' '}
          <a href="/portal/login" className="text-[var(--teal-700)] font-medium">
            Sign in
          </a>
        </p>
      </form>
    </div>
  )
}
