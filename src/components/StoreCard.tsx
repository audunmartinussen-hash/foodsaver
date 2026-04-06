'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { Store } from '@/lib/types'

interface StoreCardProps {
  store: Store
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/store/${store.id}`}>
      <Card className="flex gap-3 p-3 hover:shadow-md transition-shadow">
        <div className="w-16 h-16 rounded-xl bg-olive/10 overflow-hidden flex-shrink-0">
          {store.image_url ? (
            <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-olive/30 text-2xl">
              {store.category === 'bakery' ? '🍞' :
               store.category === 'restaurant' ? '🍽' :
               store.category === 'grocery' ? '🛒' :
               store.category === 'cafe' ? '☕' : '🏪'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-dark-green text-sm truncate">
            {store.name}
          </h3>
          <p className="text-xs text-dark-green/50 truncate mt-0.5">{store.address}</p>
          <div className="mt-1.5">
            <Badge variant="olive">{store.category}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
