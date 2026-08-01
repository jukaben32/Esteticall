import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-[var(--teal-700)] text-white font-display font-bold text-xl">
          E
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
