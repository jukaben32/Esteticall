import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessBySlug } from '@/services/businesses'
import { getPublishedWebsiteContent } from '@/services/websites'
import { getAgentById } from '@/services/aiAgents'
import { WebsiteTemplateRenderer } from '@/components/WebsiteTemplateRenderer'
import { FloatingWidgetLauncher } from '@/components/FloatingWidgetLauncher'

// Public marketing site for one business, e.g. example.com/sites/the-blockchain-coders
// or a custom domain mapped to websites.custom_domain. Uses the admin client
// since visitors have no Supabase session — is_published gates visibility.
export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient()
  const business = await getBusinessBySlug(supabase, params.slug)
  if (!business) notFound()

  const content = await getPublishedWebsiteContent(supabase, business.id)
  if (!content) notFound()

  const agent = content.website.ai_agent_id
    ? await getAgentById(supabase, business.id, content.website.ai_agent_id)
    : null

  return (
    <main className="min-h-screen relative">
      <WebsiteTemplateRenderer businessName={business.name} businessPhone={business.phone} content={content} />

      <FloatingWidgetLauncher
        businessId={business.id}
        mode="embed"
        config={{
          name: content.website.site_title || business.name,
          position: 'bottom-right',
          theme: content.website.theme === 'dark' ? 'dark' : 'light',
          primaryColor: content.website.primary_color,
          greetingMessage: agent
            ? `Hi there! 👋 Great to hear from you! What can I help you with?`
            : 'Hi! How can I help you today?',
          agentId: agent?.id ?? null,
          agentName: agent?.name ?? null,
        }}
      />
    </main>
  )
}
