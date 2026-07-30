import { NextResponse } from 'next/server'

// Lightweight connectivity check for embedders: GET /widget-test?business=<id>
// confirms the widget config endpoint is reachable before they wire up the
// real embed script.
export async function GET(request: Request) {
  const businessId = new URL(request.url).searchParams.get('business')
  if (!businessId) {
    return NextResponse.json({ ok: false, error: 'Missing ?business=<id>' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${appUrl}/api/widget/${businessId}/config`, { cache: 'no-store' })

  return NextResponse.json({ ok: res.ok, status: res.status })
}
