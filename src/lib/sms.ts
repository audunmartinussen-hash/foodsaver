/**
 * Transactional SMS via Semaphore (PH-first).
 *
 * Gracefully no-ops when `SEMAPHORE_API_KEY` is not set so local dev and
 * pre-key deploys never throw. Every attempt — success or failure — is
 * logged to `sms_log` using the service-role client so we can diagnose
 * what went wrong without digging through Semaphore\u2019s dashboard.
 *
 * Semaphore priority API docs: https://semaphore.co/docs
 */
import { createClient as createServiceClient } from '@supabase/supabase-js'

type SmsResult = { ok: true; provider_response: unknown } | { ok: false; error: string; provider_response?: unknown }

function logClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key, { auth: { persistSession: false } })
}

async function logSms(params: {
  recipient: string
  body: string
  status: 'sent' | 'failed' | 'skipped'
  provider_response?: unknown
  order_id?: string | null
}) {
  const client = logClient()
  if (!client) return
  await client.from('sms_log').insert({
    recipient: params.recipient,
    body: params.body,
    status: params.status,
    provider: 'semaphore',
    provider_response: params.provider_response ?? null,
    order_id: params.order_id ?? null,
  })
}

/**
 * Send a transactional SMS. Returns a result object — never throws; SMS failure
 * should not block the reservation flow.
 */
export async function sendSms(params: {
  to: string
  body: string
  orderId?: string | null
}): Promise<SmsResult> {
  const apiKey = process.env.SEMAPHORE_API_KEY
  const sender = process.env.SEMAPHORE_SENDER_NAME || 'FoodSaver'

  if (!apiKey) {
    await logSms({ recipient: params.to, body: params.body, status: 'skipped', provider_response: { reason: 'no_api_key' }, order_id: params.orderId })
    return { ok: false, error: 'SEMAPHORE_API_KEY not set' }
  }

  if (!params.to) {
    return { ok: false, error: 'No recipient' }
  }

  try {
    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        apikey: apiKey,
        number: params.to,
        message: params.body,
        sendername: sender,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      await logSms({ recipient: params.to, body: params.body, status: 'failed', provider_response: data, order_id: params.orderId })
      return { ok: false, error: `Semaphore ${res.status}`, provider_response: data }
    }
    await logSms({ recipient: params.to, body: params.body, status: 'sent', provider_response: data, order_id: params.orderId })
    return { ok: true, provider_response: data }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logSms({ recipient: params.to, body: params.body, status: 'failed', provider_response: { error: message }, order_id: params.orderId })
    return { ok: false, error: message }
  }
}

/* ---------- Message templates (kept small; edit copy here, not inline) ---------- */

export function smsReservationConfirmed(params: { storeName: string; pickupCode: string; windowStart: string; windowEnd: string; address: string }) {
  return `FoodSaver: Reservation at ${params.storeName} confirmed. Code: ${params.pickupCode}. Pickup ${params.windowStart}\u2013${params.windowEnd} at ${params.address}. Fee is non-refundable if you no-show.`
}

export function smsPickupReminder(params: { storeName: string; pickupCode: string; windowStart: string }) {
  return `FoodSaver reminder: Pickup at ${params.storeName} starts in 30 min. Code: ${params.pickupCode}.`
}

export function smsPickupComplete(params: { productTitle: string }) {
  return `FoodSaver: Thanks for picking up! Enjoy your ${params.productTitle}.`
}

export function smsFeeRejected(params: { storeName: string }) {
  return `FoodSaver: We couldn\u2019t verify your GCash payment for ${params.storeName}. Please upload a clearer screenshot within 30 min or the reservation will be cancelled.`
}

export function smsCancelled(params: { storeName: string; reason?: string }) {
  return `FoodSaver: Your reservation at ${params.storeName} was cancelled${params.reason ? `. Reason: ${params.reason}` : ''}.`
}
