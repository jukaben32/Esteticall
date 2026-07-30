import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessBySlug } from '@/services/businesses'
import { listListingsForBusiness } from '@/services/listings'
import { VoiceWidget } from '@/components/VoiceWidget'

// Public marketing site for one business, e.g. real-estate-co.example.com/sites/real-estate-co
// or a custom domain mapped to websites.custom_domain. Uses the admin client
// since visitors have no Supabase session — access is scoped by is_published /
// status = 'available' RLS policies regardless, so this stays read-only-safe.
export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient()
  const business = await getBusinessBySlug(supabase, params.slug)
  if (!business) notFound()

  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_published', true)
    .maybeSingle()
  if (!website) notFound()

  const listings = await listListingsForBusiness(supabase, business.id, { status: 'available' })

  return (
    <main className="min-h-screen">
      <header className="p-8 text-center gradient-teal text-white">
        <h1 className="text-3xl font-semibold">{business.name}</h1>
        {website.headline && <p className="mt-2">{website.headline}</p>}
      </header>

      {website.about && (
        <section className="max-w-2xl mx-auto p-8 text-center">
          <p>{website.about}</p>
        </section>
      )}

      <section className="max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="card-surface p-4">
            {listing.cover_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.cover_photo_url}
                alt={listing.title}
                className="rounded-lg mb-2 aspect-video object-cover w-full"
              />
            )}
            <p className="font-medium">{listing.title}</p>
            <p className="text-sm text-[var(--text-3)]">{listing.city ?? listing.area_name}</p>
            <p className="font-semibold mt-1">
              ${listing.price.toLocaleString()}
              {listing.listing_type === 'rent' ? '/mo' : ''}
            </p>
          </div>
        ))}
        {listings.length === 0 && (
          <p className="col-span-full text-center text-[var(--text-3)]">
            No listings published yet.
          </p>
        )}
      </section>

      <section className="p-8 flex justify-center">
        <VoiceWidget businessId={business.id} />
      </section>
    </main>
  )
}
