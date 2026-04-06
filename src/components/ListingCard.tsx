'use client'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatPrice, calcDiscountPercent, formatPickupWindow } from '@/lib/utils'
import type { Listing } from '@/lib/types'

interface ListingCardProps {
  listing: Listing
  onClick?: () => void
}

export default function ListingCard({ listing, onClick }: ListingCardProps) {
  const discount = calcDiscountPercent(listing.original_price, listing.discounted_price)
  const remaining = listing.quantity_available - listing.quantity_sold

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="relative">
        <div className="aspect-[4/3] bg-olive/10 overflow-hidden">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-olive/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6.115 5.19l.319 1.053A6 6 0 0012 10.5a6 6 0 005.566-4.257l.319-1.053M4.5 12h15m-15 0a2.25 2.25 0 01-2.25-2.25V7.5a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 7.5v2.25A2.25 2.25 0 0119.5 12m-15 0v6.75A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25V12" />
              </svg>
            </div>
          )}
        </div>
        <Badge variant="gold" className="absolute top-3 right-3 text-sm font-bold shadow-sm">
          {discount}% OFF
        </Badge>
      </div>

      <div className="p-3.5">
        {listing.store && (
          <p className="text-xs text-olive font-medium mb-0.5">{listing.store.name}</p>
        )}
        <h3 className="font-display font-semibold text-dark-green text-sm leading-tight mb-2">
          {listing.title}
        </h3>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-gold">{formatPrice(listing.discounted_price)}</span>
          <span className="text-xs text-dark-green/40 line-through">{formatPrice(listing.original_price)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-dark-green/60">
          <span>{formatPickupWindow(listing.pickup_start, listing.pickup_end)}</span>
          <span className={remaining <= 2 ? 'text-error font-medium' : ''}>
            {remaining} left
          </span>
        </div>
      </div>
    </Card>
  )
}
