import { Images } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForOwner } from '@/services/businesses'
import { listBeforeAfterPhotosForBusiness } from '@/services/beforeAfterPhotos'
import { listClientsForBusiness } from '@/services/clients'
import { BeforeAfterGallery } from '@/components/BeforeAfterGallery'

export default async function AntesDespuesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  // Signed URLs for the private patient-photos bucket require the
  // service-role client — the signed-in business owner's own client has no
  // Storage policy for it, same convention as the website photo uploader.
  const admin = createAdminClient()
  const [photos, clients] = await Promise.all([
    listBeforeAfterPhotosForBusiness(admin, business.id),
    listClientsForBusiness(supabase, business.id),
  ])

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <Images className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Antes y Después</h1>
          <p className="text-sm text-[var(--text-3)]">
            Galería privada de resultados por paciente — nunca pública, ni siquiera en tu sitio web.
          </p>
        </div>
      </div>
      <BeforeAfterGallery initialPhotos={photos} clients={clients} />
    </div>
  )
}
