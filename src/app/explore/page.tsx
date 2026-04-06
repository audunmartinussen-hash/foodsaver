'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StoreCard from '@/components/StoreCard'
import Input from '@/components/ui/Input'
import type { Store } from '@/lib/types'

export default function ExplorePage() {
  const [stores, setStores] = useState<Store[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStores = async () => {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setStores((data as Store[]) ?? [])
      setLoading(false)
    }
    fetchStores()
  }, [])

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-dark-green mb-4">Explore Stores</h1>

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🔍</p>
          <p className="font-display font-semibold">No stores found</p>
          <p className="text-sm text-dark-green/50 mt-1">Try a different search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  )
}
