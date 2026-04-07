import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { orderId, listingTitle, amount, quantity } = await request.json()

    if (!orderId || !listingTitle || !amount || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const amountInCentavos = Math.round(amount * 100)

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            description: 'FoodSaver Order',
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                name: listingTitle,
                quantity: quantity,
              },
            ],
            payment_method_types: ['gcash', 'grab_pay', 'paymaya', 'card'],
            success_url: `${baseUrl}/orders?payment=success&order_id=${orderId}`,
            cancel_url: `${baseUrl}/orders?payment=cancelled&order_id=${orderId}`,
            metadata: {
              order_id: orderId,
            },
          },
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PayMongo error:', data)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checkoutUrl: data.data.attributes.checkout_url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
