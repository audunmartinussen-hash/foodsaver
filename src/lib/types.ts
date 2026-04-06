export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: 'consumer' | 'business' | 'admin'
  avatar_url: string | null
  created_at: string
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
  is_active: boolean
  is_approved: boolean
  created_at: string
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
  created_at: string
  store?: Store
}

export interface Order {
  id: string
  listing_id: string
  consumer_id: string
  store_id: string
  quantity: number
  total_price: number
  status: 'reserved' | 'confirmed' | 'picked_up' | 'cancelled' | 'no_show'
  pickup_code: string | null
  reserved_at: string
  picked_up_at: string | null
  cancelled_at: string | null
  listing?: Listing
  store?: Store
}
