import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Background sweep job.
 *
 * Intended to be called every 15 minutes by Vercel Cron (vercel.json) or an
 * external scheduler. Authenticated via a shared secret in the `authorization`
 * header so random internet traffic can\u2019t trigger no-shows.
 *
 * Behaviour:
 *   1. For confirmed reservations whose pickup window ended 15+ minutes ago
 *      with no `picked_up_at`, mark `no_show`.
 *   2. For pending_fee_payment reservations where `fee_payment_expires_at`
 *      has passed, cancel them.
 *   3. Recompute and denormalize `profiles.no_show_count_30d` for affected
 *      consumers; pause accounts over threshold.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  const expected = process.env.CRON_SECRET
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }
  const svc = createServiceClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const now = new Date()
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000)

  // ---- 1) No-show confirmed reservations whose pickup window ended 15+ min ago
  //
  // listings.pickup_end is TIME, not TIMESTAMP, so we combine with available_date.
  // We over-fetch (no SQL interval math available via supabase-js) and filter in JS.
  const { data: candidates } = await svc
    .from('orders')
    .select('id, consumer_id, picked_up_at, no_show_at, listing:listings(pickup_end, available_date)')
    .in('status', ['confirmed', 'reserved'])
    .is('picked_up_at', null)
    .is('no_show_at', null)

  let noShowCount = 0
  const affectedConsumers = new Set<string>()

  for (const row of candidates ?? []) {
    const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing
    if (!listing?.pickup_end || !listing?.available_date) continue
    const end = new Date(`${listing.available_date}T${listing.pickup_end}`)
    if (end < cutoff) {
      const { error } = await svc
        .from('orders')
        .update({ status: 'no_show', no_show_at: now.toISOString() })
        .eq('id', row.id)
      if (!error) {
        noShowCount++
        affectedConsumers.add(row.consumer_id)
      }
    }
  }

  // ---- 2) Expire pending_fee_payment reservations whose fee_payment_expires_at passed
  const { data: expired } = await svc
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: now.toISOString(), cancelled_reason: 'Fee payment expired' })
    .eq('status', 'pending_fee_payment')
    .lt('fee_payment_expires_at', now.toISOString())
    .select('id')

  // ---- 3) Recompute no-show counters for affected consumers and pause if needed
  const { data: thresholdRow } = await svc
    .from('platform_config')
    .select('value')
    .eq('key', 'no_show_pause_threshold')
    .single()
  const threshold = parseInt(thresholdRow?.value || '3') || 3

  let pausedCount = 0
  for (const consumerId of affectedConsumers) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await svc
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)
      .eq('status', 'no_show')
      .gte('no_show_at', since)

    const update: {
      no_show_count_30d: number
      account_paused_at?: string
      account_paused_reason?: string
    } = { no_show_count_30d: count ?? 0 }

    if ((count ?? 0) >= threshold) {
      update.account_paused_at = now.toISOString()
      update.account_paused_reason = `Auto-paused: ${count} no-shows in the last 30 days`
      pausedCount++
    }

    await svc.from('profiles').update(update).eq('id', consumerId)
  }

  return NextResponse.json({
    ok: true,
    no_shows_recorded: noShowCount,
    fee_payments_expired: expired?.length ?? 0,
    consumers_paused: pausedCount,
  })
}

// Allow GET for Vercel cron (they hit GET by default)
export const GET = POST
