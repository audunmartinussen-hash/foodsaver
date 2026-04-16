export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: 'consumer' | 'business' | 'admin'
  avatar_url: string | null
  created_at: string
  no_show_count_30d: number
  account_paused_at: string | null
  account_paused_reason: string | null
}

export interface Store {
  id: string
  owner_id: string
  name: string
  description: string | null
  address: string
  city: string
  barangay: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  image_url: string | null
  category: 'bakery' | 'restaurant' | 'grocery' | 'cafe' | 'other'
  avg_rating: number
  review_count: number
  is_active: boolean
  is_approved: boolean
  created_at: string
}

export interface Review {
  id: string
  order_id: string
  store_id: string
  consumer_id: string
  rating: number
  comment: string | null
  created_at: string
  profile?: Profile
}

export interface Listing {
  id: string
  store_id: string
  title: string
  description: string | null
  original_price: number
  discounted_price: number
  quantity_available: number
  quantity_sold: number
  pickup_start: string
  pickup_end: string
  available_date: string
  image_url: string | null
  is_active: boolean
  is_recurring: boolean
  recurring_days: string[]
  created_at: string
  store?: Store
}

/**
 * Order / reservation status after the April pivot.
 *
 * - pending_fee_payment: buyer created the reservation, hasn't uploaded GCash proof yet
 * - pending_verification: buyer uploaded proof, admin has not yet confirmed
 * - confirmed: admin confirmed the proof; pickup code is live
 * - picked_up: merchant marked it picked up
 * - cancelled: buyer or admin cancelled before pickup
 * - no_show: pickup window passed with no pickup
 *
 * `reserved` is kept for historical compatibility with records made before the pivot.
 */
export type OrderStatus =
  | 'pending_fee_payment'
  | 'pending_verification'
  | 'reserved'
  | 'confirmed'
  | 'picked_up'
  | 'cancelled'
  | 'no_show'

export interface Order {
  id: string
  listing_id: string
  consumer_id: string
  store_id: string
  quantity: number
  total_price: number
  status: OrderStatus
  pickup_code: string | null
  payment_method: 'cash' | 'gcash' | null
  platform_fee: number
  payment_status: 'pending' | 'paid' | 'failed'
  payment_id: string | null
  reserved_at: string
  picked_up_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  refund_status: string | null
  reservation_fee_php: number
  reservation_fee_paid_at: string | null
  reservation_fee_proof_url: string | null
  reservation_fee_verified_at: string | null
  reservation_fee_verified_by: string | null
  reservation_fee_rejected_reason: string | null
  no_show_at: string | null
  fee_payment_expires_at: string | null
  // Joined relations are nullable — Supabase returns `null` when a join misses
  // (e.g. listing was hard-deleted) and admin/merchant pages narrow to subsets.
  listing?: Listing | null
  store?: Store | null
  consumer?: Profile | null
}

export interface PlatformConfig {
  reservation_fee_php: number
  gcash_account_name: string
  gcash_account_number: string
  gcash_qr_image_url: string
  launch_city: string
  support_messenger_url: string
  no_show_pause_threshold: number
}
