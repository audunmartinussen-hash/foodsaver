'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import OrderCard from '@/components/OrderCard'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="px-4 pt-4">
        <div className="h-8 bg-white rounded-xl animate-pulse w-32 mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl animate-pulse mb-3" />
        ))}
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}

function OrdersContent() {
  const { user, loading: authLoading } = useAuth()
  const { orders, loading: ordersLoading } = useOrders(user?.id)
  const searchParams = useSearchParams()
  const [banner, setBanner] = useState<{ type: 'success' | 'cancelled'; orderId: string } | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)

  useEffect(() => {
    const payment = searchParams.get('payment')
    const orderId = searchParams.get('order_id')

    if (payment && orderId) {
      if (payment === 'success') {
        setBanner({ type: 'success', orderId })
      } else if (payment === 'cancelled') {
        setBanner({ type: 'cancelled', orderId })
      }

      // Clean up URL params without triggering navigation
      window.history.replaceState({}, '', '/orders')
    }
  }, [searchParams])

  const handleRetryPayment = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order || !order.listing) return

    setRetrying(orderId)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          listingTitle: order.listing.title,
          amount: order.total_price,
          quantity: order.quantity,
        }),
      })

      const data = await res.json()

      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      // Silently fail, user can try again
    }

    setRetrying(null)
  }

  if (authLoading || ordersLoading) {
    return (
      <div className="px-4 pt-4">
        <div className="h-8 bg-white rounded-xl animate-pulse w-32 mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl animate-pulse mb-3" />
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-5xl mb-4">📦</p>
        <h2 className="font-display text-xl font-semibold mb-2">Sign in to view orders</h2>
        <p className="text-sm text-dark-green/50 mb-4">
          Track your reserved food pickups
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  const activeOrders = orders.filter(o => o.status === 'reserved' || o.status === 'confirmed')
  const pastOrders = orders.filter(o => o.status !== 'reserved' && o.status !== 'confirmed')

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-dark-green mb-5">My Orders</h1>

      {/* Payment status banners */}
      {banner?.type === 'success' && (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-dark-green text-sm">Payment successful!</p>
              <p className="text-xs text-dark-green/50 mt-0.5">
                Your order is confirmed. Show the pickup code at the store.
              </p>
            </div>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="mt-2 text-xs text-dark-green/40 hover:text-dark-green/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {banner?.type === 'cancelled' && (
        <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-dark-green text-sm">Payment cancelled</p>
              <p className="text-xs text-dark-green/50 mt-0.5">
                Your order was created but payment was not completed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button
              size="sm"
              onClick={() => handleRetryPayment(banner.orderId)}
              disabled={retrying === banner.orderId}
            >
              {retrying === banner.orderId ? 'Redirecting...' : 'Try Again'}
            </Button>
            <button
              onClick={() => setBanner(null)}
              className="text-xs text-dark-green/40 hover:text-dark-green/60"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-display font-semibold">No orders yet</p>
          <p className="text-sm text-dark-green/50 mt-1">
            Browse deals and reserve your first bag!
          </p>
          <Link href="/">
            <Button className="mt-4">Browse Deals</Button>
          </Link>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-dark-green/60 uppercase tracking-wider mb-3">
                Active
              </h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order.id}>
                    <OrderCard order={order} showPickupCode />
                    {order.payment_status === 'pending' && (
                      <div className="mt-2 flex justify-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRetryPayment(order.id)}
                          disabled={retrying === order.id}
                        >
                          {retrying === order.id ? 'Redirecting...' : 'Complete Payment'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-dark-green/60 uppercase tracking-wider mb-3">
                Past Orders
              </h2>
              <div className="space-y-3">
                {pastOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
