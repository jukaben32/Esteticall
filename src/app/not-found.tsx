import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-[var(--text-3)]">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <Link href="/" className="btn-primary">
        Back home
      </Link>
    </div>
  )
}
