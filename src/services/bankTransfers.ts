import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BankTransferPayment, PlanId } from '@/types'
import { PLAN_LIMITS } from '@/constants'
import { activatePlanForBusiness } from '@/services/billing'

type DB = SupabaseClient<Database>

// One pending request per business at a time — a second click on "Pagar por
// transferencia" while one is already awaiting review should resume it
// instead of creating a confusing duplicate with a different reference code.
export async function getPendingBankTransfer(supabase: DB, businessId: string): Promise<BankTransferPayment | null> {
  const { data, error } = await supabase
    .from('bank_transfer_payments')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createBankTransferRequest(
  supabase: DB,
  businessId: string,
  plan: Exclude<PlanId, 'free'>
): Promise<BankTransferPayment> {
  const existing = await getPendingBankTransfer(supabase, businessId)
  if (existing) return existing

  const { data, error } = await supabase
    .from('bank_transfer_payments')
    .insert({ business_id: businessId, plan, amount_usd: PLAN_LIMITS[plan].priceUsd })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function attachReceiptToBankTransfer(
  adminSupabase: DB,
  businessId: string,
  transferId: string,
  receiptUrl: string
): Promise<BankTransferPayment> {
  const { data, error } = await adminSupabase
    .from('bank_transfer_payments')
    .update({ receipt_url: receiptUrl })
    .eq('id', transferId)
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export type BankTransferWithBusiness = BankTransferPayment & { business_name: string }

export async function listBankTransfersForAdmin(
  adminSupabase: DB,
  status: 'pending' | 'all' = 'pending'
): Promise<BankTransferWithBusiness[]> {
  let query = adminSupabase
    .from('bank_transfer_payments')
    .select('*, businesses(name)')
    .order('created_at', { ascending: false })
  if (status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as (BankTransferPayment & { businesses: { name: string } | null })[]).map((row) => {
    const { businesses, ...rest } = row
    return { ...rest, business_name: businesses?.name ?? 'Negocio desconocido' }
  })
}

// Runs the identical plan-activation effect Stripe's webhook produces —
// see activatePlanForBusiness in billing.ts — so approving a transfer looks
// no different to the business than a card payment succeeding.
export async function approveBankTransfer(
  adminSupabase: DB,
  transferId: string,
  reviewerEmail: string
): Promise<BankTransferPayment> {
  const { data: transfer, error: fetchError } = await adminSupabase
    .from('bank_transfer_payments')
    .select('*')
    .eq('id', transferId)
    .eq('status', 'pending')
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!transfer) throw new Error('Solicitud no encontrada o ya revisada')

  await activatePlanForBusiness(adminSupabase, transfer.business_id, transfer.plan)

  const { data, error } = await adminSupabase
    .from('bank_transfer_payments')
    .update({ status: 'approved', reviewed_by: reviewerEmail, reviewed_at: new Date().toISOString() })
    .eq('id', transferId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function rejectBankTransfer(
  adminSupabase: DB,
  transferId: string,
  reviewerEmail: string,
  reason?: string
): Promise<BankTransferPayment> {
  const { data, error } = await adminSupabase
    .from('bank_transfer_payments')
    .update({
      status: 'rejected',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq('id', transferId)
    .eq('status', 'pending')
    .select('*')
    .single()
  if (error) throw error
  return data
}
