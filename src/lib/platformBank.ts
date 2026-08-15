// Bank details for the manual bank-transfer plan-upgrade path — env vars, not
// a DB row, same reasoning as platformAdmin.ts: there's a single platform
// operator, not a per-business bank account. PLATFORM_BANK_ACCOUNT_HOLDER is
// intentionally never exposed in any API response or UI — the business owner
// asked for the holder name to stay off the customer-facing screen, and
// nothing else in the app needs to display it back.
export interface PlatformBankConfig {
  bankName: string
  accountNumber: string
}

export function getPlatformBankConfig(): PlatformBankConfig | null {
  const bankName = process.env.PLATFORM_BANK_NAME
  const accountNumber = process.env.PLATFORM_BANK_ACCOUNT_NUMBER
  if (!bankName || !accountNumber) return null
  return { bankName, accountNumber }
}

export function isBankTransferConfigured(): boolean {
  return getPlatformBankConfig() !== null
}
