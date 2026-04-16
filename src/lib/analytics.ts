'use client'

/**
 * Thin PostHog wrapper.
 *
 * Everything is lazy-loaded so we don't ship the posthog-js bundle on routes
 * that haven't triggered a track call yet, and everything is a graceful
 * no-op when `NEXT_PUBLIC_POSTHOG_KEY` isn't set. That keeps local dev quiet
 * and gives us instrumentation we can flip on by setting one env var.
 *
 * Events are enumerated in `AnalyticsEvent` so there's a single place to see
 * the funnel.
 */

type PostHogLike = {
  init: (key: string, options: { api_host: string; person_profiles: 'identified_only' | 'always' }) => void
  identify: (id: string, props?: Record<string, unknown>) => void
  reset: () => void
  capture: (event: string, props?: Record<string, unknown>) => void
}

let ph: PostHogLike | null = null
let initPromise: Promise<PostHogLike | null> | null = null

async function ensureInit(): Promise<PostHogLike | null> {
  if (ph) return ph
  if (typeof window === 'undefined') return null
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const mod = await import('posthog-js')
      const client = mod.default as PostHogLike
      client.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
      })
      ph = client
      return client
    } catch {
      return null
    }
  })()
  return initPromise
}

export type AnalyticsEvent =
  | 'listing_viewed'
  | 'reservation_initiated'
  | 'fee_payment_shown'
  | 'fee_proof_uploaded'
  | 'reservation_confirmed'
  | 'reservation_cancelled'
  | 'pickup_completed'
  | 'no_show_recorded'
  | 'merchant_listing_created'
  | 'user_signed_up'
  | 'install_prompt_shown'
  | 'install_prompt_accepted'

export async function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  const client = await ensureInit()
  client?.capture(event, props)
}

export async function identify(userId: string, props?: Record<string, unknown>) {
  const client = await ensureInit()
  client?.identify(userId, props)
}

export async function reset() {
  ph?.reset()
}
