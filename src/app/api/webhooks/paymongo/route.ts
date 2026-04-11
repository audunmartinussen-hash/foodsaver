import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const event = body?.data?.attributes

    if (!event) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const eventType = event.type

    if (eventType === 'checkout_session.payment.paid') {
      const checkoutSession = event.data
      const metadata = checkoutSession?.attributes?.metadata
      const orderId = metadata?.order_id
      const checkoutSessionId = checkoutSession?.id

      if (!orderId) {
        console.error('No order_id in webhook metadata')
        return NextResponse.json({ received: true })
      }

      // Use service-level client for webhook (no user session available)
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_id: checkoutSessionId ?? null,
        })
        .eq('id', orderId)

      if (error) {
        console.error('Failed to update order payment status:', error)
      }

      // Send email notifications (non-blocking — don't let email failures break the webhook)
      try {
        // Fetch order with listing, store, and consumer details
        const { data: order } = await supabase
          .from('orders')
          .select('*, listing:listings(*), store:stores(*)')
          .eq('id', orderId)
          .single()

        if (order && order.listing && order.store) {
          // Get consumer email
          const { data: consumerAuth } = await supabase.auth.admin.getUserById(order.consumer_id)
          const consumerEmail = consumerAuth?.user?.email

          // Get store owner email
          const { data: ownerAuth } = await supabase.auth.admin.getUserById(order.store.owner_id)
          const ownerEmail = ownerAuth?.user?.email

          const pickupWindow = `${new Date(order.listing.pickup_start).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })} – ${new Date(order.listing.pickup_end).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`

          // Send order confirmation to consumer
          if (consumerEmail) {
            await sendOrderConfirmation(consumerEmail, {
              pickupCode: order.pickup_code ?? '',
              listingTitle: order.listing.title,
              storeName: order.store.name,
              storeAddress: order.store.address,
              quantity: order.quantity,
              totalPrice: order.total_price,
              pickupWindow,
            })
          }

          // Send new order notification to store owner
          if (ownerEmail) {
            await sendNewOrderNotification(ownerEmail, {
              listingTitle: order.listing.title,
              quantity: order.quantity,
              totalPrice: order.total_price,
              pickupCode: order.pickup_code ?? '',
            })
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError)
        // Don't fail the webhook response because of email errors
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
