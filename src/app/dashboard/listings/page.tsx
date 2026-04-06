'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { formatPrice, calcDiscountPercent, formatPickupWindow } from '@/lib/utils'
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
  const [discountedPrice, setDiscountedPrice] = useState('')
  const [quantity, setQuantity] = useState('5')
  const [pickupStart, setPickupStart] = useState('17:00')
  const [pickupEnd, setPickupEnd] = useState('19:00')

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
        original_price: parseFloat(originalPrice),
        discounted_price: parseFloat(discountedPrice),
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
    setDiscountedPrice('')
    setQuantity('5')
    setPickupStart('17:00')
    setPickupEnd('19:00')
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Listings</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Add Listing</Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📦</p>
          <p className="font-semibold">No listings yet</p>
          <p className="text-sm text-dark-green/50 mt-1">Add your first surprise bag</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{listing.title}</h3>
                    {!listing.is_active && <Badge variant="error">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-dark-green/50 mt-0.5">{listing.description}</p>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="font-bold text-gold">{formatPrice(listing.discounted_price)}</span>
                    <span className="text-xs text-dark-green/40 line-through">{formatPrice(listing.original_price)}</span>
                    <Badge variant="gold" className="text-[10px]">
                      {calcDiscountPercent(listing.original_price, listing.discounted_price)}% OFF
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-dark-green/50">
                    <span>{formatPickupWindow(listing.pickup_start, listing.pickup_end)}</span>
                    <span>{listing.quantity_sold}/{listing.quantity_available} sold</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(listing)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    listing.is_active
                      ? 'bg-error/10 text-error'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {listing.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Listing Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm() }} title="Add Listing">
        <div className="space-y-3">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Surprise Bread Bag"
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Assorted breads and pastries"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Original Price (₱)"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="150"
            />
            <Input
              label="Sale Price (₱)"
              type="number"
              value={discountedPrice}
              onChange={(e) => setDiscountedPrice(e.target.value)}
              placeholder="59"
            />
          </div>
          {originalPrice && discountedPrice && (
            <p className="text-sm text-gold font-medium">
              {calcDiscountPercent(parseFloat(originalPrice), parseFloat(discountedPrice))}% discount
            </p>
          )}
          <Input
            label="Quantity Available"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="5"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pickup Start"
              type="time"
              value={pickupStart}
              onChange={(e) => setPickupStart(e.target.value)}
            />
            <Input
              label="Pickup End"
              type="time"
              value={pickupEnd}
              onChange={(e) => setPickupEnd(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={saving || !title || !originalPrice || !discountedPrice}
            className="w-full"
            size="lg"
          >
            {saving ? 'Creating...' : 'Create Listing'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
