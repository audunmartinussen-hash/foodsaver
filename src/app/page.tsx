'use client'

import { useState } from 'react'
import ListingCard from '@/components/ListingCard'
import InstallPrompt from '@/components/InstallPrompt'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useListings } from '@/hooks/useListings'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, calcDiscountPercent, formatPickupWindow, generatePickupCode } from '@/lib/utils'
import type { Listing } from '@/lib/types'

export default function HomePage() {
  const { listings, loading } = useListings()
  const { user } = useAuth()
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const [confirmation, setConfirmation] = useState<{ code: string; listing: Listing } | null>(null)

  const handleReserve = async () => {
    if (!user || !selectedListing) return
    setReserving(true)

    const supabase = createClient()
    const code = generatePickupCode()

    const { error } = await supabase.from('orders').insert({
      listing_id: selectedListing.id,
      consumer_id: user.id,
      store_id: selectedListing.store_id,
      quantity,
      total_price: selectedListing.discounted_price * quantity,
      pickup_code: code,
    })

    if (!error) {
      await supabase
        .from('listings')
        .update({ quantity_sold: selectedListing.quantity_sold + quantity })
        .eq('id', selectedListing.id)

      setConfirmation({ code, listing: selectedListing })
      setSelectedListing(null)
    }

    setReserving(false)
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-dark-green">
          FoodSaver
        </h1>
        <p className="text-sm text-dark-green/60 mt-0.5">
          Save big on surplus food near you
        </p>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 mb-5 text-sm text-dark-green/60">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Cagayan de Oro
      </div>

      {/* Listings Grid */}
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

            <Button
              onClick={handleReserve}
              disabled={reserving}
              className="w-full"
              size="lg"
            >
              {reserving ? 'Reserving...' : 'Reserve Now — Pay at Pickup'}
            </Button>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmation}
        onClose={() => setConfirmation(null)}
        title="Reserved!"
      >
        {confirmation && (
          <div className="text-center space-y-4">
            <p className="text-5xl">🎉</p>
            <p className="text-sm text-dark-green/60">
              Show this code when you pick up your order
            </p>
            <div className="bg-cream rounded-2xl p-6">
              <p className="text-xs text-dark-green/40 mb-1">Pickup Code</p>
              <p className="font-display text-5xl font-bold text-dark-green tracking-[0.3em]">
                {confirmation.code}
              </p>
            </div>
            <div className="text-left bg-olive/5 rounded-xl p-3 text-sm space-y-1">
              <p className="font-medium">{confirmation.listing.title}</p>
              <p className="text-dark-green/50">
                Pickup: {formatPickupWindow(confirmation.listing.pickup_start, confirmation.listing.pickup_end)}
              </p>
            </div>
            <Button onClick={() => setConfirmation(null)} className="w-full" size="lg">
              Done
            </Button>
          </div>
        )}
      </Modal>

      <InstallPrompt />
    </div>
  )
}
