'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import InstallPrompt from '@/components/InstallPrompt'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useListings } from '@/hooks/useListings'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import {
  formatPrice,
  formatPhpShort,
  calcDiscountPercent,
  formatPickupWindow,
  LAUNCH_CITY,
} from '@/lib/utils'
import { track } from '@/lib/analytics'
import { fetchPlatformConfig } from '@/lib/platformConfig'
import type { Listing, PlatformConfig, Profile } from '@/lib/types'

export default function ListingsFeed() {
  const router = useRouter()
  const { user } = useAuth()
  const { listings, loading } = useListings()
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [buyerProfile, setBuyerProfile] = useState<Profile | null>(null)

  useEffect(() => { fetchPlatformConfig().then(setConfig) }, [])

  useEffect(() => {
    if (!user) {
      // Defer the null reset to a microtask so it doesn\u2019t count as a sync
      // setState in the effect body (React 19 hooks-lint rule).
      Promise.resolve().then(() => setBuyerProfile(null))
      return
    }
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setBuyerProfile((data as Profile) ?? null))
  }, [user])

  const isPaused = !!buyerProfile?.account_paused_at

  const handleReserve = async () => {
    if (!user || !selectedListing) return
    if (isPaused) {
      setReserveError('Your account is paused. Please contact support.')
      return
    }
    setReserving(true)
    setReserveError(null)

    const supabase = createClient()

    // Guard: out of stock race condition — refetch live quantity
    const { data: liveListing } = await supabase
      .from('listings')
      .select('quantity_available, quantity_sold, is_active')
      .eq('id', selectedListing.id)
      .single()

    const remaining = (liveListing?.quantity_available ?? 0) - (liveListing?.quantity_sold ?? 0)
    if (!liveListing?.is_active || remaining < quantity) {
      setReserveError('Sorry, someone just reserved the last one. Check back later or browse other stores.')
      setReserving(false)
      return
    }

    const feePhp = config?.reservation_fee_php ?? 20
    const totalPrice = selectedListing.discounted_price * quantity
    // 30-minute fee payment window. If buyer doesn\u2019t pay within that, the
    // no-show sweep cancels the reservation.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { data: order, error } = await supabase.from('orders').insert({
      listing_id: selectedListing.id,
      consumer_id: user.id,
      store_id: selectedListing.store_id,
      quantity,
      total_price: totalPrice,
      status: 'pending_fee_payment',
      payment_method: 'cash',
      payment_status: 'pending',
      platform_fee: 0,
      reservation_fee_php: feePhp,
      fee_payment_expires_at: expiresAt,
    }).select().single()

    if (error || !order) {
      setReserveError('Failed to create reservation. Please try again.')
      setReserving(false)
      return
    }

    // Reserve quantity optimistically
    await supabase
      .from('listings')
      .update({ quantity_sold: (liveListing.quantity_sold ?? 0) + quantity })
      .eq('id', selectedListing.id)

    track('reservation_initiated', { listing_id: selectedListing.id, order_id: order.id, quantity })

    router.push(`/reserve/${order.id}`)
  }

  return (
    <div className="px-4 pt-4 pb-8 lg:px-8 max-w-6xl mx-auto">
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
        {config?.launch_city ?? LAUNCH_CITY}
      </div>

      {isPaused && (
        <div className="mb-5 bg-error/10 border border-error/25 rounded-2xl p-4">
          <p className="font-semibold text-error text-sm">Account paused</p>
          <p className="text-xs text-dark-green/70 mt-1">
            Your account is temporarily paused because of repeated no-shows. Please message support to reactivate.
          </p>
          <a
            href={config?.support_messenger_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs font-medium text-olive underline"
          >
            Contact support
          </a>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">\uD83C\uDF7D</p>
          <p className="font-display font-semibold text-dark-green">No listings yet</p>
          <p className="text-sm text-dark-green/50 mt-1">
            Check back soon for deals in {config?.launch_city ?? LAUNCH_CITY}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => {
                if (!user) {
                  window.location.href = '/login'
                  return
                }
                track('listing_viewed', { listing_id: listing.id })
                setSelectedListing(listing)
                setQuantity(1)
                setReserveError(null)
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

            <div className="border-t border-dark-green/10 pt-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-green/60">Cash to store at pickup</span>
                <span className="font-semibold text-dark-green">
                  {formatPrice(selectedListing.discounted_price * quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-green/60">Reservation fee (GCash)</span>
                <span className="font-semibold text-dark-green">
                  {formatPhpShort(config?.reservation_fee_php ?? 20)}
                </span>
              </div>
              <p className="text-[11px] text-dark-green/45 pt-1">
                The reservation fee goes to FoodSaver and is non-refundable if you no-show.
              </p>
            </div>

            {reserveError && (
              <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center">
                {reserveError}
              </div>
            )}

            <Button
              onClick={handleReserve}
              disabled={reserving || isPaused}
              className="w-full"
              size="lg"
            >
              {reserving ? 'Creating reservation\u2026' : `Continue to pay ${formatPhpShort(config?.reservation_fee_php ?? 20)} fee`}
            </Button>

            <p className="text-xs text-dark-green/40 text-center">
              Next: pay the reservation fee via GCash to confirm your pickup code.
            </p>
          </div>
        )}
      </Modal>

      <InstallPrompt />

      {/* Tiny footer keeps the landing/brand tone once buyers are in-app */}
      <div className="mt-10 pt-6 border-t border-dark-green/5 text-center text-[11px] text-dark-green/30">
        <Link href="/terms" className="underline mr-3">Terms</Link>
        <Link href="/privacy" className="underline">Privacy</Link>
      </div>
    </div>
  )
}
