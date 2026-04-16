import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generatePickupCode, formatTime } from '@/lib/utils'
import { sendSms, smsReservationConfirmed } from '@/lib/sms'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email'

/**
 * Admin-only: confirm a reservation after visually verifying the GCash
 * screenshot matches a payment that arrived.
 *
 * Side effects (all best-effort; failures are logged but don't roll back
 * the core DB update):
 *   - Transition status to `confirmed`
 *   - Generate a 4-digit pickup code if one isn\u2019t set
 *   - Send SMS + email to the buyer
 *   - Send new-order email to the merchant
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service-role client for the update + cross-user reads (auth emails,
  // merchant owner lookups). Fall back to the user client when the key isn\u2019t set.
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const svc = serviceUrl && serviceKey
    ? createServiceClient(serviceUrl, serviceKey, { auth: { persistSession: false } })
    : userClient

  const { data: order, error: fetchErr } = await svc
    .from('orders')
    .select('*, listing:listings(*), store:stores(*)')
    .eq('id', id)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }
  if (order.status !== 'pending_verification') {
    return NextResponse.json({ error: `Cannot verify while status is ${order.status}` }, { status: 400 })
  }

  const pickupCode = order.pickup_code || generatePickupCode()
  const now = new Date().toISOString()

  const { error: updateErr } = await svc
    .from('orders')
    .update({
      status: 'confirmed',
      pickup_code: pickupCode,
      reservation_fee_verified_at: now,
      reservation_fee_verified_by: user.id,
      payment_status: 'paid',
      reservation_fee_rejected_reason: null,
    })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // --- Best-effort notifications ---
  try {
    let consumerEmail: string | undefined
    let ownerEmail: string | undefined

    if ('auth' in svc && svc.auth && 'admin' in (svc.auth as object)) {
      const { data: consumerAuth } = await (svc.auth as typeof userClient.auth & { admin: { getUserById: (id: string) => Promise<{ data: { user: { email?: string } | null } }> } }).admin.getUserById(order.consumer_id)
      consumerEmail = consumerAuth?.user?.email
      if (order.store?.owner_id) {
        const { data: ownerAuth } = await (svc.auth as typeof userClient.auth & { admin: { getUserById: (id: string) => Promise<{ data: { user: { email?: string } | null } }> } }).admin.getUserById(order.store.owner_id)
        ownerEmail = ownerAuth?.user?.email
      }
    }

    const { data: consumerProfile } = await svc.from('profiles').select('phone').eq('id', order.consumer_id).single()
    const consumerPhone = consumerProfile?.phone ?? undefined

    const pickupWindow = order.listing
      ? `${formatTime(order.listing.pickup_start)}\u2013${formatTime(order.listing.pickup_end)}`
      : ''

    if (consumerEmail && order.listing && order.store) {
      await sendOrderConfirmation(consumerEmail, {
        pickupCode,
        listingTitle: order.listing.title,
        storeName: order.store.name,
        storeAddress: order.store.address,
        quantity: order.quantity,
        totalPrice: order.total_price,
        pickupWindow,
      })
    }

    if (ownerEmail && order.listing) {
      await sendNewOrderNotification(ownerEmail, {
        listingTitle: order.listing.title,
        quantity: order.quantity,
        totalPrice: order.total_price,
        pickupCode,
      })
    }

    if (consumerPhone && order.store && order.listing) {
      await sendSms({
        to: consumerPhone,
        body: smsReservationConfirmed({
          storeName: order.store.name,
          pickupCode,
          windowStart: formatTime(order.listing.pickup_start),
          windowEnd: formatTime(order.listing.pickup_end),
          address: order.store.address,
        }),
        orderId: order.id,
      })
    }
  } catch (err) {
    console.error('[verify] notifications failed:', err)
  }

  return NextResponse.json({ ok: true, pickup_code: pickupCode })
}
