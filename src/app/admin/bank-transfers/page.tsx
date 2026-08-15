import { createAdminClient } from '@/lib/supabase/admin'
import { listBankTransfersForAdmin } from '@/services/bankTransfers'
import { BankTransferAdminManager } from '@/components/BankTransferAdminManager'

// AdminLayout already gates this route on isPlatformAdmin(). Reads use the
// admin (service-role) client, not the user-scoped one — RLS on
// bank_transfer_payments only grants each business owner SELECT on their own
// rows, so a platform admin (who owns none of these businesses) would see
// nothing through the regular client.
export default async function AdminBankTransfersPage() {
  const admin = createAdminClient()
  const transfers = await listBankTransfersForAdmin(admin, 'pending')

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Transferencias bancarias</h1>
        <p className="text-sm text-[var(--text-3)]">
          Solicitudes de mejora de plan pagadas por transferencia, pendientes de verificar contra tu cuenta de banco.
          Aprobar activa el plan del negocio exactamente igual que un pago con tarjeta.
        </p>
      </div>
      <BankTransferAdminManager initialTransfers={transfers} />
    </div>
  )
}
