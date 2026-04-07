'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatPrice, formatPickupWindow } from '@/lib/utils'
import type { Order, Store } from '@/lib/types'

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'reserved', label: 'Pending' },
  { key: 'picked_up', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
]

const statusConfig: Record<string, { label: string; variant: 'gold' | 'olive' | 'success' | 'error'; icon: string }> = {
  reserved: { label: 'Awaiting Pickup', variant: 'gold', icon: '🕐' },
  confirmed: { label: 'Confirmed', variant: 'olive', icon: '📋' },
  picked_up: { label: 'Completed', variant: 'success', icon: '✅' },
  cancelled: { label: 'Cancelled', variant: 'error', icon: '❌' },
  no_show: { label: 'No Show', variant: 'error', icon: '🚫' },
}

export default function StoreOrdersPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [verifyCode, setVerifyCode] = useState<Record<string, string>>({})
  const [verifyError, setVerifyError] = useState<Record<string, boolean>>({})
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [markingNoShow, setMarkingNoShow] = useState<Record<string, boolean>>({})
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
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
      setVerifyError({ ...verifyError, [order.id]: true })
      setTimeout(() => setVerifyError({ ...verifyError, [order.id]: false }), 2000)
      return
    }

    setVerifying({ ...verifying, [order.id]: true })

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
      setVerifyCode({ ...verifyCode, [order.id]: '' })
    }
    setVerifying({ ...verifying, [order.id]: false })
  }

  const markNoShow = async (order: Order) => {
    setMarkingNoShow({ ...markingNoShow, [order.id]: true })

    const { error } = await supabase
      .from('orders')
      .update({ status: 'no_show' })
      .eq('id', order.id)

    if (!error) {
      setOrders(orders.map(o =>
        o.id === order.id ? { ...o, status: 'no_show' } : o
      ))
    }
    setMarkingNoShow({ ...markingNoShow, [order.id]: false })
  }

  const handleCancelOrder = async () => {
    if (!cancelOrderId || !cancelReason.trim()) return

    setCancelling(true)
    setCancelError(null)

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: cancelReason.trim(),
      })
      .eq('id', cancelOrderId)

    if (error) {
      setCancelError('Failed to cancel order. Please try again.')
      setCancelling(false)
      return
    }

    setOrders(orders.map(o =>
      o.id === cancelOrderId ? { ...o, status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_reason: cancelReason.trim() } : o
    ))
    setCancelOrderId(null)
    setCancelReason('')
    setCancelling(false)
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const orderCounts = {
    all: orders.length,
    reserved: orders.filter(o => o.status === 'reserved').length,
    picked_up: orders.filter(o => o.status === 'picked_up').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    no_show: orders.filter(o => o.status === 'no_show').length,
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold">Orders</h2>
        <p className="text-xs text-dark-green/45 mt-0.5">
          {orders.length} total · {orderCounts.reserved} awaiting pickup
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {filterTabs.map((tab) => {
          const count = orderCounts[tab.key as keyof typeof orderCounts] ?? 0
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === tab.key
                  ? 'bg-dark-green text-white shadow-sm'
                  : 'bg-white text-dark-green/50 border border-dark-green/10 hover:border-dark-green/20'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === tab.key ? 'bg-white/20' : 'bg-dark-green/8'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-3xl mb-3">🧾</p>
          <p className="font-semibold text-dark-green">No orders here</p>
          <p className="text-sm text-dark-green/40 mt-1">
            {filter === 'all'
              ? 'Orders will appear when customers reserve your listings'
              : `No ${filter.replace('_', ' ')} orders`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.reserved
            const isActive = order.status === 'reserved' || order.status === 'confirmed'
            const hasError = verifyError[order.id]

            return (
              <Card key={order.id} className={`overflow-hidden ${isActive ? 'border-gold/20' : ''}`}>
                {/* Order Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        order.status === 'picked_up' ? 'bg-success/10' :
                        order.status === 'reserved' ? 'bg-gold/10' :
                        order.status === 'cancelled' || order.status === 'no_show' ? 'bg-error/10' :
                        'bg-olive/10'
                      }`}>
                        <span className="text-lg">{status.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {order.listing?.title ?? 'Order'}
                        </h3>
                        <p className="text-xs text-dark-green/45 mt-0.5">
                          {order.quantity} {order.quantity === 1 ? 'bag' : 'bags'} · {formatPrice(order.total_price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {order.payment_status === 'paid' && (
                        <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">Paid</span>
                      )}
                      {order.payment_status === 'pending' && (
                        <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">Unpaid</span>
                      )}
                      {order.payment_status === 'failed' && (
                        <span className="text-[10px] font-semibold text-error bg-error/10 px-2 py-0.5 rounded-full">Failed</span>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex items-center gap-4 text-[11px] text-dark-green/35 ml-13">
                    {order.listing && (
                      <span>🕐 {formatPickupWindow(order.listing.pickup_start, order.listing.pickup_end)}</span>
                    )}
                    <span>
                      📅 {new Date(order.reserved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {order.status === 'picked_up' && order.picked_up_at && (
                    <p className="text-[11px] text-success/70 mt-1.5 ml-13">
                      Picked up {new Date(order.picked_up_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                {/* Unpaid warning for active orders */}
                {isActive && order.payment_status !== 'paid' && (
                  <div className="bg-gold/5 border-t border-gold/10 px-4 py-3">
                    <p className="text-xs text-gold font-medium text-center">
                      Awaiting payment — do not hand over items until payment is confirmed
                    </p>
                    <button
                      onClick={() => {
                        setCancelOrderId(order.id)
                        setCancelReason('')
                        setCancelError(null)
                      }}
                      className="mt-2 text-[11px] text-error/60 hover:text-error transition-colors w-full text-center"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {/* Pickup Verification Section — only for paid orders */}
                {isActive && order.payment_status === 'paid' && (
                  <div className="bg-cream/50 border-t border-dark-green/5 px-4 py-3">
                    <p className="text-xs font-medium text-dark-green/60 mb-2.5">
                      Verify Pickup Code
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          placeholder="Enter 4-digit code"
                          value={verifyCode[order.id] ?? ''}
                          onChange={(e) => {
                            setVerifyCode({ ...verifyCode, [order.id]: e.target.value.toUpperCase() })
                            setVerifyError({ ...verifyError, [order.id]: false })
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono tracking-widest text-center transition-colors ${
                            hasError
                              ? 'border-error bg-error/5 text-error'
                              : 'border-dark-green/15 bg-white'
                          }`}
                          maxLength={4}
                        />
                        {hasError && (
                          <p className="text-[10px] text-error mt-1 text-center">Wrong code. Try again.</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => markPickedUp(order)}
                        disabled={!verifyCode[order.id] || verifying[order.id]}
                        className="whitespace-nowrap"
                      >
                        {verifying[order.id] ? '...' : 'Confirm'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => markNoShow(order)}
                        disabled={markingNoShow[order.id]}
                        className="text-[11px] text-dark-green/35 hover:text-error transition-colors"
                      >
                        {markingNoShow[order.id] ? 'Marking...' : 'Mark as no-show'}
                      </button>
                      <button
                        onClick={() => {
                          setCancelOrderId(order.id)
                          setCancelReason('')
                          setCancelError(null)
                        }}
                        className="text-[11px] text-error/60 hover:text-error transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Order Modal */}
      <Modal
        isOpen={!!cancelOrderId}
        onClose={() => {
          setCancelOrderId(null)
          setCancelReason('')
          setCancelError(null)
        }}
        title="Cancel Order"
      >
        <div className="space-y-4">
          <p className="text-sm text-dark-green/60">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>

          <div>
            <label className="text-sm font-medium text-dark-green block mb-1.5">
              Reason for cancellation
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              className="w-full px-3 py-2.5 rounded-xl border border-dark-green/15 bg-white text-sm resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              rows={3}
            />
          </div>

          {cancelError && (
            <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center">
              {cancelError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCancelOrderId(null)
                setCancelReason('')
                setCancelError(null)
              }}
              className="flex-1 px-4 py-3 text-sm font-medium text-dark-green/60 bg-dark-green/5 rounded-xl hover:bg-dark-green/10 transition-colors"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling || !cancelReason.trim()}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-error rounded-xl hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
