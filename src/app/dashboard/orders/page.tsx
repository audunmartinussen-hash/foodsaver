'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatPrice, formatPickupWindow } from '@/lib/utils'
import type { Order, Store } from '@/lib/types'

export default function StoreOrdersPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [verifyCode, setVerifyCode] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (storeData) {
        setStore(storeData)

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, listing:listings(*)')
          .eq('store_id', storeData.id)
          .order('reserved_at', { ascending: false })

        setOrders(ordersData ?? [])
      }
      setLoading(false)
    }

    fetchData()
  }, [user])

  const markPickedUp = async (order: Order) => {
    const code = verifyCode[order.id]
    if (code !== order.pickup_code) {
      alert('Incorrect pickup code')
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'picked_up',
        picked_up_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (!error) {
      setOrders(orders.map(o =>
        o.id === order.id ? { ...o, status: 'picked_up', picked_up_at: new Date().toISOString() } : o
      ))
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const statusConfig: Record<string, { label: string; variant: 'gold' | 'olive' | 'success' | 'error' }> = {
    reserved: { label: 'Reserved', variant: 'gold' },
    confirmed: { label: 'Confirmed', variant: 'olive' },
    picked_up: { label: 'Picked Up', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    no_show: { label: 'No Show', variant: 'error' },
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">Orders</h2>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'reserved', 'confirmed', 'picked_up', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-dark-green text-white'
                : 'bg-white text-dark-green/50 border border-dark-green/10'
            }`}
          >
            {f === 'all' ? 'All' : f === 'picked_up' ? 'Picked Up' : f === 'no_show' ? 'No Show' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🧾</p>
          <p className="text-dark-green/50">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.reserved
            const isActive = order.status === 'reserved' || order.status === 'confirmed'

            return (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {order.listing?.title ?? 'Order'}
                    </h3>
                    <p className="text-xs text-dark-green/50 mt-0.5">
                      Qty: {order.quantity} · {formatPrice(order.total_price)}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {order.listing && (
                  <p className="text-xs text-dark-green/40 mb-2">
                    Pickup: {formatPickupWindow(order.listing.pickup_start, order.listing.pickup_end)}
                  </p>
                )}

                <p className="text-[10px] text-dark-green/30 mb-2">
                  Reserved: {new Date(order.reserved_at).toLocaleString('en-PH')}
                </p>

                {isActive && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dark-green/5">
                    <input
                      placeholder="Enter pickup code"
                      value={verifyCode[order.id] ?? ''}
                      onChange={(e) => setVerifyCode({ ...verifyCode, [order.id]: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-dark-green/15 text-sm"
                      maxLength={4}
                    />
                    <Button
                      size="sm"
                      onClick={() => markPickedUp(order)}
                      disabled={!verifyCode[order.id]}
                    >
                      Verify & Complete
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
