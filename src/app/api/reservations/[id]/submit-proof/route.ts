import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Buyer uploads their GCash screenshot. We:
 *
 *   1. Validate the reservation belongs to them and is in `pending_fee_payment`
 *   2. Move it to `pending_verification` with the proof URL stamped
 *   3. Return success so the UI can show the \u201Cwe\u2019re verifying\u201D screen
 *
 * The actual file upload happens client-side directly to Supabase Storage
 * (protected by RLS) — this route is only the state transition.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const proofUrl: string | undefined = body?.proof_url
  if (!proofUrl || typeof proofUrl !== 'string') {
    return NextResponse.json({ error: 'proof_url required' }, { status: 400 })
  }

  // Fetch reservation and check ownership + status
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('id, consumer_id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }
  if (order.consumer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (order.status !== 'pending_fee_payment' && order.status !== 'pending_verification') {
    return NextResponse.json({ error: `Cannot submit proof while status is ${order.status}` }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      reservation_fee_proof_url: proofUrl,
      reservation_fee_paid_at: now,
      status: 'pending_verification',
      reservation_fee_rejected_reason: null,
    })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
