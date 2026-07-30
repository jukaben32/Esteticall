import { VoiceWidget } from '@/components/VoiceWidget'
import { DEMO_BUSINESS_ID } from '@/constants'

export default function WidgetDemoPage() {
  if (!DEMO_BUSINESS_ID) {
    return (
      <main className="p-8">
        <p>Set NEXT_PUBLIC_DEMO_BUSINESS_ID in .env.local to preview a live widget here.</p>
      </main>
    )
  }

  return (
    <main className="p-8 flex justify-center">
      <VoiceWidget businessId={DEMO_BUSINESS_ID} />
    </main>
  )
}
