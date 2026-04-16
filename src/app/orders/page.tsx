'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { createClient } from '@/lib/supabase/client'
import OrderCard from '@/components/OrderCard'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'
import { track } from '@/lib/analytics'

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

function StarRating({ rating, onRate, size = 'lg' }: { rating: number; onRate?: (r: number) => void; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={!onRate}
          className={`${size === 'lg' ? 'text-3xl' : 'text-lg'} transition-transform ${onRate ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <span className={star <= rating ? 'text-gold' : 'text-dark-green/15'}>
            {star <= rating ? '\u2605' : '\u2606'}
          </span>
        </button>
      ))}
    </div>
  )
}

function OrdersContent() {
  const { user, loading: authLoading } = useAuth()
  const { orders, loading: ordersLoading, refetch } = useOrders(user?.id)
  const supabase = createClient()

  // Cancel order state
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Review state
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set())

  // Fetch which orders have already been reviewed
  useEffect(() => {
    if (!user || orders.length === 0) return

    const fetchReviews = async () => {
      const pickedUpOrderIds = orders
        .filter(o => o.status === 'picked_up')
        .map(o => o.id)

      if (pickedUpOrderIds.length === 0) return

      const { data } = await supabase
        .from('reviews')
        .select('order_id')
        .in('order_id', pickedUpOrderIds)

      if (data) {
        setReviewedOrders(new Set(data.map(r => r.order_id)))
      }
    }

    fetchReviews()
  }, [user, orders])

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

    track('reservation_cancelled', { order_id: cancelOrderId, source: 'buyer', reason: cancelReason.trim() })
    setCancelOrderId(null)
    setCancelReason('')
    setCancelling(false)
    refetch()
  }

  const handleSubmitReview = async () => {
    if (!reviewOrderId || reviewRating === 0) return

    const order = orders.find(o => o.id === reviewOrderId)
    if (!order || !user) return

    setSubmittingReview(true)
    setReviewError(null)

    const { error } = await supabase
      .from('reviews')
      .insert({
        order_id: order.id,
        store_id: order.store_id,
        consumer_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      })

    if (error) {
      setReviewError('Failed to submit review. Please try again.')
      setSubmittingReview(false)
      return
    }

    // Update store avg_rating and review_count
    const { data: storeData } = await supabase
      .from('stores')
      .select('avg_rating, review_count')
      .eq('id', order.store_id)
      .single()

    if (storeData) {
      const newCount = storeData.review_count + 1
      const newAvg = ((storeData.avg_rating * storeData.review_count) + reviewRating) / newCount
      await supabase
        .from('stores')
        .update({ avg_rating: Math.round(newAvg * 10) / 10, review_count: newCount })
        .eq('id', order.store_id)
    }

    setReviewedOrders(new Set([...reviewedOrders, order.id]))
    setReviewOrderId(null)
    setReviewRating(0)
    setReviewComment('')
    setSubmittingReview(false)
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
        <p className="text-5xl mb-4">\uD83D\uDCE6</p>
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

  // Active = anything pre-pickup. New statuses `pending_fee_payment`,
  // `pending_verification` are included so the buyer sees their in-flight
  // reservations with the right CTA.
  const activeStatuses = new Set(['pending_fee_payment', 'pending_verification', 'reserved', 'confirmed'])
  const activeOrders = orders.filter(o => activeStatuses.has(o.status))
  const pastOrders = orders.filter(o => !activeStatuses.has(o.status))

  return (
    <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-dark-green mb-5">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">\uD83D\uDCE6</p>
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
                    <div className="mt-2 flex justify-center gap-2 flex-wrap">
                      {order.status === 'pending_fee_payment' && (
                        <Link href={`/reserve/${order.id}`}>
                          <Button size="sm">Pay reservation fee</Button>
                        </Link>
                      )}
                      {order.status === 'pending_verification' && (
                        <Link href={`/reserve/${order.id}`}>
                          <Button size="sm" variant="outline">View submission</Button>
                        </Link>
                      )}
                      {order.status !== 'pending_verification' && (
                        <button
                          onClick={() => {
                            setCancelOrderId(order.id)
                            setCancelReason('')
                            setCancelError(null)
                          }}
                          className="px-4 py-2 text-xs font-medium text-error bg-error/5 hover:bg-error/10 rounded-xl transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
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
                  <div key={order.id}>
                    <OrderCard order={order} />
                    {order.status === 'picked_up' && !reviewedOrders.has(order.id) && (
                      <div className="mt-2 flex justify-center">
                        <button
                          onClick={() => {
                            setReviewOrderId(order.id)
                            setReviewRating(0)
                            setReviewComment('')
                            setReviewError(null)
                          }}
                          className="px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        >
                          Leave Review
                        </button>
                      </div>
                    )}
                    {order.status === 'picked_up' && reviewedOrders.has(order.id) && (
                      <div className="mt-2 flex justify-center">
                        <span className="px-4 py-2 text-xs font-medium text-dark-green/40">
                          Reviewed
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
            Are you sure you want to cancel this order? Reservation fees are non-refundable.
          </p>

          <div>
            <label className="text-sm font-medium text-dark-green block mb-1.5">
              Reason for cancellation
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you're cancelling..."
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

      {/* Leave Review Modal */}
      <Modal
        isOpen={!!reviewOrderId}
        onClose={() => {
          setReviewOrderId(null)
          setReviewRating(0)
          setReviewComment('')
          setReviewError(null)
        }}
        title="Leave a Review"
      >
        <div className="space-y-4">
          {reviewOrderId && (() => {
            const order = orders.find(o => o.id === reviewOrderId)
            return order ? (
              <div className="bg-cream rounded-xl p-3">
                <p className="font-semibold text-sm text-dark-green">{order.listing?.title ?? 'Order'}</p>
                <p className="text-xs text-dark-green/50 mt-0.5">{order.store?.name}</p>
              </div>
            ) : null
          })()}

          <div>
            <label className="text-sm font-medium text-dark-green block mb-2">
              Rating
            </label>
            <div className="flex justify-center">
              <StarRating rating={reviewRating} onRate={setReviewRating} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-dark-green block mb-1.5">
              Comment (optional)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-3 py-2.5 rounded-xl border border-dark-green/15 bg-white text-sm resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              rows={3}
            />
          </div>

          {reviewError && (
            <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center">
              {reviewError}
            </div>
          )}

          <Button
            onClick={handleSubmitReview}
            disabled={submittingReview || reviewRating === 0}
            className="w-full"
            size="lg"
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
