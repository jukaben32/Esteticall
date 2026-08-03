'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { FloatingWidgetLauncher, type WidgetVisualConfig } from '@/components/FloatingWidgetLauncher'

// Minimal-chrome page meant to be iframed on a third-party site — the
// widget-script loader points an iframe here with ?agentId & style hints
// pulled from the <script data-*> tag. Deliberately has no header/nav, and
// the body stays fully transparent so only the bubble/panel is visible.
export default function EmbedWidgetPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const searchParams = useSearchParams()
  const [config, setConfig] = useState<WidgetVisualConfig | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isFloating = searchParams.get('floating') === '1'
  const agentIdParam = searchParams.get('agentId')

  useEffect(() => {
    const qs = agentIdParam ? `?agentId=${encodeURIComponent(agentIdParam)}` : ''
    fetch(`/api/widget/${businessId}/config${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error('Widget not available')
        return res.json()
      })
      .then((data) =>
        setConfig({
          widgetId: data.widgetId,
          name: data.widgetName ?? 'Widget',
          position: data.position ?? 'bottom-right',
          theme: data.theme ?? 'light',
          primaryColor: data.primary_color,
          greetingMessage: data.greeting_message,
          agentId: data.agentId,
          agentName: data.agentName,
        })
      )
      .catch((err) => setLoadError(err.message))
  }, [businessId, agentIdParam])

  if (loadError) return null // fail silently on a third-party site — no broken UI
  if (!config) return null

  if (isFloating) {
    return (
      <div className="fixed inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <FloatingWidgetLauncher businessId={businessId} config={config} mode="embed" />
        </div>
      </div>
    )
  }

  // Non-floating fallback (e.g. old iframe-embed snippets pointing straight
  // at this page without ?floating=1): render the panel already open.
  return (
    <div className="p-4 flex justify-center">
      <FloatingWidgetLauncher businessId={businessId} config={config} mode="inline" defaultOpen />
    </div>
  )
}
