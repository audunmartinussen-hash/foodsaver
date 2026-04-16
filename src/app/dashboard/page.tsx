'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { formatPrice, formatPickupWindow, LAUNCH_CITY } from '@/lib/utils'
import type { Store, Order } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

/**
 * Merchant dashboard landing.
 *
 * Post-pivot copy: the merchant collects **cash at pickup** — FoodSaver takes
 * **no cut** of item revenue. The only money that flows through FoodSaver is
 * the 20 PHP reservation fee paid by buyers via GCash, which is billed
 * separately and never touches the merchant.
 *
 * So: no "platform fee", no "net earnings" line, no surprise-bag wording.
 * What the merchant cares about here is:
 *   1. Today's confirmed reservations (with pickup codes visible so they can
 *      glance-verify a buyer),
 *   2. Their listing pipeline,
 *   3. Historical revenue & trend.
 */

export default function DashboardPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [stats, setStats] = useState({ listings: 0, reservations: 0, pickups: 0, revenue: 0 })
  const [todayReservations, setTodayReservations] = useState<Order[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [weeklySales, setWeeklySales] = useState<{ day: string; revenue: number }[]>([])
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number; color: string }[]>([])
  const [popularItems, setPopularItems] = useState<{ title: string; orders: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeCity, setStoreCity] = useState(LAUNCH_CITY)
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

        const today = new Date().toISOString().split('T')[0]

        // Active listing count
        const { count: listingCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('is_active', true)

        // Pickups lifetime (for "bags saved" and revenue)
        const { data: pickupRows } = await supabase
          .from('orders')
          .select('total_price')
          .eq('store_id', storeData.id)
          .eq('status', 'picked_up')

        const totalRevenue = pickupRows?.reduce((sum, o) => sum + (o.total_price || 0), 0) ?? 0

        // Today's confirmed/reserved orders — the "ops" view
        const { data: todayData } = await supabase
          .from('orders')
          .select('*, listing:listings(*)')
          .eq('store_id', storeData.id)
          .in('status', ['confirmed', 'reserved'])
          .order('reserved_at', { ascending: true })

        const todayOnly = (todayData ?? []).filter(
          (o) => o.listing?.available_date === today
        ) as Order[]

        setStats({
          listings: listingCount ?? 0,
          reservations: todayOnly.length,
          pickups: pickupRows?.length ?? 0,
          revenue: totalRevenue,
        })
        setTodayReservations(todayOnly.slice(0, 5))

        // Recent orders (mixed status) for the history card
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, listing:listings(*)')
          .eq('store_id', storeData.id)
          .order('reserved_at', { ascending: false })
          .limit(5)

        setRecentOrders(ordersData ?? [])

        // --- Analytics: Weekly Sales (last 7 days, picked_up orders) ---
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const { data: weeklyData } = await supabase
          .from('orders')
          .select('total_price, picked_up_at')
          .eq('store_id', storeData.id)
          .eq('status', 'picked_up')
          .gte('picked_up_at', sevenDaysAgo.toISOString())

        const dailyMap: Record<string, number> = {}
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo)
          d.setDate(d.getDate() + i)
          const key = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
          dailyMap[key] = 0
        }
        weeklyData?.forEach((o) => {
          if (o.picked_up_at) {
            const d = new Date(o.picked_up_at)
            const key = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
            if (key in dailyMap) {
              dailyMap[key] += o.total_price || 0
            }
          }
        })
        setWeeklySales(Object.entries(dailyMap).map(([day, revenue]) => ({ day, revenue })))

        // --- Analytics: Orders by Status ---
        const statusColors: Record<string, string> = {
          confirmed: '#5C6B3C',
          picked_up: '#4A8C5C',
          cancelled: '#D94F4F',
          no_show: '#D94F4F',
        }
        const statusEntries: { name: string; value: number; color: string }[] = []
        for (const [status, color] of Object.entries(statusColors)) {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeData.id)
            .eq('status', status)
          if ((count ?? 0) > 0) {
            const labels: Record<string, string> = {
              confirmed: 'Confirmed', picked_up: 'Picked Up',
              cancelled: 'Cancelled', no_show: 'No Show',
            }
            statusEntries.push({ name: labels[status] ?? status, value: count ?? 0, color })
          }
        }
        setOrdersByStatus(statusEntries)

        // --- Analytics: Popular Items (top 3 by order count) ---
        const { data: allOrders } = await supabase
          .from('orders')
          .select('listing_id, listing:listings(title)')
          .eq('store_id', storeData.id)

        if (allOrders && allOrders.length > 0) {
          const listingCounts: Record<string, { title: string; count: number }> = {}
          allOrders.forEach((o: { listing_id: string; listing?: { title?: string } | { title?: string }[] | null }) => {
            const id = o.listing_id
            const listingField = o.listing
            const title = Array.isArray(listingField)
              ? listingField[0]?.title ?? 'Unknown'
              : listingField?.title ?? 'Unknown'
            if (!listingCounts[id]) listingCounts[id] = { title, count: 0 }
            listingCounts[id].count++
          })
          const sorted = Object.values(listingCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
          setPopularItems(sorted.map((item) => ({ title: item.title, orders: item.count })))
        }
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

    const { data } = await supabase
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
    pending_fee_payment: { label: 'Fee pending', variant: 'gold' },
    pending_verification: { label: 'Verifying', variant: 'gold' },
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
        <h2 className="font-display text-xl font-bold mb-1">Set up your store</h2>
        <p className="text-sm text-dark-green/55 mb-4">
          After you submit, we&rsquo;ll review your details and sign the paper merchant agreement
          before your listings go live to buyers.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Store name</label>
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
            <p className="text-[11px] text-dark-green/40 mt-1">
              We&rsquo;re launching in {LAUNCH_CITY} only right now.
            </p>
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
            <label className="block text-sm font-medium mb-1">Store photo</label>
            {storeImagePreview ? (
              <div className="relative rounded-xl overflow-hidden mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <span className="text-3xl mb-1">\uD83D\uDCF7</span>
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
            {uploadingImage ? 'Uploading image\u2026' : creating ? 'Submitting\u2026' : 'Submit for review'}
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
              <span className="text-xl">\u23F3</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-dark-green">Store under review</p>
              <p className="text-xs text-dark-green/60 mt-0.5 leading-relaxed">
                Your listings are hidden from buyers until we complete the paper
                merchant agreement. Questions? Message the founders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Reservations — top of the page, the thing merchants glance at */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider">
            Today&rsquo;s reservations
          </h3>
          <Link href="/dashboard/orders" className="text-xs text-olive font-medium">
            View all
          </Link>
        </div>
        {todayReservations.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-3xl mb-2">\uD83C\uDF1E</p>
            <p className="text-sm font-medium text-dark-green">No reservations for today yet</p>
            <p className="text-xs text-dark-green/40 mt-0.5">
              New reservations appear here the moment admin confirms the buyer&rsquo;s fee.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayReservations.map((order) => (
              <Card key={order.id} className="p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{order.listing?.title ?? 'Order'}</p>
                    <p className="text-[11px] text-dark-green/45">
                      Qty: {order.quantity} \u00B7 {formatPrice(order.total_price)} cash
                    </p>
                    {order.listing && (
                      <p className="text-[11px] text-dark-green/40">
                        {formatPickupWindow(order.listing.pickup_start, order.listing.pickup_end)}
                      </p>
                    )}
                  </div>
                  {order.pickup_code ? (
                    <div className="bg-cream rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                      <p className="text-[9px] uppercase tracking-wider text-dark-green/45">Code</p>
                      <p className="font-display text-lg font-bold tracking-widest text-dark-green leading-none">
                        {order.pickup_code}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="gold">Reserved</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Active listings</p>
              <p className="text-3xl font-bold text-dark-green mt-1">{stats.listings}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-olive/10 flex items-center justify-center">
              <span className="text-lg">\uD83D\uDCE6</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Today&rsquo;s pickups</p>
              <p className="text-3xl font-bold text-gold mt-1">{stats.reservations}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <span className="text-lg">\uD83D\uDD50</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Bags saved</p>
              <p className="text-3xl font-bold text-success mt-1">{stats.pickups}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <span className="text-lg">\uD83C\uDF31</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-green/45 font-medium">Cash collected</p>
              <p className="text-2xl font-bold text-dark-green mt-1">{formatPrice(stats.revenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-dark-green/8 flex items-center justify-center">
              <span className="text-lg">\uD83D\uDCB0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue note — no platform cut, just a clarifying tip */}
      {stats.revenue > 0 && (
        <Card className="p-4 mb-6 bg-cream/60 border border-dark-green/5">
          <p className="text-sm font-semibold text-dark-green">You keep 100% of pickup cash</p>
          <p className="text-xs text-dark-green/60 mt-1 leading-relaxed">
            FoodSaver doesn&rsquo;t take a cut of what buyers pay you at pickup. Buyers
            pay a separate 20 PHP reservation fee to FoodSaver via GCash to hold their bag.
          </p>
        </Card>
      )}

      {/* Analytics */}
      {(weeklySales.length > 0 || ordersByStatus.length > 0 || popularItems.length > 0) && (
        <div className="mb-6">
          <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider mb-3">
            Analytics
          </h3>

          {/* Weekly Sales Chart */}
          <Card className="p-4 mb-3">
            <p className="text-sm font-semibold text-dark-green mb-3">Weekly pickups revenue</p>
            {weeklySales.some((d) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklySales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#2B3A2B80' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#2B3A2B80' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatPrice(Number(value)), 'Revenue']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#2B3A2B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-dark-green/40">
                No data yet
              </div>
            )}
          </Card>

          {/* Orders by Status + Popular Items row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Orders by Status */}
            <Card className="p-4">
              <p className="text-sm font-semibold text-dark-green mb-2">Order status</p>
              {ordersByStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        dataKey="value"
                        stroke="none"
                      >
                        {ordersByStatus.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {ordersByStatus.map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-[10px] text-dark-green/60 truncate">{s.name}</span>
                        <span className="text-[10px] font-semibold text-dark-green ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-sm text-dark-green/40">
                  No data yet
                </div>
              )}
            </Card>

            {/* Popular Items */}
            <Card className="p-4">
              <p className="text-sm font-semibold text-dark-green mb-2">Top items</p>
              {popularItems.length > 0 ? (
                <div className="space-y-3 mt-1">
                  {popularItems.map((item, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-dark-green truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-dark-green/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(item.orders / popularItems[0].orders) * 100}%`,
                              backgroundColor: i === 0 ? '#C9A84C' : i === 1 ? '#5C6B3C' : '#2B3A2B',
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-dark-green/60 flex-shrink-0">
                          {item.orders}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-sm text-dark-green/40">
                  No data yet
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider mb-3">
        Quick actions
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/dashboard/listings">
          <Card className="p-4 hover:shadow-md transition-shadow h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-olive/10 flex items-center justify-center">
                <span className="text-2xl">+</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Add listing</p>
                <p className="text-[11px] text-dark-green/40 mt-0.5">Discounted item, fixed price</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/orders">
          <Card className="p-4 hover:shadow-md transition-shadow h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <span className="text-2xl">\uD83E\uDDFE</span>
              </div>
              <div>
                <p className="font-semibold text-sm">View orders</p>
                <p className="text-[11px] text-dark-green/40 mt-0.5">
                  {stats.reservations > 0
                    ? `${stats.reservations} to pick up today`
                    : 'Mark pickups, handle no-shows'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs text-dark-green/45 uppercase tracking-wider">
          Recent orders
        </h3>
        {recentOrders.length > 0 && (
          <Link href="/dashboard/orders" className="text-xs text-olive font-medium">
            View all
          </Link>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-3xl mb-2">\uD83E\uDDFE</p>
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
                      order.status === 'reserved' || order.status === 'confirmed' ? 'bg-gold/10' :
                      order.status === 'cancelled' || order.status === 'no_show' ? 'bg-error/10' :
                      'bg-olive/10'
                    }`}>
                      <span className="text-base">
                        {order.status === 'picked_up' ? '\u2705' :
                         order.status === 'reserved' || order.status === 'confirmed' ? '\uD83D\uDD50' :
                         order.status === 'cancelled' ? '\u274C' :
                         order.status === 'no_show' ? '\uD83D\uDEAB' : '\uD83D\uDCCB'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {order.listing?.title ?? 'Order'}
                      </p>
                      <p className="text-[11px] text-dark-green/40">
                        Qty: {order.quantity} \u00B7 {formatPrice(order.total_price)} \u00B7 {new Date(order.reserved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
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
