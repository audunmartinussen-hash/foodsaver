import { NextResponse } from 'next/server'
import {
  sendOrderConfirmation,
  sendPickupReminder,
  sendOrderCancelled,
  sendNewOrderNotification,
} from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { type, to, data } = await request.json()

    if (!type || !to || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to, data' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'order_confirmation':
        result = await sendOrderConfirmation(to, data)
        break
      case 'pickup_reminder':
        result = await sendPickupReminder(to, data)
        break
      case 'order_cancelled':
        result = await sendOrderCancelled(to, data)
        break
      case 'new_order':
        result = await sendNewOrderNotification(to, data)
        break
      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[email route] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
