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
      const today = new Date().toISOString().split('T')[0]
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const currentDay = dayNames[new Date().getDay()]

      const { data, error } = await supabase
        .from('listings')
        .select('*, store:stores(*)')
        .eq('is_active', true)
        .gt('quantity_available', 0)
        .or(`available_date.gte.${today},and(is_recurring.eq.true,recurring_days.cs.{"${currentDay}"})`)
        .order('created_at', { ascending: false })

      if (error) console.error('useListings error:', error)
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
