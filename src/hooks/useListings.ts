'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/types'

export function useListings(city?: string) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      let query = supabase
        .from('listings')
        .select('*, store:stores(*)')
        .eq('is_active', true)
        .gte('available_date', new Date().toISOString().split('T')[0])
        .gt('quantity_available', 0)
        .order('created_at', { ascending: false })

      if (city) {
        query = query.eq('store.city', city)
      }

      const { data } = await query
      setListings((data as Listing[]) ?? [])
      setLoading(false)
    }

    fetchListings()
  }, [city])

  return { listings, loading }
}

export function useStoreListings(storeId: string) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setListings((data as Listing[]) ?? [])
      setLoading(false)
    }

    fetchListings()
  }, [storeId])

  return { listings, loading }
}
