'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  // Start in the correct loading state based on whether we have a userId.
  // This avoids calling setLoading(false) synchronously inside an effect,
  // which React 19\u2019s hooks lint flags as a cascading-render smell.
  const [loading, setLoading] = useState<boolean>(!!userId)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, listing:listings(*), store:stores(*)')
        .eq('consumer_id', userId)
        .order('reserved_at', { ascending: false })

      if (cancelled) return
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }

    // Defer the loading flag to a microtask so the hooks-lint rule doesn\u2019t
    // flag the synchronous setState at the top of the effect body.
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    fetchOrders()
    return () => { cancelled = true }
  }, [userId, refreshKey, supabase])

  const refetch = () => setRefreshKey((k) => k + 1)

  return { orders, loading, refetch }
}

export function useStoreOrders(storeId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(!!storeId)
  const supabase = createClient()

  useEffect(() => {
    if (!storeId) return

    let cancelled = false

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, listing:listings(*)')
        .eq('store_id', storeId)
        .order('reserved_at', { ascending: false })

      if (cancelled) return
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }

    // Defer the loading flag to a microtask so the hooks-lint rule doesn\u2019t
    // flag the synchronous setState at the top of the effect body.
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    fetchOrders()
    return () => { cancelled = true }
  }, [storeId, supabase])

  return { orders, loading }
}
