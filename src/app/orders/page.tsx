'use client'

import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import OrderCard from '@/components/OrderCard'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const { orders, loading: ordersLoading } = useOrders(user?.id)

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
                  <OrderCard key={order.id} order={order} showPickupCode />
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
