import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { PlatformConfig } from '@/lib/types'
import { PLATFORM_CONFIG_DEFAULTS } from './platformConfig'

/**
 * Server-only reader for the `platform_config` table.
 *
 * Kept in a separate file from the client-side `fetchPlatformConfig` helper
 * so that importing the latter from a client component doesn\u2019t drag
 * `next/headers` (pulled in via `supabase/server`) into the browser bundle.
 *
 * Falls back to defaults when the row is missing, so a config lookup failure
 * never blocks a reservation.
 */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('platform_config').select('key, value')
    if (!data) return PLATFORM_CONFIG_DEFAULTS

    const map: Record<string, string> = {}
    for (const row of data) map[row.key] = row.value

    return {
      reservation_fee_php:
        parseInt(map.reservation_fee_php) || PLATFORM_CONFIG_DEFAULTS.reservation_fee_php,
      gcash_account_name: map.gcash_account_name || PLATFORM_CONFIG_DEFAULTS.gcash_account_name,
      gcash_account_number:
        map.gcash_account_number || PLATFORM_CONFIG_DEFAULTS.gcash_account_number,
      gcash_qr_image_url: map.gcash_qr_image_url || PLATFORM_CONFIG_DEFAULTS.gcash_qr_image_url,
      launch_city: map.launch_city || PLATFORM_CONFIG_DEFAULTS.launch_city,
      support_messenger_url:
        map.support_messenger_url || PLATFORM_CONFIG_DEFAULTS.support_messenger_url,
      no_show_pause_threshold:
        parseInt(map.no_show_pause_threshold) ||
        PLATFORM_CONFIG_DEFAULTS.no_show_pause_threshold,
    }
  } catch {
    return PLATFORM_CONFIG_DEFAULTS
  }
}
