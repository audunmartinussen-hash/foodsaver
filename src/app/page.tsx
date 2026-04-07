'use client'

import { useState } from 'react'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import InstallPrompt from '@/components/InstallPrompt'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useListings } from '@/hooks/useListings'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, calcDiscountPercent, calcPlatformFee, formatPickupWindow, generatePickupCode } from '@/lib/utils'
import type { Listing } from '@/lib/types'

function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-dark-green text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-olive blur-3xl" />
        </div>
        <div className="relative px-6 pt-14 pb-16 text-center max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm">🇵🇭</span>
            <span className="text-xs font-medium text-white/80">Now in Cagayan de Oro</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-3">
            FoodSaver
          </h1>
          <p className="text-lg text-white/80 mb-2 font-medium">
            Save big on surplus food near you
          </p>
          <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto">
            Rescue delicious food from local restaurants, bakeries, and groceries at 50-70% off
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-gold text-dark-green hover:bg-gold/90 font-bold text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-gold/20">
              Get Started
            </Button>
          </Link>
          <p className="text-xs text-white/40 mt-4">Free to join. Pay only for what you save.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-12 max-w-md mx-auto">
        <h2 className="font-display text-2xl font-bold text-dark-green text-center mb-2">
          How It Works
        </h2>
        <p className="text-sm text-dark-green/50 text-center mb-8">
          Three simple steps to save food and money
        </p>
        <div className="space-y-4">
          {[
            {
              step: '1',
              emoji: '🔍',
              title: 'Browse Deals',
              desc: 'Discover surprise bags and discounted bundles from stores near you',
            },
            {
              step: '2',
              emoji: '🛒',
              title: 'Reserve',
              desc: 'Tap to reserve your pick. No payment needed until pickup.',
            },
            {
              step: '3',
              emoji: '🎉',
              title: 'Pick Up & Save',
              desc: 'Show your pickup code at the store and enjoy your food at up to 70% off',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-dark-green/5"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div>
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-0.5">
                  Step {item.step}
                </p>
                <h3 className="font-display font-bold text-dark-green text-base">
                  {item.title}
                </h3>
                <p className="text-sm text-dark-green/55 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-dark-green text-white px-6 py-12">
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-2">
            Why FoodSaver?
          </h2>
          <p className="text-sm text-white/50 text-center mb-8">
            Good for you, good for the planet
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                emoji: '💰',
                title: 'Save 50-70%',
                desc: 'Get premium food at a fraction of the price. Stretch your budget further.',
              },
              {
                emoji: '🌱',
                title: 'Reduce Food Waste',
                desc: 'Every bag you save means less food in the landfill. Make an impact daily.',
              },
              {
                emoji: '🏪',
                title: 'Support Local',
                desc: 'Help neighborhood bakeries, restaurants, and groceries recover value from surplus.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/8 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
              >
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <h3 className="font-display font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Business Owners */}
      <section className="px-6 py-12 max-w-md mx-auto">
        <div className="bg-olive/8 border border-olive/15 rounded-3xl p-6">
          <div className="text-center mb-6">
            <span className="text-3xl mb-3 block">🏢</span>
            <h2 className="font-display text-2xl font-bold text-dark-green mb-1">
              For Business Owners
            </h2>
            <p className="text-sm text-dark-green/50">
              Turn surplus into revenue
            </p>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { emoji: '♻️', text: 'Reduce waste and disposal costs' },
              { emoji: '💵', text: 'Earn extra revenue from surplus inventory' },
              { emoji: '👥', text: 'Attract new customers to your store' },
              { emoji: '📊', text: 'Simple dashboard to manage listings and orders' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-sm text-dark-green/70 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="w-full rounded-xl font-bold">
              Sign Up as a Business
            </Button>
          </Link>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-white border-y border-dark-green/5 px-6 py-10">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: '50-70%', label: 'Savings' },
            { value: '0', label: 'Food Waste' },
            { value: '100%', label: 'Fresh' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl font-bold text-gold">{stat.value}</p>
              <p className="text-xs text-dark-green/50 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-12 text-center max-w-md mx-auto">
        <h2 className="font-display text-2xl font-bold text-dark-green mb-2">
          Ready to start saving?
        </h2>
        <p className="text-sm text-dark-green/50 mb-6">
          Join FoodSaver today and never let good food go to waste
        </p>
        <Link href="/login">
          <Button size="lg" className="px-10 py-3.5 rounded-2xl font-bold text-base">
            Get Started — It&apos;s Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-dark-green text-white/40 px-6 py-8">
        <div className="max-w-md mx-auto">
          <p className="font-display font-bold text-white/80 text-lg mb-3">FoodSaver</p>
          <p className="text-xs mb-6 leading-relaxed">
            Rescuing surplus food from local businesses, one bag at a time. Saving you money while reducing food waste in Cagayan de Oro.
          </p>
          <div className="flex gap-6 text-xs mb-6">
            <Link href="/login" className="text-white/50 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="text-white/50 hover:text-white transition-colors">
              Sign Up
            </Link>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] text-white/30">
              &copy; 2026 FoodSaver. Made with love in CDO.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ListingsFeed() {
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

    // 1. Create order with pending payment
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

      {/* Confirmation modal removed — user is redirected to PayMongo checkout */}

      <InstallPrompt />
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-dark-green/20 border-t-dark-green rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  return <ListingsFeed />
}
