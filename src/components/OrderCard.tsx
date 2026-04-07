'use client'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatPrice, formatPickupWindow } from '@/lib/utils'
import type { Order } from '@/lib/types'

interface OrderCardProps {
  order: Order
  showPickupCode?: boolean
}

const statusConfig = {
  reserved: { label: 'Reserved', variant: 'gold' as const },
  confirmed: { label: 'Confirmed', variant: 'olive' as const },
  picked_up: { label: 'Picked Up', variant: 'success' as const },
  cancelled: { label: 'Cancelled', variant: 'error' as const },
  no_show: { label: 'No Show', variant: 'error' as const },
}

export default function OrderCard({ order, showPickupCode = false }: OrderCardProps) {
  const status = statusConfig[order.status]
  const isActive = order.status === 'reserved' || order.status === 'confirmed'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-display font-semibold text-dark-green text-sm">
            {order.listing?.title ?? 'Order'}
          </h3>
          {order.store && (
            <p className="text-xs text-dark-green/50 mt-0.5">{order.store.name}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={status.variant}>{status.label}</Badge>
          {order.payment_status === 'paid' && (
            <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">Paid</span>
          )}
          {order.payment_status === 'pending' && (
            <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">Payment pending</span>
          )}
          {order.payment_status === 'failed' && (
            <span className="text-[10px] font-semibold text-error bg-error/10 px-2 py-0.5 rounded-full">Payment failed</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-dark-green/60">Qty: {order.quantity}</span>
        <span className="font-bold text-gold">{formatPrice(order.total_price)}</span>
      </div>

      {order.listing && (
        <p className="text-xs text-dark-green/50 mb-2">
          Pickup: {formatPickupWindow(order.listing.pickup_start, order.listing.pickup_end)}
        </p>
      )}

      {showPickupCode && isActive && order.pickup_code && (
        <div className="bg-cream rounded-xl p-3 text-center">
          <p className="text-xs text-dark-green/50 mb-1">Pickup Code</p>
          <p className="font-display text-3xl font-bold text-dark-green tracking-widest">
            {order.pickup_code}
          </p>
        </div>
      )}

      <p className="text-[10px] text-dark-green/30 mt-2">
        {new Date(order.reserved_at).toLocaleDateString('en-PH', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        })}
      </p>
    </Card>
  )
}
