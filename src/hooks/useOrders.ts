'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, listing:listings(*), store:stores(*)')
        .eq('consumer_id', userId)
        .order('reserved_at', { ascending: false })

      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }

    fetchOrders()
  }, [userId, refreshKey])

  const refetch = () => setRefreshKey((k) => k + 1)

  return { orders, loading, refetch }
}

export function useStoreOrders(storeId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!storeId) {
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, listing:listings(*)')
        .eq('store_id', storeId)
        .order('reserved_at', { ascending: false })

      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }

    fetchOrders()
  }, [storeId])

  return { orders, loading }
}
