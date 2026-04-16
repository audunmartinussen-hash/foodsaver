import type { PlatformConfig } from '@/lib/types'

/**
 * Client-safe helpers for reading the platform configuration.
 *
 * The server-side reader (which hits the DB directly) lives in
 * `platformConfig.server.ts` so that importing this module from a client
 * component doesn\u2019t drag `next/headers` into the browser bundle.
 */

export const PLATFORM_CONFIG_DEFAULTS: PlatformConfig = {
  reservation_fee_php: 20,
  gcash_account_name: 'FoodSaver PH',
  gcash_account_number: '09171234567',
  gcash_qr_image_url: '',
  launch_city: 'Cagayan de Oro',
  support_messenger_url: 'https://m.me/foodsaverph',
  no_show_pause_threshold: 3,
}

/** Browser-side fetch of the platform config via the public `/api/config` route. */
export async function fetchPlatformConfig(): Promise<PlatformConfig> {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' })
    if (!res.ok) return PLATFORM_CONFIG_DEFAULTS
    return await res.json()
  } catch {
    return PLATFORM_CONFIG_DEFAULTS
  }
}
