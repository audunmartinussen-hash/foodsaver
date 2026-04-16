import { NextResponse } from 'next/server'

/**
 * Deprecated: PayMongo online checkout was removed for the April 2026 launch
 * pivot. FoodSaver no longer processes merchant payments — buyers pay stores
 * in cash at pickup and pay a separate reservation fee to FoodSaver via the
 * manual GCash flow at `/reserve/[id]`.
 *
 * The route is kept so that any client bundle not yet shipped gets a clear
 * 410 instead of a confusing 404, and so we can still run the existing
 * webhook (`/api/webhooks/paymongo`) for orders paid through the old flow.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Online checkout has been removed. Use the reservation fee flow instead.',
      redirect: '/',
    },
    { status: 410 },
  )
}
