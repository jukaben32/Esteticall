'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [spinning, setSpinning] = useState(false)

  function handleRefresh() {
    setSpinning(true)
    startTransition(() => {
      router.refresh()
    })
    setTimeout(() => setSpinning(false), 600)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="btn-secondary"
      aria-label="Actualizar datos"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
      Actualizar
    </button>
  )
}
