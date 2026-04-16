'use client'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatPrice, formatPhpShort, formatPickupWindow } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'

interface OrderCardProps {
  order: Order
  showPickupCode?: boolean
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'gold' | 'olive' | 'success' | 'error' }> = {
  pending_fee_payment: { label: 'Pay fee', variant: 'gold' },
  pending_verification: { label: 'Verifying payment', variant: 'gold' },
  reserved: { label: 'Reserved', variant: 'gold' },
  confirmed: { label: 'Confirmed', variant: 'olive' },
  picked_up: { label: 'Picked Up', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  no_show: { label: 'No Show', variant: 'error' },
}

export default function OrderCard({ order, showPickupCode = false }: OrderCardProps) {
  const status = statusConfig[order.status] ?? statusConfig.reserved
  const isActive = order.status === 'confirmed' || order.status === 'reserved'
  const awaitingBuyerAction = order.status === 'pending_fee_payment'
  const awaitingVerification = order.status === 'pending_verification'

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

      {awaitingBuyerAction && (
        <div className="bg-gold/10 rounded-xl p-3 text-xs text-dark-green/70 mb-1">
          Reservation fee of <strong>{formatPhpShort(order.reservation_fee_php)}</strong> not paid yet. Tap \u201CPay fee\u201D to submit your GCash receipt.
        </div>
      )}

      {awaitingVerification && (
        <div className="bg-gold/10 rounded-xl p-3 text-xs text-dark-green/70 mb-1">
          We\u2019re verifying your GCash payment. You\u2019ll get an SMS once confirmed.
        </div>
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
