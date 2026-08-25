'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarCheck, Package, FileSignature, MessageCircleQuestion, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LINKS = [
  { href: '/portal', label: 'Mis Citas', icon: CalendarCheck },
  { href: '/portal/paquetes', label: 'Paquetes', icon: Package },
  { href: '/portal/consentimientos', label: 'Consentimientos', icon: FileSignature },
  { href: '/portal/support', label: 'Soporte', icon: MessageCircleQuestion },
]

export function PortalNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portal/login')
    router.refresh()
  }

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-[var(--teal-700)] text-white font-display font-bold text-sm">
            E
          </span>
          <span className="font-display font-semibold text-[var(--text-1)]">Portal del Paciente</span>
        </div>
        <nav className="flex items-center gap-1.5 flex-wrap justify-end">
          {LINKS.map((link) => {
            const active = link.href === '/portal' ? pathname === link.href : pathname?.startsWith(link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn-secondary !py-1.5 !text-xs ${active ? '!bg-[var(--teal-50)] !text-[var(--teal-700)] !border-transparent' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            )
          })}
          <button type="button" onClick={handleSignOut} className="btn-secondary !py-1.5 !text-xs">
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </nav>
      </div>
    </header>
  )
}
