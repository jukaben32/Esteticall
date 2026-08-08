// Platform admin is an env-var allowlist, not a DB role — there's no concept
// of "platform owner" in the schema, and a full RBAC system is overkill while
// InmobilIACall has a single operator. Comma-separated emails in
// PLATFORM_ADMIN_EMAILS get access to /admin (platform_knowledge_documents
// management); everyone else is treated as a regular business owner.
const ADMIN_EMAILS = new Set(
  (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.has(email.toLowerCase())
}
