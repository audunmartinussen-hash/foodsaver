'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/types'

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('listings')
        .select('*, store:stores(*)')
        .eq('is_active', true)
        .gte('available_date', new Date().toISOString().split('T')[0])
        .gt('quantity_available', 0)
        .order('created_at', { ascending: false })

      setListings((data as Listing[]) ?? [])
      setLoading(false)
    }

    fetchListings()
  }, [])

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
