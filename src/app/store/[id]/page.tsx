'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListingCard from '@/components/ListingCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, calcDiscountPercent, formatPickupWindow, generatePickupCode } from '@/lib/utils'
import type { Store, Listing } from '@/lib/types'

export default function StorePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single()

      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('store_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setStore(storeData)
      setListings(listingsData ?? [])
      setLoading(false)
    }

    fetchStore()
  }, [id])

  const handleReserve = async () => {
    if (!user || !selectedListing || !store) return
    setReserving(true)

    const code = generatePickupCode()
    const { error } = await supabase.from('orders').insert({
      listing_id: selectedListing.id,
      consumer_id: user.id,
      store_id: store.id,
      quantity,
      total_price: selectedListing.discounted_price * quantity,
      pickup_code: code,
    })

    if (!error) {
      await supabase
        .from('listings')
        .update({ quantity_sold: selectedListing.quantity_sold + quantity })
        .eq('id', selectedListing.id)
      alert(`Reserved! Your pickup code is: ${code}`)
      setSelectedListing(null)
    }

    setReserving(false)
  }

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="h-48 bg-white rounded-2xl animate-pulse mb-4" />
        <div className="h-6 bg-white rounded-xl animate-pulse w-48 mb-2" />
        <div className="h-4 bg-white rounded-xl animate-pulse w-64" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-green/50">Store not found</p>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Banner */}
      <div className="h-48 bg-olive/10 relative">
        {store.image_url ? (
          <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {store.category === 'bakery' ? '🍞' :
             store.category === 'restaurant' ? '🍽' :
             store.category === 'grocery' ? '🛒' :
             store.category === 'cafe' ? '☕' : '🏪'}
          </div>
        )}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Store Info */}
      <div className="px-4 -mt-6 relative">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-dark-green">{store.name}</h1>
              <p className="text-sm text-dark-green/50 mt-0.5">{store.address}</p>
            </div>
            <Badge variant="olive">{store.category}</Badge>
          </div>
          {store.description && (
            <p className="text-sm text-dark-green/60 mt-2">{store.description}</p>
          )}
        </div>
      </div>

      {/* Listings */}
      <div className="px-4 mt-5">
        <h2 className="font-display font-semibold text-lg mb-3">Available Today</h2>
        {listings.length === 0 ? (
          <p className="text-center py-8 text-dark-green/40">No listings available right now</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => {
                  if (!user) {
                    window.location.href = '/login'
                    return
                  }
                  setSelectedListing(listing)
                  setQuantity(1)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reserve Modal */}
      <Modal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Reserve"
      >
        {selectedListing && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-lg">{selectedListing.title}</h3>
              <p className="text-sm text-dark-green/50">{store.name}</p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gold">
                {formatPrice(selectedListing.discounted_price)}
              </span>
              <span className="text-sm text-dark-green/40 line-through">
                {formatPrice(selectedListing.original_price)}
              </span>
              <Badge variant="gold">
                {calcDiscountPercent(selectedListing.original_price, selectedListing.discounted_price)}% OFF
              </Badge>
            </div>

            <div className="bg-cream rounded-xl p-3 text-sm text-dark-green/60">
              <p>Pickup: {formatPickupWindow(selectedListing.pickup_start, selectedListing.pickup_end)}</p>
              <p className="mt-1">{store.address}</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-dark-green/5 flex items-center justify-center"
                >-</button>
                <span className="font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedListing.quantity_available - selectedListing.quantity_sold, quantity + 1))}
                  className="w-8 h-8 rounded-full bg-dark-green/5 flex items-center justify-center"
                >+</button>
              </div>
            </div>

            <div className="border-t border-dark-green/10 pt-3 flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold text-gold">
                {formatPrice(selectedListing.discounted_price * quantity)}
              </span>
            </div>

            <Button onClick={handleReserve} disabled={reserving} className="w-full" size="lg">
              {reserving ? 'Reserving...' : 'Reserve Now — Pay at Pickup'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
