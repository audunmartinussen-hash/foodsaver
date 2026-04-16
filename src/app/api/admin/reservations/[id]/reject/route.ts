import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendSms, smsFeeRejected } from '@/lib/sms'

/**
 * Admin rejects a fee proof.
 *
 * Moves the reservation back to `pending_fee_payment` and sets a 30-minute
 * `fee_payment_expires_at`. If the buyer doesn\u2019t resubmit by then, the
 * no-show sweep job auto-cancels it.
 */
export async function POST(
  request: Request,
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

  const body = await request.json().catch(() => ({}))
  const reason: string = body?.reason?.trim() || 'Payment could not be verified'

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const svc = serviceUrl && serviceKey
    ? createServiceClient(serviceUrl, serviceKey, { auth: { persistSession: false } })
    : userClient

  const { data: order } = await svc
    .from('orders')
    .select('id, status, consumer_id, store:stores(name)')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  if (order.status !== 'pending_verification') {
    return NextResponse.json({ error: `Cannot reject while status is ${order.status}` }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const { error } = await svc
    .from('orders')
    .update({
      status: 'pending_fee_payment',
      reservation_fee_rejected_reason: reason,
      fee_payment_expires_at: expiresAt,
      reservation_fee_proof_url: null,
      reservation_fee_paid_at: null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify buyer
  try {
    const { data: consumerProfile } = await svc.from('profiles').select('phone').eq('id', order.consumer_id).single()
    const storeName = Array.isArray(order.store) ? order.store[0]?.name : (order.store as { name: string } | null)?.name
    if (consumerProfile?.phone && storeName) {
      await sendSms({
        to: consumerProfile.phone,
        body: smsFeeRejected({ storeName }),
        orderId: order.id,
      })
    }
  } catch (err) {
    console.error('[reject] sms failed:', err)
  }

  return NextResponse.json({ ok: true })
}
