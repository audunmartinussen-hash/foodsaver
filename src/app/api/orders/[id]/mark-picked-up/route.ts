import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms, smsPickupComplete } from '@/lib/sms'

/**
 * Merchant marks a reservation as picked up. RLS already restricts updates
 * to (buyer) OR (store owner), but we double-check here and block attempts
 * to close out a cancelled reservation.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, listing:listings(title), store:stores(owner_id)')
    .eq('id', id)
    .single()
  if (error || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ownerId = Array.isArray(order.store) ? order.store[0]?.owner_id : (order.store as { owner_id: string } | null)?.owner_id
  if (ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (order.status === 'cancelled') {
    return NextResponse.json({ error: 'This reservation was cancelled and cannot be marked picked up.' }, { status: 400 })
  }
  if (order.status === 'picked_up') {
    return NextResponse.json({ ok: true, note: 'Already picked up' })
  }
  if (order.status !== 'confirmed' && order.status !== 'reserved') {
    return NextResponse.json({ error: `Cannot mark picked up while status is ${order.status}` }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
    .eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Best-effort buyer SMS
  try {
    const { data: consumerProfile } = await supabase.from('profiles').select('phone').eq('id', order.consumer_id).single()
    const title = Array.isArray(order.listing) ? order.listing[0]?.title : (order.listing as { title: string } | null)?.title
    if (consumerProfile?.phone && title) {
      await sendSms({
        to: consumerProfile.phone,
        body: smsPickupComplete({ productTitle: title }),
        orderId: order.id,
      })
    }
  } catch (err) {
    console.error('[mark-picked-up] sms failed:', err)
  }

  return NextResponse.json({ ok: true })
}
