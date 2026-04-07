import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
