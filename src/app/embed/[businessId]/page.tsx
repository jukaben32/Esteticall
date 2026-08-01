import { VoiceWidget } from '@/components/VoiceWidget'

// Minimal-chrome page meant to be iframed on a third-party site — the
// snippet on /dashboard/widget points here. Deliberately has no header/nav.
export default function EmbedWidgetPage({ params }: { params: { businessId: string } }) {
  return (
    <div className="p-4 flex justify-center">
      <VoiceWidget businessId={params.businessId} />
    </div>
  )
}
