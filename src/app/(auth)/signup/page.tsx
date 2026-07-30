'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = signupSchema.safeParse({ businessName, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
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
      setError(authError?.message ?? 'Sign up failed')
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
      setError(err instanceof Error ? err.message : 'Could not create business')
      return
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
      <h1 className="text-xl font-semibold">Create your business account</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        type="text"
        placeholder="Business name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        required
        minLength={8}
      />
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Creating…' : 'Sign up'}
      </button>
      <p className="text-sm text-center">
        Already have an account? <a href="/login" className="underline">Log in</a>
      </p>
    </form>
  )
}
