import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/platformAdmin'

// Separate from (dashboard) on purpose: this manages platform_knowledge_documents,
// which has no business_id and isn't scoped to any one affiliated agency — it
// belongs to InmobilIACall itself, not to a business owner's dashboard.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isPlatformAdmin(user.email)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--teal-700)] text-white font-display font-bold text-lg">
            I
          </span>
          <div>
            <p className="font-display font-semibold text-[var(--text-1)] leading-tight">Admin de plataforma</p>
            <p className="text-xs text-[var(--text-3)] leading-tight">
              Inmobil<span className="text-[var(--teal-600)]">IA</span>Call — no visible para negocios afiliados
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          Volver al dashboard
        </Link>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-6">{children}</main>
    </div>
  )
}
