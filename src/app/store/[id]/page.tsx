'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListingCard from '@/components/ListingCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, calcDiscountPercent, calcPlatformFee, formatPickupWindow, generatePickupCode } from '@/lib/utils'
import type { Store, Listing, Review } from '@/lib/types'

export default function StorePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
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

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profile:profiles(*)')
        .eq('store_id', id)
        .order('created_at', { ascending: false })

      setStore(storeData)
      setListings(listingsData ?? [])
      setReviews((reviewsData as Review[]) ?? [])
      setLoading(false)
    }

    fetchStore()
  }, [id])

  const handleReserve = async () => {
    if (!user || !selectedListing || !store) return
    setReserving(true)
    setReserveError(null)

    const code = generatePickupCode()
    const platformFee = calcPlatformFee(selectedListing.discounted_price, quantity)
    const totalPrice = selectedListing.discounted_price * quantity

    // 1. Create order with pending payment
    const { data: order, error } = await supabase.from('orders').insert({
      listing_id: selectedListing.id,
      consumer_id: user.id,
      store_id: store.id,
      quantity,
      total_price: totalPrice,
      pickup_code: code,
      payment_method: null,
      platform_fee: platformFee,
      payment_status: 'pending',
    }).select().single()

    if (error || !order) {
      setReserveError('Failed to create order. Please try again.')
      setReserving(false)
      return
    }

    // 2. Update listing quantity
    await supabase
      .from('listings')
      .update({ quantity_sold: selectedListing.quantity_sold + quantity })
      .eq('id', selectedListing.id)

    // 3. Create PayMongo checkout session
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          listingTitle: selectedListing.title,
          amount: totalPrice,
          quantity,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        setReserveError('Failed to start payment. Please try again from your orders.')
        setReserving(false)
        return
      }

      // 4. Redirect to PayMongo checkout
      window.location.href = data.checkoutUrl
    } catch {
      setReserveError('Failed to connect to payment gateway. Please try again.')
      setReserving(false)
    }
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
          {store.review_count > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-sm ${star <= Math.round(store.avg_rating) ? 'text-gold' : 'text-dark-green/15'}`}>
                    {star <= Math.round(store.avg_rating) ? '\u2605' : '\u2606'}
                  </span>
                ))}
              </div>
              <span className="text-xs text-dark-green/50">
                {store.avg_rating.toFixed(1)} ({store.review_count} {store.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
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

      {/* Reviews Section */}
      <div className="px-4 mt-6">
        <h2 className="font-display font-semibold text-lg mb-3">
          Reviews
          {store.review_count > 0 && (
            <span className="text-sm font-normal text-dark-green/40 ml-2">
              ({store.review_count})
            </span>
          )}
        </h2>
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dark-green/5">
            <p className="text-dark-green/40 text-sm">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-dark-green/5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-dark-green">
                      {review.profile?.full_name || 'Anonymous'}
                    </p>
                    <div className="flex mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-sm ${star <= review.rating ? 'text-gold' : 'text-dark-green/15'}`}>
                          {star <= review.rating ? '\u2605' : '\u2606'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-dark-green/35">
                    {new Date(review.created_at).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-dark-green/60 mt-1">{review.comment}</p>
                )}
              </div>
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

            {reserveError && (
              <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center">
                {reserveError}
              </div>
            )}

            <Button onClick={handleReserve} disabled={reserving} className="w-full" size="lg">
              {reserving ? 'Processing...' : 'Reserve & Pay Online'}
            </Button>

            <p className="text-xs text-dark-green/40 text-center">
              You&apos;ll be redirected to complete payment via GCash, Maya, or card
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
