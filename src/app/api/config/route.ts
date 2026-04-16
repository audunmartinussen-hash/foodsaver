import { NextResponse } from 'next/server'
import { getPlatformConfig } from '@/lib/platformConfig.server'

/**
 * Public config endpoint. Used by client code (reservation fee page) to read
 * tunable values such as the reservation fee amount and GCash receiver
 * details without having to bundle them as env vars at build time.
 *
 * Values in `platform_config` are public by design (RLS allows SELECT
 * to everyone) so this route can be unauthenticated.
 */
export async function GET() {
  const config = await getPlatformConfig()
  return NextResponse.json(config, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  })
}
