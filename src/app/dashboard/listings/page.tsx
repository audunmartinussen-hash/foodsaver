'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { formatPrice, calcDiscountPercent, formatPickupWindow, PRICING } from '@/lib/utils'
import type { Listing, Store } from '@/lib/types'

/**
 * Merchant listings CRUD.
 *
 * Post-pivot rules (from FOODSAVER_PRELAUNCH_UPDATES.md):
 * - Fixed-price, discounted items only. No surprise bags.
 * - Minimum 20% discount from the original price — enforced in the form.
 * - FoodSaver takes zero commission, so we show merchant a "you receive"
 *   line equal to the buyer price × quantity. There is no platform-fee line.
 * - Pickup window defaults to 17:00\u201319:00 (most CDO bakeries close ~7pm).
 */

// Preset discount tiers shown as quick-pick chips. Merchants can still type a
// custom discounted_price by editing the slider later — for now these cover
// the 3 points the prelaunch doc called out.
const DISCOUNT_TIERS = [30, 50, 70] as const

function calcDiscountedPrice(originalPrice: number, discountPercent: number): number {
  if (!originalPrice || originalPrice <= 0) return 0
  const raw = originalPrice * (1 - discountPercent / 100)
  // Round to nearest peso — no centavo quirks on signage.
  return Math.max(0, Math.round(raw))
}

export default function ManageListingsPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountTier, setDiscountTier] = useState<number>(50)
  const [quantity, setQuantity] = useState('5')
  const [pickupStart, setPickupStart] = useState('17:00')
  const [pickupEnd, setPickupEnd] = useState('19:00')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDays, setRecurringDays] = useState<string[]>([])

  const parsedOriginal = parseFloat(originalPrice) || 0
  const computedDiscountedPrice = calcDiscountedPrice(parsedOriginal, discountTier)
  const computedMerchantReceives = computedDiscountedPrice * (parseInt(quantity) || 0)
  const belowMinDiscount = discountTier < PRICING.MIN_DISCOUNT

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
  }, [user, supabase])

  const handleCreate = async () => {
    if (!store) return

    // Guard: minimum 20% discount enforced client-side. The server has no
    // schema-level constraint for this (pricing is open-ended) so this is
    // the only gate. Keep the copy explicit so merchants aren\u2019t confused.
    if (belowMinDiscount) {
      setFormError(`Discount must be at least ${PRICING.MIN_DISCOUNT}% for FoodSaver listings.`)
      return
    }
    if (parsedOriginal <= 0) {
      setFormError('Original price must be greater than zero.')
      return
    }

    setFormError(null)
    setSaving(true)

    const { data } = await supabase
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
        is_recurring: isRecurring,
        recurring_days: isRecurring ? recurringDays : [],
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
    setIsRecurring(false)
    setRecurringDays([])
    setFormError(null)
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
            {listings.length} total \u00B7 {activeListings.length} active
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          + New listing
        </Button>
      </div>

      {store && !store.is_approved && (
        <div className="bg-gold/10 border border-gold/25 rounded-2xl p-3 mb-4 text-xs text-dark-green/70 leading-relaxed">
          Listings are created in draft until your store is approved. Buyers won&rsquo;t see them yet.
        </div>
      )}

      {listings.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-olive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">\uD83D\uDCE6</span>
          </div>
          <p className="font-display font-semibold text-lg">No listings yet</p>
          <p className="text-sm text-dark-green/50 mt-1 mb-4">
            Add a discounted item and set a pickup window. Buyers will see it in the feed.
          </p>
          <Button onClick={() => setShowForm(true)}>
            Create first listing
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
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm() }} title="New listing">
        <div className="space-y-4">
          <div>
            <Input
              label="Item name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pandesal + Ensaymada bundle"
            />
            <p className="text-[11px] text-dark-green/35 mt-1">Be specific. Buyers should know exactly what they\u2019re getting.</p>
          </div>
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 10 pcs pandesal + 2 ensaymada, made this morning"
          />

          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs font-semibold text-dark-green/60 mb-3">Pricing</p>
            <Input
              label="Original price (\u20B1)"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="150"
            />

            <p className="text-xs font-semibold text-dark-green/60 mt-4 mb-2">Discount</p>
            <div className="grid grid-cols-3 gap-2">
              {DISCOUNT_TIERS.map((tier) => (
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
                  {tier}% off
                </button>
              ))}
            </div>
            <p className="text-[11px] text-dark-green/40 mt-2">
              Minimum {PRICING.MIN_DISCOUNT}% off — below that, listings aren&rsquo;t accepted.
            </p>

            {parsedOriginal > 0 && (
              <div className="mt-4 space-y-2">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-[11px] text-dark-green/40 mb-0.5">Buyer pays you in cash</p>
                  <p className="text-2xl font-bold text-gold">{formatPrice(computedDiscountedPrice)}</p>
                  <Badge variant="gold" className="mt-1">{discountTier}% OFF</Badge>
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2 text-[11px] text-dark-green/55 leading-relaxed">
                  You keep 100% of the cash at pickup. FoodSaver bills buyers a separate \u20B120 reservation fee via GCash &mdash; that never touches you.
                </div>
              </div>
            )}
          </div>

          <Input
            label="Quantity available"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="5"
          />

          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs font-semibold text-dark-green/60 mb-3">Pickup window</p>
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

          {/* Recurring Toggle */}
          <div className="bg-cream rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs font-semibold text-dark-green/60">Recurring listing</p>
                <p className="text-[11px] text-dark-green/35 mt-0.5">Auto-renew on selected days each week</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRecurring(!isRecurring)
                  if (isRecurring) setRecurringDays([])
                }}
                className="relative flex-shrink-0"
              >
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  isRecurring ? 'bg-success' : 'bg-dark-green/20'
                }`}>
                  <div
                    className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5"
                    style={{ transform: isRecurring ? 'translateX(22px)' : 'translateX(2px)', transition: 'transform 0.2s' }}
                  />
                </div>
              </button>
            </div>

            {isRecurring && (
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const selected = recurringDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setRecurringDays(
                          selected
                            ? recurringDays.filter(d => d !== day)
                            : [...recurringDays, day]
                        )
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        selected
                          ? 'bg-dark-green text-white border-dark-green'
                          : 'bg-white text-dark-green/50 border-dark-green/10 hover:border-dark-green/30'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {formError && (
            <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center">
              {formError}
            </div>
          )}

          {parsedOriginal > 0 && parseInt(quantity) > 0 && (
            <div className="text-[11px] text-dark-green/50 text-center">
              If all {quantity} sell, you collect {formatPrice(computedMerchantReceives)} in cash at pickup.
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={saving || !title || !originalPrice || parsedOriginal <= 0 || belowMinDiscount}
            className="w-full"
            size="lg"
          >
            {saving ? 'Creating\u2026' : 'Publish listing'}
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
          \uD83D\uDD50 {formatPickupWindow(listing.pickup_start, listing.pickup_end)}
        </span>
        {listing.available_date && (
          <span className="flex items-center gap-1">
            \uD83D\uDCC5 {new Date(listing.available_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </Card>
  )
}
