'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import type { Store } from '@/lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [stats, setStats] = useState({ listings: 0, reservations: 0, pickups: 0 })
  const [loading, setLoading] = useState(true)
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeCity, setStoreCity] = useState('Cagayan de Oro')
  const [storeCategory, setStoreCategory] = useState('other')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

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
        const today = new Date().toISOString().split('T')[0]

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

        setStats({
          listings: listingCount ?? 0,
          reservations: reservationCount ?? 0,
          pickups: pickupCount ?? 0,
        })
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

    const { data, error } = await supabase
      .from('stores')
      .insert({
        owner_id: user.id,
        name: storeName,
        address: storeAddress,
        city: storeCity,
        category: storeCategory,
      })
      .select()
      .single()

    if (data) {
      setStore(data)
      setShowStoreForm(false)
    }
    setCreating(false)
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
          <Button onClick={createStore} disabled={creating || !storeName || !storeAddress} className="w-full" size="lg">
            {creating ? 'Creating...' : 'Create Store'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold">{store?.name}</h2>
        <p className="text-sm text-dark-green/50">{store?.address}</p>
      </div>

      {/* Pending Approval Banner */}
      {store && !store.is_approved && (
        <div className="bg-gold/15 border border-gold/30 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-sm text-dark-green">Pending Approval</p>
              <p className="text-xs text-dark-green/60 mt-0.5">
                Your store is being reviewed by our team. Your listings will be visible to customers once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-dark-green">{stats.listings}</p>
          <p className="text-xs text-dark-green/50 mt-0.5">Active Listings</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gold">{stats.reservations}</p>
          <p className="text-xs text-dark-green/50 mt-0.5">Reservations</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{stats.pickups}</p>
          <p className="text-xs text-dark-green/50 mt-0.5">Picked Up</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <h3 className="font-semibold text-sm text-dark-green/60 uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      <div className="space-y-2">
        <Link href="/dashboard/listings">
          <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-xl">📦</span>
              <div>
                <p className="font-semibold text-sm">Manage Listings</p>
                <p className="text-xs text-dark-green/50">Add, edit, or deactivate listings</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Card>
        </Link>
        <Link href="/dashboard/orders">
          <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-xl">🧾</span>
              <div>
                <p className="font-semibold text-sm">View Orders</p>
                <p className="text-xs text-dark-green/50">Incoming reservations and pickups</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Card>
        </Link>
      </div>
    </div>
  )
}
