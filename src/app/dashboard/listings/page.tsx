'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { formatPrice, calcDiscountPercent, calcDiscountedPrice, calcPlatformFee, calcStorePayout, formatPickupWindow, PRICING } from '@/lib/utils'
import type { Listing, Store } from '@/lib/types'

export default function ManageListingsPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountTier, setDiscountTier] = useState(50)
  const [quantity, setQuantity] = useState('5')
  const [pickupStart, setPickupStart] = useState('17:00')
  const [pickupEnd, setPickupEnd] = useState('19:00')

  const parsedOriginal = parseFloat(originalPrice) || 0
  const computedDiscountedPrice = calcDiscountedPrice(parsedOriginal, discountTier)
  const computedPlatformFee = calcPlatformFee(computedDiscountedPrice, 1)
  const computedStorePayout = calcStorePayout(computedDiscountedPrice, 1)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (storeData) {
        setStore(storeData)

        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false })

        setListings(listingsData ?? [])
      }
      setLoading(false)
    }

    fetchData()
  }, [user])

  const handleCreate = async () => {
    if (!store) return
    setSaving(true)

    const { data, error } = await supabase
      .from('listings')
      .insert({
        store_id: store.id,
        title,
        description,
        original_price: parsedOriginal,
        discounted_price: computedDiscountedPrice,
        quantity_available: parseInt(quantity),
        pickup_start: pickupStart,
        pickup_end: pickupEnd,
        available_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (data) {
      setListings([data, ...listings])
      setShowForm(false)
      resetForm()
    }
    setSaving(false)
  }

  const toggleActive = async (listing: Listing) => {
    const { error } = await supabase
      .from('listings')
      .update({ is_active: !listing.is_active })
      .eq('id', listing.id)

    if (!error) {
      setListings(listings.map(l =>
        l.id === listing.id ? { ...l, is_active: !l.is_active } : l
      ))
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setOriginalPrice('')
    setDiscountTier(50)
    setQuantity('5')
    setPickupStart('17:00')
    setPickupEnd('19:00')
  }

  const activeListings = listings.filter(l => l.is_active)
  const inactiveListings = listings.filter(l => !l.is_active)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-xl font-bold">Listings</h2>
          <p className="text-xs text-dark-green/45 mt-0.5">
            {listings.length} total · {activeListings.length} active
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          + New Listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-olive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <p className="font-display font-semibold text-lg">No listings yet</p>
          <p className="text-sm text-dark-green/50 mt-1 mb-4">
            Create your first surprise bag to start saving food
          </p>
          <Button onClick={() => setShowForm(true)}>
            Create First Listing
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Active Listings */}
          {activeListings.length > 0 && (
            <>
              <p className="text-xs font-semibold text-dark-green/40 uppercase tracking-wider">
                Active ({activeListings.length})
              </p>
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onToggle={toggleActive} />
              ))}
            </>
          )}

          {/* Inactive Listings */}
          {inactiveListings.length > 0 && (
            <>
              <p className="text-xs font-semibold text-dark-green/40 uppercase tracking-wider mt-6">
                Inactive ({inactiveListings.length})
              </p>
              {inactiveListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onToggle={toggleActive} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Add Listing Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm() }} title="New Surprise Bag">
        <div className="space-y-4">
          <div>
            <Input
              label="What are you selling?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Surprise Bread Bag"
            />
            <p className="text-[11px] text-dark-green/35 mt-1">Give it a catchy name customers will love</p>
          </div>
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Assorted breads and pastries from today"
          />

          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs font-semibold text-dark-green/60 mb-3">Pricing</p>
            <Input
              label="Original Price (₱)"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="150"
            />

            <p className="text-xs font-semibold text-dark-green/60 mt-4 mb-2">Discount Tier</p>
            <div className="grid grid-cols-4 gap-2">
              {PRICING.DISCOUNT_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setDiscountTier(tier)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                    discountTier === tier
                      ? 'bg-gold text-dark-green border-gold shadow-md shadow-gold/25'
                      : 'bg-white text-dark-green/60 border-dark-green/10 hover:border-gold/40'
                  }`}
                >
                  {tier}%
                </button>
              ))}
            </div>

            {parsedOriginal > 0 && (
              <div className="mt-4 space-y-2">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-[11px] text-dark-green/40 mb-0.5">Customers pay</p>
                  <p className="text-2xl font-bold text-gold">{formatPrice(computedDiscountedPrice)}</p>
                  <Badge variant="gold" className="mt-1">{discountTier}% OFF</Badge>
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-dark-green/50">FoodSaver fee (15%)</span>
                  <span className="font-semibold text-dark-green/70">{formatPrice(computedPlatformFee)}</span>
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-dark-green/50">You receive</span>
                  <span className="font-bold text-dark-green">{formatPrice(computedStorePayout)}</span>
                </div>
              </div>
            )}
          </div>

          <Input
            label="How many bags available?"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="5"
          />

          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs font-semibold text-dark-green/60 mb-3">Pickup Window</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                type="time"
                value={pickupStart}
                onChange={(e) => setPickupStart(e.target.value)}
              />
              <Input
                label="Until"
                type="time"
                value={pickupEnd}
                onChange={(e) => setPickupEnd(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={saving || !title || !originalPrice || parsedOriginal <= 0}
            className="w-full"
            size="lg"
          >
            {saving ? 'Creating...' : 'Publish Listing'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ListingCard({ listing, onToggle }: { listing: Listing; onToggle: (l: Listing) => void }) {
  const remaining = listing.quantity_available - listing.quantity_sold
  const soldPercent = listing.quantity_available > 0
    ? Math.round((listing.quantity_sold / listing.quantity_available) * 100)
    : 0

  return (
    <Card className={`p-4 ${!listing.is_active ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display font-semibold text-base truncate">{listing.title}</h3>
          </div>
          {listing.description && (
            <p className="text-xs text-dark-green/45 truncate">{listing.description}</p>
          )}
        </div>
        <button
          onClick={() => onToggle(listing)}
          className="relative ml-3 flex-shrink-0"
          title={listing.is_active ? 'Deactivate' : 'Activate'}
        >
          <div className={`w-11 h-6 rounded-full transition-colors ${
            listing.is_active ? 'bg-success' : 'bg-dark-green/20'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
              listing.is_active ? 'translate-x-5.5 left-0' : 'left-0.5'
            }`} style={{ transform: listing.is_active ? 'translateX(22px)' : 'translateX(0)' }} />
          </div>
        </button>
      </div>

      {/* Price Row */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-lg font-bold text-gold">{formatPrice(listing.discounted_price)}</span>
        <span className="text-xs text-dark-green/35 line-through">{formatPrice(listing.original_price)}</span>
        <Badge variant="gold" className="text-[10px]">
          {calcDiscountPercent(listing.original_price, listing.discounted_price)}% OFF
        </Badge>
      </div>

      {/* Inventory Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-dark-green/50">
            {listing.quantity_sold} sold of {listing.quantity_available}
          </span>
          <span className={`font-semibold ${remaining <= 2 ? 'text-error' : 'text-dark-green/60'}`}>
            {remaining} left
          </span>
        </div>
        <div className="h-2 bg-dark-green/8 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              soldPercent >= 80 ? 'bg-success' : soldPercent >= 50 ? 'bg-gold' : 'bg-olive/50'
            }`}
            style={{ width: `${soldPercent}%` }}
          />
        </div>
      </div>

      {/* Pickup Info */}
      <div className="flex items-center gap-4 text-xs text-dark-green/45">
        <span className="flex items-center gap-1">
          🕐 {formatPickupWindow(listing.pickup_start, listing.pickup_end)}
        </span>
        {listing.available_date && (
          <span className="flex items-center gap-1">
            📅 {new Date(listing.available_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </Card>
  )
}
