'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import StoreCard from '@/components/StoreCard'
import Input from '@/components/ui/Input'
import type { Store } from '@/lib/types'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function ExplorePage() {
  const [stores, setStores] = useState<Store[]>([])
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Request user location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      )
    }

    const fetchStores = async () => {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setStores((data as Store[]) ?? [])

      // Get listing counts per store
      if (data) {
        const { data: listings } = await supabase
          .from('listings')
          .select('store_id')
          .eq('is_active', true)
          .gte('available_date', new Date().toISOString().split('T')[0])

        if (listings) {
          const counts: Record<string, number> = {}
          listings.forEach((l: { store_id: string }) => {
            counts[l.store_id] = (counts[l.store_id] || 0) + 1
          })
          setListingCounts(counts)
        }
      }

      setLoading(false)
    }
    fetchStores()
  }, [])

  const filtered = useMemo(() => {
    let result = stores.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    )

    // Sort by proximity if user location available
    if (userLocation) {
      result = result.sort((a, b) => {
        const distA = a.latitude && a.longitude
          ? getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
          : Infinity
        const distB = b.latitude && b.longitude
          ? getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
          : Infinity
        return distA - distB
      })
    }

    return result
  }, [stores, search, userLocation])

  const handleStoreClick = useCallback((store: Store) => {
    router.push(`/store/${store.id}`)
  }, [router])

  const formatDistance = (store: Store) => {
    if (!userLocation || !store.latitude || !store.longitude) return null
    const km = getDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-dark-green">Explore</h1>
        {/* View toggle */}
        <div className="flex bg-white rounded-xl border border-dark-green/10 p-0.5">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'list' ? 'bg-dark-green text-white' : 'text-dark-green/50'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'map' ? 'bg-dark-green text-white' : 'text-dark-green/50'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search stores, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : view === 'map' ? (
        <MapView
          stores={filtered}
          userLocation={userLocation}
          listingCounts={listingCounts}
          onStoreClick={handleStoreClick}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🔍</p>
          <p className="font-display font-semibold">No stores found</p>
          <p className="text-sm text-dark-green/50 mt-1">Try a different search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((store) => {
            const distance = formatDistance(store)
            return (
              <div key={store.id} className="relative">
                <StoreCard store={store} />
                {distance && (
                  <span className="absolute top-3 right-3 bg-dark-green/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {distance}
                  </span>
                )}
                {listingCounts[store.id] && (
                  <span className="absolute bottom-3 right-3 bg-gold/90 text-dark-green text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {listingCounts[store.id]} deal{listingCounts[store.id] > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
