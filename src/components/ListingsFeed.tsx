'use client'

import { useState } from 'react'
import ListingCard from '@/components/ListingCard'
import InstallPrompt from '@/components/InstallPrompt'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useListings } from '@/hooks/useListings'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, calcDiscountPercent, calcPlatformFee, formatPickupWindow, generatePickupCode } from '@/lib/utils'
import type { Listing } from '@/lib/types'

export default function ListingsFeed() {
  const { user } = useAuth()
  const { listings, loading } = useListings()
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const handleReserve = async () => {
    if (!user || !selectedListing) return
    setReserving(true)
    setReserveError(null)

    const supabase = createClient()
    const code = generatePickupCode()
    const platformFee = calcPlatformFee(selectedListing.discounted_price, quantity)
    const totalPrice = selectedListing.discounted_price * quantity

    const { data: order, error } = await supabase.from('orders').insert({
      listing_id: selectedListing.id,
      consumer_id: user.id,
      store_id: selectedListing.store_id,
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

    await supabase
      .from('listings')
      .update({ quantity_sold: selectedListing.quantity_sold + quantity })
      .eq('id', selectedListing.id)

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

      window.location.href = data.checkoutUrl
    } catch {
      setReserveError('Failed to connect to payment gateway. Please try again.')
      setReserving(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-dark-green">
          FoodSaver
        </h1>
        <p className="text-sm text-dark-green/60 mt-0.5">
          Save big on surplus food near you
        </p>
      </div>

      <div className="flex items-center gap-1.5 mb-5 text-sm text-dark-green/60">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Cagayan de Oro
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🍽</p>
          <p className="font-display font-semibold text-dark-green">No listings yet</p>
          <p className="text-sm text-dark-green/50 mt-1">
            Check back soon for deals in Cagayan de Oro
          </p>
        </div>
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

      <Modal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Reserve"
      >
        {selectedListing && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-lg">{selectedListing.title}</h3>
              {selectedListing.store && (
                <p className="text-sm text-dark-green/50">{selectedListing.store.name}</p>
              )}
              {selectedListing.description && (
                <p className="text-sm text-dark-green/60 mt-1">{selectedListing.description}</p>
              )}
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

            <div className="bg-cream rounded-xl p-3 text-sm">
              <p className="text-dark-green/60">
                Pickup: {formatPickupWindow(selectedListing.pickup_start, selectedListing.pickup_end)}
              </p>
              {selectedListing.store && (
                <p className="text-dark-green/60 mt-1">{selectedListing.store.address}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-dark-green/5 flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-semibold w-4 text-center">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedListing.quantity_available - selectedListing.quantity_sold, quantity + 1)
                    )
                  }
                  className="w-8 h-8 rounded-full bg-dark-green/5 flex items-center justify-center"
                >
                  +
                </button>
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

            <Button
              onClick={handleReserve}
              disabled={reserving}
              className="w-full"
              size="lg"
            >
              {reserving ? 'Processing...' : 'Reserve & Pay Online'}
            </Button>

            <p className="text-xs text-dark-green/40 text-center">
              You&apos;ll be redirected to complete payment via GCash, Maya, or card
            </p>
          </div>
        )}
      </Modal>

      <InstallPrompt />
    </div>
  )
}
