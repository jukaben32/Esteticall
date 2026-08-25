import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/platformAdmin'

// Separate from (dashboard) on purpose: this manages platform_knowledge_documents,
// which has no business_id and isn't scoped to any one affiliated business — it
// belongs to EstetiCall itself, not to a business owner's dashboard.
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
            E
          </span>
          <div>
            <p className="font-display font-semibold text-[var(--text-1)] leading-tight">Admin de plataforma</p>
            <p className="text-xs text-[var(--text-3)] leading-tight">
              Esteti<span className="text-[var(--teal-600)]">C</span>all — no visible para negocios afiliados
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          Volver al dashboard
        </Link>
      </header>
      <nav className="max-w-4xl mx-auto px-4 lg:px-6 pt-4 flex gap-2">
        <Link href="/admin/knowledge" className="btn-secondary text-xs px-3 py-1.5">
          Conocimiento
        </Link>
        <Link href="/admin/bank-transfers" className="btn-secondary text-xs px-3 py-1.5">
          Transferencias bancarias
        </Link>
      </nav>
      <main className="max-w-4xl mx-auto p-4 lg:p-6">{children}</main>
    </div>
  )
}
