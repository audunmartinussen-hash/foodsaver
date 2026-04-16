'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatPrice, formatPickupWindow } from '@/lib/utils'
import { track } from '@/lib/analytics'
import type { Order, Profile, Store } from '@/lib/types'

/**
 * Merchant-facing orders view.
 *
 * Post-pivot the merchant no longer collects online payment — buyers pay
 * cash at pickup. The merchant\u2019s core action is a **one-tap Mark Picked
 * Up** button; they verify the pickup code visually against what the buyer
 * shows. Mark No-Show is still available but is usually auto-handled by the
 * `/api/admin/no-show-sweep` cron.
 */

const filterTabs = [
  { key: 'today', label: 'Today' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'picked_up', label: 'Completed' },
  { key: 'no_show', label: 'No-show' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusConfig: Record<string, { label: string; variant: 'gold' | 'olive' | 'success' | 'error'; icon: string }> = {
  pending_fee_payment: { label: 'Fee pending', variant: 'gold', icon: '\u23F3' },
  pending_verification: { label: 'Verifying', variant: 'gold', icon: '\u23F3' },
  reserved: { label: 'Reserved', variant: 'gold', icon: '\uD83D\uDD50' },
  confirmed: { label: 'Confirmed', variant: 'olive', icon: '\uD83D\uDCCB' },
  picked_up: { label: 'Picked up', variant: 'success', icon: '\u2705' },
  cancelled: { label: 'Cancelled', variant: 'error', icon: '\u274C' },
  no_show: { label: 'No show', variant: 'error', icon: '\uD83D\uDEAB' },
}

type OrderWithConsumer = Order & { consumer?: Pick<Profile, 'id' | 'full_name' | 'phone'> | null }

export default function StoreOrdersPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<OrderWithConsumer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('today')
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [markError, setMarkError] = useState<string | null>(null)
  const [noShowId, setNoShowId] = useState<string | null>(null)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const supabase = createClient()

  const refetch = async () => {
    if (!user) return
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    if (!storeData) { setLoading(false); return }
    setStore(storeData)

    const { data } = await supabase
      .from('orders')
      .select('*, listing:listings(*), consumer:profiles!orders_consumer_id_fkey(id, full_name, phone)')
      .eq('store_id', storeData.id)
      .order('reserved_at', { ascending: false })
      .limit(200)
    setOrders((data as OrderWithConsumer[]) ?? [])
    setLoading(false)
  }

  // refetch() is async; any setState inside happens after the awaited Supabase
  // calls, which is fine. The lint rule flags the named call conservatively.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { refetch() }, [user])

  const markPickedUp = async (order: OrderWithConsumer) => {
    setMarkingId(order.id)
    setMarkError(null)
    const res = await fetch(`/api/orders/${order.id}/mark-picked-up`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMarkError(body?.error || 'Failed to mark picked up')
    } else {
      track('pickup_completed', { order_id: order.id, store_id: order.store_id })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'picked_up', picked_up_at: new Date().toISOString() } : o))
    }
    setMarkingId(null)
  }

  const markNoShow = async (order: OrderWithConsumer) => {
    setNoShowId(order.id)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'no_show', no_show_at: new Date().toISOString() })
      .eq('id', order.id)
    if (!error) {
      track('no_show_recorded', { order_id: order.id, store_id: order.store_id, source: 'merchant' })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'no_show' } : o))
    }
    setNoShowId(null)
  }

  const handleCancelOrder = async () => {
    if (!cancelOrderId || !cancelReason.trim()) return
    setCancelling(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_reason: cancelReason.trim() })
      .eq('id', cancelOrderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === cancelOrderId ? { ...o, status: 'cancelled', cancelled_reason: cancelReason.trim() } : o))
    }
    setCancelOrderId(null)
    setCancelReason('')
    setCancelling(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = (o: OrderWithConsumer) => o.listing?.available_date === today
  const todayReservations = orders.filter(o =>
    (o.status === 'confirmed' || o.status === 'reserved') && isToday(o)
  )

  const filteredOrders = filter === 'today'
    ? todayReservations
    : orders.filter(o => o.status === filter)

  const orderCounts = {
    today: todayReservations.length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    picked_up: orders.filter(o => o.status === 'picked_up').length,
    no_show: orders.filter(o => o.status === 'no_show').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!store) {
    return (
      <Card className="p-6 text-center">
        <p className="text-3xl mb-2">\uD83C\uDFEA</p>
        <p className="font-semibold">No store yet</p>
        <p className="text-sm text-dark-green/50 mt-1">Create a store on the dashboard to receive orders.</p>
      </Card>
    )
  }

  if (!store.is_approved) {
    return (
      <Card className="p-5">
        <p className="font-semibold text-sm text-dark-green">Store under review</p>
        <p className="text-xs text-dark-green/60 mt-1 leading-relaxed">
          We\u2019ll flip the approval flag once the paper merchant agreement is signed. Orders will appear here after approval.
        </p>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold">Orders</h2>
        <p className="text-xs text-dark-green/45 mt-0.5">
          {todayReservations.length} reservation{todayReservations.length === 1 ? '' : 's'} today
        </p>
      </div>

      {/* Tabs */}
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

      {markError && (
        <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center mb-3">{markError}</div>
      )}

      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-3xl mb-3">\uD83E\uDDFE</p>
          <p className="font-semibold text-dark-green">
            {filter === 'today' ? 'No reservations today' : 'No orders here'}
          </p>
          <p className="text-sm text-dark-green/40 mt-1">
            {filter === 'today'
              ? 'New reservations will appear as soon as admin confirms the buyer\u2019s fee.'
              : `No ${filter.replace('_', ' ')} orders`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.reserved
            const actionable = order.status === 'confirmed' || order.status === 'reserved'

            return (
              <Card key={order.id} className={`overflow-hidden ${actionable ? 'border-gold/20' : ''}`}>
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        order.status === 'picked_up' ? 'bg-success/10' :
                        order.status === 'reserved' || order.status === 'confirmed' ? 'bg-gold/10' :
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
                          {order.quantity} {order.quantity === 1 ? 'bag' : 'bags'} \u00B7 {formatPrice(order.total_price)} cash
                        </p>
                        <p className="text-[11px] text-dark-green/40 mt-0.5 truncate">
                          Buyer: {order.consumer?.full_name?.split(' ')[0] ?? 'Unknown'}
                          {order.consumer?.phone ? ` \u00B7 ${order.consumer.phone}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  {order.listing && (
                    <p className="text-[11px] text-dark-green/40">
                      Pickup {formatPickupWindow(order.listing.pickup_start, order.listing.pickup_end)}
                    </p>
                  )}

                  {actionable && order.pickup_code && (
                    <div className="mt-3 bg-cream rounded-xl py-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-dark-green/45">Pickup code</p>
                      <p className="font-display text-3xl font-bold tracking-[0.3em] text-dark-green">{order.pickup_code}</p>
                      <p className="text-[10px] text-dark-green/40 mt-0.5">Buyer will show this</p>
                    </div>
                  )}
                </div>

                {actionable && (
                  <div className="bg-cream/40 border-t border-dark-green/5 px-4 py-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => markPickedUp(order)}
                      disabled={markingId === order.id}
                      className="flex-1 min-w-[120px]"
                    >
                      {markingId === order.id ? 'Marking\u2026' : 'Mark picked up'}
                    </Button>
                    <button
                      onClick={() => markNoShow(order)}
                      disabled={noShowId === order.id}
                      className="text-[11px] text-dark-green/50 hover:text-error underline"
                    >
                      {noShowId === order.id ? 'Marking\u2026' : 'No-show'}
                    </button>
                    <button
                      onClick={() => { setCancelOrderId(order.id); setCancelReason('') }}
                      className="text-[11px] text-error/60 hover:text-error underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={!!cancelOrderId}
        onClose={() => { setCancelOrderId(null); setCancelReason('') }}
        title="Cancel order"
      >
        <div className="space-y-4">
          <p className="text-sm text-dark-green/60">
            The buyer will be notified. Their reservation fee is non-refundable unless you\u2019re cancelling because the item is no longer available — in which case, email the founders to refund manually.
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason (e.g. ran out of stock)"
            className="w-full px-3 py-2.5 rounded-xl border border-dark-green/15 bg-white text-sm resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            rows={3}
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setCancelOrderId(null); setCancelReason('') }}
              className="flex-1 px-4 py-3 text-sm font-medium text-dark-green/60 bg-dark-green/5 rounded-xl hover:bg-dark-green/10 transition-colors"
            >
              Keep order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling || !cancelReason.trim()}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-error rounded-xl hover:bg-error/90 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling\u2026' : 'Cancel order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
