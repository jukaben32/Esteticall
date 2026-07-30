import Link from 'next/link'

export default function SiteNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <h1 className="text-2xl font-semibold">Business not found</h1>
      <p className="text-[var(--text-3)]">There&rsquo;s no published site at this address.</p>
      <Link href="/" className="btn-primary">
        Back home
      </Link>
    </div>
  )
}
