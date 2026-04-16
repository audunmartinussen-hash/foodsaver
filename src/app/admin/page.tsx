'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatPhpShort, formatPickupWindow, formatPrice } from '@/lib/utils'
import { track } from '@/lib/analytics'
import type { Order, Profile, Store } from '@/lib/types'

type Tab = 'verifications' | 'merchants' | 'ops' | 'users' | 'metrics'

interface StoreWithOwner extends Store {
  owner?: Profile
}

// Intersection over Order so we can narrow the joined-relation shape without
// the TS interface-extension conflict (Order.listing is the full Listing type,
// whereas the admin query only selects a subset of columns).
type PendingVerification = Omit<Order, 'listing' | 'store' | 'consumer'> & {
  listing?: { title: string; pickup_start: string; pickup_end: string; available_date: string } | null
  store?: { name: string; address: string } | null
  consumer?: Profile | null
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('verifications')
  const [loading, setLoading] = useState(true)
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [pendingStores, setPendingStores] = useState<StoreWithOwner[]>([])
  const [approvedStores, setApprovedStores] = useState<StoreWithOwner[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [metrics, setMetrics] = useState({ last7: 0, pickups7: 0, noShows7: 0, feesCollected7: 0 })
  const [working, setWorking] = useState<string | null>(null)
  const supabase = createClient()

  // Note: we don\u2019t setLoading(true) at the top of this function. The initial
  // loading state is seeded by `useState(true)` for mount; subsequent refreshes
  // (after handleVerify/handleReject) keep the existing data visible while
  // re-fetching, which is the intended UX.
  const fetchAll = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [vRes, sRes, oRes, uRes, metricOrders] = await Promise.all([
      supabase
        .from('orders')
        .select('*, listing:listings(title, pickup_start, pickup_end, available_date), store:stores(name, address), consumer:profiles!orders_consumer_id_fkey(*)')
        .eq('status', 'pending_verification')
        .order('reservation_fee_paid_at', { ascending: true }),
      supabase
        .from('stores')
        .select('*, owner:profiles!stores_owner_id_fkey(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('*, listing:listings(title, pickup_start, pickup_end), store:stores(name)')
        .in('status', ['confirmed', 'reserved', 'pending_verification'])
        .order('reserved_at', { ascending: false })
        .limit(50),
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('orders')
        .select('status, reservation_fee_php, reserved_at')
        .gte('reserved_at', sevenDaysAgo),
    ])

    setPendingVerifications((vRes.data as PendingVerification[]) ?? [])

    const allStores = (sRes.data as StoreWithOwner[]) ?? []
    setPendingStores(allStores.filter(s => !s.is_approved))
    setApprovedStores(allStores.filter(s => s.is_approved))

    setActiveOrders((oRes.data as Order[]) ?? [])
    setUsers((uRes.data as Profile[]) ?? [])

    const mOrders = metricOrders.data ?? []
    setMetrics({
      last7: mOrders.length,
      pickups7: mOrders.filter(o => o.status === 'picked_up').length,
      noShows7: mOrders.filter(o => o.status === 'no_show').length,
      feesCollected7: mOrders
        .filter(o => o.status === 'confirmed' || o.status === 'picked_up')
        .reduce((sum, o) => sum + (o.reservation_fee_php || 0), 0),
    })

    setLoading(false)
  }

  // fetchAll is async; all setState calls inside happen after the awaited
  // Supabase queries. The lint rule conservatively flags the named call, so
  // we silence it here — the pattern itself is fine.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [])

  const handleVerify = async (orderId: string) => {
    setWorking(orderId)
    const res = await fetch(`/api/admin/reservations/${orderId}/verify`, { method: 'POST' })
    if (res.ok) {
      track('reservation_confirmed', { order_id: orderId })
      await fetchAll()
    }
    setWorking(null)
  }

  const handleReject = async (orderId: string) => {
    const reason = window.prompt('Rejection reason (sent to buyer):', 'We could not verify the payment')
    if (!reason) return
    setWorking(orderId)
    const res = await fetch(`/api/admin/reservations/${orderId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (res.ok) {
      track('reservation_cancelled', { order_id: orderId, reason: 'admin_rejected_proof' })
      await fetchAll()
    }
    setWorking(null)
  }

  const handleApproveStore = async (storeId: string) => {
    await supabase.from('stores').update({ is_approved: true }).eq('id', storeId)
    fetchAll()
  }
  const handleRevokeStore = async (storeId: string) => {
    await supabase.from('stores').update({ is_approved: false }).eq('id', storeId)
    fetchAll()
  }
  const handleRejectStore = async (storeId: string) => {
    await supabase.from('stores').update({ is_active: false, is_approved: false }).eq('id', storeId)
    fetchAll()
  }

  const handleTogglePause = async (userId: string, paused: boolean) => {
    await supabase
      .from('profiles')
      .update({
        account_paused_at: paused ? null : new Date().toISOString(),
        account_paused_reason: paused ? null : 'Manually paused by admin',
      })
      .eq('id', userId)
    fetchAll()
  }

  const handleResetNoShowCount = async (userId: string) => {
    await supabase.from('profiles').update({ no_show_count_30d: 0 }).eq('id', userId)
    fetchAll()
  }

  const pausedUsers = useMemo(() => users.filter(u => !!u.account_paused_at), [users])

  return (
    <div>
      {/* Top metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-3 text-center">
          <p className="text-xs text-dark-green/50">Verify queue</p>
          <p className="text-2xl font-bold text-gold mt-1">{pendingVerifications.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-dark-green/50">Pending merchants</p>
          <p className="text-2xl font-bold text-dark-green mt-1">{pendingStores.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-dark-green/50">Active today</p>
          <p className="text-2xl font-bold text-olive mt-1">{activeOrders.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-dark-green/50">Paused users</p>
          <p className="text-2xl font-bold text-error mt-1">{pausedUsers.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {[
          ['verifications', `Verify (${pendingVerifications.length})`],
          ['merchants', `Merchants (${pendingStores.length})`],
          ['ops', 'Today\u2019s Ops'],
          ['users', 'Users'],
          ['metrics', 'Metrics'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key ? 'bg-dark-green text-white' : 'bg-white text-dark-green/60 border border-dark-green/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : tab === 'verifications' ? (
        pendingVerifications.length === 0 ? (
          <Empty emoji="\u2705" title="No pending verifications" sub="All caught up!" />
        ) : (
          <div className="space-y-3">
            {pendingVerifications.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start gap-3">
                  {order.reservation_fee_proof_url ? (
                    <a href={order.reservation_fee_proof_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={order.reservation_fee_proof_url} alt="Proof" className="w-28 h-28 object-cover rounded-xl bg-cream" />
                    </a>
                  ) : (
                    <div className="w-28 h-28 bg-cream rounded-xl flex items-center justify-center text-xs text-dark-green/40">No image</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-semibold text-sm truncate">{order.listing?.title}</h3>
                      <span className="text-xs text-gold font-semibold whitespace-nowrap">{formatPhpShort(order.reservation_fee_php)}</span>
                    </div>
                    <p className="text-xs text-dark-green/55 truncate">{order.store?.name}</p>
                    <p className="text-xs text-dark-green/55">Qty: {order.quantity} \u00B7 Cash at pickup {formatPrice(order.total_price)}</p>
                    <p className="text-xs text-dark-green/40 mt-0.5">Buyer: {order.consumer?.full_name ?? 'Unknown'} {order.consumer?.phone ? `\u00B7 ${order.consumer.phone}` : ''}</p>
                    <p className="text-[10px] text-dark-green/30 mt-0.5">
                      Paid {order.reservation_fee_paid_at ? new Date(order.reservation_fee_paid_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '\u2014'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => handleVerify(order.id)} disabled={working === order.id} className="flex-1">
                    {working === order.id ? 'Working\u2026' : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(order.id)} disabled={working === order.id} className="flex-1 !text-error !border-error">
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'merchants' ? (
        <div className="space-y-5">
          {pendingStores.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-dark-green/45 uppercase tracking-wider mb-2">Pending</h3>
              <div className="space-y-3">
                {pendingStores.map((store) => (
                  <Card key={store.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-semibold text-sm">{store.name}</h3>
                        <p className="text-xs text-dark-green/50">{store.address}, {store.city}</p>
                        {store.owner && <p className="text-xs text-olive mt-0.5">Owner: {store.owner.full_name}</p>}
                      </div>
                      <Badge variant="olive">{store.category}</Badge>
                    </div>
                    {store.description && <p className="text-xs text-dark-green/60 mb-3">{store.description}</p>}
                    <p className="text-[10px] text-dark-green/30 mb-3">
                      Applied: {new Date(store.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveStore(store.id)} className="flex-1">Approve (paper signed)</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectStore(store.id)} className="flex-1 !text-error !border-error">Reject</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold text-dark-green/45 uppercase tracking-wider mb-2">Approved ({approvedStores.length})</h3>
            <div className="space-y-2">
              {approvedStores.map((store) => (
                <Card key={store.id} className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{store.name}</p>
                      <p className="text-xs text-dark-green/45 truncate">{store.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Approved</Badge>
                      <button
                        onClick={() => handleRevokeStore(store.id)}
                        className="text-[10px] text-error/70 hover:text-error underline"
                      >Revoke</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      ) : tab === 'ops' ? (
        activeOrders.length === 0 ? (
          <Empty emoji="\uD83C\uDFC1" title="No active reservations" sub="Quiet day." />
        ) : (
          <div className="space-y-2">
            {activeOrders.map((o) => (
              <Card key={o.id} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{o.listing?.title ?? 'Order'}</p>
                    <p className="text-xs text-dark-green/50 truncate">{o.store?.name}</p>
                    {o.listing && (
                      <p className="text-xs text-dark-green/45 mt-0.5">
                        Pickup {formatPickupWindow(o.listing.pickup_start, o.listing.pickup_end)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={o.status === 'confirmed' ? 'olive' : o.status === 'pending_verification' ? 'gold' : 'gold'}>
                      {o.status.replace(/_/g, ' ')}
                    </Badge>
                    {o.pickup_code && (
                      <span className="text-sm font-bold text-dark-green tracking-widest">{o.pickup_code}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'users' ? (
        <div className="space-y-2">
          {users.map((u) => {
            const paused = !!u.account_paused_at
            return (
              <Card key={u.id} className="p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-dark-green/45 truncate">{u.phone ?? '\u2014'} \u00B7 {u.role}</p>
                    <p className="text-[11px] text-dark-green/40 mt-0.5">No-shows 30d: <strong>{u.no_show_count_30d}</strong></p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {paused && <Badge variant="error">Paused</Badge>}
                    <button
                      onClick={() => handleTogglePause(u.id, paused)}
                      className="text-[11px] text-olive underline"
                    >{paused ? 'Unpause' : 'Pause'}</button>
                    {u.no_show_count_30d > 0 && (
                      <button
                        onClick={() => handleResetNoShowCount(u.id)}
                        className="text-[11px] text-dark-green/50 underline"
                      >Reset counter</button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-dark-green/50">Reservations last 7d</p>
            <p className="text-3xl font-bold text-dark-green mt-1">{metrics.last7}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-dark-green/50">Pickups last 7d</p>
            <p className="text-3xl font-bold text-success mt-1">{metrics.pickups7}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-dark-green/50">No-shows last 7d</p>
            <p className="text-3xl font-bold text-error mt-1">{metrics.noShows7}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-dark-green/50">Fees collected 7d</p>
            <p className="text-3xl font-bold text-gold mt-1">{formatPhpShort(metrics.feesCollected7)}</p>
          </Card>
        </div>
      )}
    </div>
  )
}

function Empty({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-2">{emoji}</p>
      <p className="font-display font-semibold text-dark-green">{title}</p>
      {sub && <p className="text-sm text-dark-green/50 mt-1">{sub}</p>}
    </div>
  )
}
