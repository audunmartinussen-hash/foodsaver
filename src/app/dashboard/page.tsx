'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { formatPrice, formatPickupWindow } from '@/lib/utils'
import type { Store, Order } from '@/lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [stats, setStats] = useState({ listings: 0, reservations: 0, pickups: 0, revenue: 0, platformFees: 0, netEarnings: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeCity, setStoreCity] = useState('Cagayan de Oro')
  const [storeCategory, setStoreCategory] = useState('other')
  const [storeDescription, setStoreDescription] = useState('')
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null)
  const [storeImagePreview, setStoreImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  const handleStoreImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStoreImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setStoreImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      // Get store
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (storeData) {
        setStore(storeData)

        // Get stats
        const { count: listingCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('is_active', true)

        const { count: reservationCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('status', 'reserved')

        const { count: pickupCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('status', 'picked_up')

        // Get total revenue from picked_up orders
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total_price, platform_fee')
          .eq('store_id', storeData.id)
          .eq('status', 'picked_up')

        const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_price || 0), 0) ?? 0
        const totalPlatformFees = revenueData?.reduce((sum, o) => sum + (o.platform_fee || 0), 0) ?? 0

        setStats({
          listings: listingCount ?? 0,
          reservations: reservationCount ?? 0,
          pickups: pickupCount ?? 0,
          revenue: totalRevenue,
          platformFees: totalPlatformFees,
          netEarnings: totalRevenue - totalPlatformFees,
        })

        // Get recent orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, listing:listings(*)')
          .eq('store_id', storeData.id)
          .order('reserved_at', { ascending: false })
          .limit(5)

        setRecentOrders(ordersData ?? [])
      } else {
        setShowStoreForm(true)
      }

      setLoading(false)
    }

    fetchData()
  }, [user])

  const createStore = async () => {
    if (!user) return
    setCreating(true)

    let imageUrl: string | null = null

    if (storeImageFile) {
      setUploadingImage(true)
      const ext = storeImageFile.name.split('.').pop()
      const filename = `${Date.now()}.${ext}`
      const path = `${user.id}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('store-images')
        .upload(path, storeImageFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('store-images')
          .getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }
      setUploadingImage(false)
    }

    const { data, error } = await supabase
      .from('stores')
      .insert({
        owner_id: user.id,
        name: storeName,
        description: storeDescription || null,
        address: storeAddress,
        city: storeCity,
        category: storeCategory,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (data) {
      setStore(data)
      setShowStoreForm(false)
    }
    setCreating(false)
  }

  const statusConfig: Record<string, { label: string; variant: 'gold' | 'olive' | 'success' | 'error' }> = {
    reserved: { label: 'Reserved', variant: 'gold' },
    confirmed: { label: 'Confirmed', variant: 'olive' },
    picked_up: { label: 'Picked Up', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    no_show: { label: 'No Show', variant: 'error' },
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (showStoreForm) {
    return (
      <div className="max-w-md">
        <h2 className="font-display text-xl font-bold mb-4">Set Up Your Store</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-green/15 bg-white"
              placeholder="e.g. Panaderia ni Maria"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-green/15 bg-white"
              placeholder="Street address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              value={storeCity}
              onChange={(e) => setStoreCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-green/15 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-green/15 bg-white resize-none"
              rows={2}
              placeholder="Tell customers about your store"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={storeCategory}
              onChange={(e) => setStoreCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-green/15 bg-white"
            >
              <option value="bakery">Bakery</option>
              <option value="restaurant">Restaurant</option>
              <option value="grocery">Grocery</option>
              <option value="cafe">Cafe</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Store Photo</label>
            {storeImagePreview ? (
              <div className="relative rounded-xl overflow-hidden mb-2">
                <img src={storeImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={() => { setStoreImageFile(null); setStoreImagePreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-dark-green/60 hover:bg-white"
                >
                  x
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-dark-green/20 rounded-xl cursor-pointer hover:border-gold/50 transition-colors bg-cream/50">
                <span className="text-3xl mb-1">📷</span>
                <span className="text-xs text-dark-green/40">Tap to add a photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStoreImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <Button onClick={createStore} disabled={creating || uploadingImage || !storeName || !storeAddress} className="w-full" size="lg">
            {uploadingImage ? 'Uploading image...' : creating ? 'Creating...' : 'Create Store'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Store Header */}
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold">{store?.name}</h2>
        <p className="text-sm text-dark-green/50">{store?.address}</p>
      </div>

      {/* Pending Approval Banner */}
      {store && !store.is_approved && (
        <div className="bg-gold/10 border border-gold/25 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-dark-green">Store Under Review</p>
              <p className="text-xs text-dark-green/60 mt-0.5 leading-relaxed">
                We are reviewing your store. Listings will be visible to customers once approved. This usually takes less than 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Active Listings</p>
              <p className="text-3xl font-bold text-dark-green mt-1">{stats.listings}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-olive/10 flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Pending Pickup</p>
              <p className="text-3xl font-bold text-gold mt-1">{stats.reservations}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <span className="text-lg">🕐</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Bags Saved</p>
              <p className="text-3xl font-bold text-success mt-1">{stats.pickups}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <span className="text-lg">🌱</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Net Earnings</p>
              <p className="text-2xl font-bold text-dark-green mt-1">{formatPrice(stats.netEarnings)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-dark-green/8 flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      {stats.revenue > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider mb-3">
            Revenue Breakdown
          </h3>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-green/60">Total Sales</span>
              <span className="text-sm font-semibold">{formatPrice(stats.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-green/60">FoodSaver Fee (15%)</span>
              <span className="text-sm font-semibold text-error">-{formatPrice(stats.platformFees)}</span>
            </div>
            <div className="border-t border-dark-green/10 pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-dark-green">Your Earnings</span>
              <span className="text-lg font-bold text-gold">{formatPrice(stats.netEarnings)}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/dashboard/listings">
          <Card className="p-4 hover:shadow-md transition-shadow h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-olive/10 flex items-center justify-center">
                <span className="text-2xl">+</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Add Listing</p>
                <p className="text-[11px] text-dark-green/40 mt-0.5">Create a new surprise bag</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/orders">
          <Card className="p-4 hover:shadow-md transition-shadow h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <span className="text-2xl">🧾</span>
              </div>
              <div>
                <p className="font-semibold text-sm">View Orders</p>
                <p className="text-[11px] text-dark-green/40 mt-0.5">
                  {stats.reservations > 0
                    ? `${stats.reservations} awaiting pickup`
                    : 'Manage reservations'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider">
          Recent Orders
        </h3>
        {recentOrders.length > 0 && (
          <Link href="/dashboard/orders" className="text-xs text-olive font-medium">
            View all
          </Link>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-3xl mb-2">🧾</p>
          <p className="text-sm text-dark-green/50">No orders yet</p>
          <p className="text-xs text-dark-green/35 mt-0.5">Orders will appear here when customers reserve</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentOrders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.reserved
            return (
              <Card key={order.id} className="p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      order.status === 'picked_up' ? 'bg-success/10' :
                      order.status === 'reserved' ? 'bg-gold/10' :
                      order.status === 'cancelled' || order.status === 'no_show' ? 'bg-error/10' :
                      'bg-olive/10'
                    }`}>
                      <span className="text-base">
                        {order.status === 'picked_up' ? '✅' :
                         order.status === 'reserved' ? '🕐' :
                         order.status === 'cancelled' ? '❌' :
                         order.status === 'no_show' ? '🚫' : '📋'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {order.listing?.title ?? 'Order'}
                      </p>
                      <p className="text-[11px] text-dark-green/40">
                        Qty: {order.quantity} · {formatPrice(order.total_price)} · {new Date(order.reserved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
