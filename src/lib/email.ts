import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_ADDRESS = 'FoodSaver <noreply@foodsaverph.com>'

function getResendClient(): Resend | null {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set — skipping email send')
  }
  return resend
}

function formatPrice(amount: number): string {
  return `₱${amount.toFixed(2)}`
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FoodSaver</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#2B3A2B;padding:20px 24px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">FoodSaver</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f9f9f9;border-top:1px solid #e5e5e5;">
              <p style="margin:0;color:#999;font-size:12px;text-align:center;">Save food. Save money. Save the planet.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOrderConfirmation(
  to: string,
  order: {
    pickupCode: string
    listingTitle: string
    storeName: string
    storeAddress: string
    quantity: number
    totalPrice: number
    pickupWindow: string
  }
) {
  const client = getResendClient()
  if (!client) return { success: false, error: 'Email not configured' }

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#2B3A2B;font-size:18px;">Order Confirmed!</h2>
    <p style="margin:0 0 16px;color:#333;font-size:14px;line-height:1.5;">
      Your order has been confirmed and paid. Here are the details:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Item</td>
        <td style="padding:8px 0;color:#333;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">${order.listingTitle} x${order.quantity}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Total</td>
        <td style="padding:8px 0;color:#333;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">${formatPrice(order.totalPrice)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Store</td>
        <td style="padding:8px 0;color:#333;font-size:13px;text-align:right;border-bottom:1px solid #eee;">${order.storeName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Address</td>
        <td style="padding:8px 0;color:#333;font-size:13px;text-align:right;border-bottom:1px solid #eee;">${order.storeAddress}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;">Pickup</td>
        <td style="padding:8px 0;color:#333;font-size:13px;text-align:right;">${order.pickupWindow}</td>
      </tr>
    </table>
    <div style="background:#2B3A2B;border-radius:6px;padding:16px;text-align:center;margin-bottom:16px;">
      <p style="margin:0 0 4px;color:#ccc;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Pickup Code</p>
      <p style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:4px;">${order.pickupCode}</p>
    </div>
    <p style="margin:0;color:#666;font-size:12px;line-height:1.5;">
      Show this code to the store when you pick up your order.
    </p>
  `)

  try {
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Order confirmed — ${order.listingTitle}`,
      html,
    })
    if (error) {
      console.error('[email] Failed to send order confirmation:', error)
      return { success: false, error }
    }
    return { success: true }
  } catch (err) {
    console.error('[email] Failed to send order confirmation:', err)
    return { success: false, error: err }
  }
}

export async function sendPickupReminder(
  to: string,
  order: {
    pickupCode: string
    listingTitle: string
    storeName: string
    storeAddress: string
    pickupWindow: string
  }
) {
  const client = getResendClient()
  if (!client) return { success: false, error: 'Email not configured' }

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#2B3A2B;font-size:18px;">Pickup Reminder</h2>
    <p style="margin:0 0 16px;color:#333;font-size:14px;line-height:1.5;">
      Don't forget to pick up your order!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Item</td>
        <td style="padding:8px 0;color:#333;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">${order.listingTitle}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Store</td>
        <td style="padding:8px 0;color:#333;font-size:13px;text-align:right;border-bottom:1px solid #eee;">${order.storeName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Address</td>
        <td style="padding:8px 0;color:#333;font-size:13px;text-align:right;border-bottom:1px solid #eee;">${order.storeAddress}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;">Pickup</td>
        <td style="padding:8px 0;color:#333;font-size:13px;text-align:right;">${order.pickupWindow}</td>
      </tr>
    </table>
    <div style="background:#2B3A2B;border-radius:6px;padding:16px;text-align:center;margin-bottom:16px;">
      <p style="margin:0 0 4px;color:#ccc;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Pickup Code</p>
      <p style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:4px;">${order.pickupCode}</p>
    </div>
    <p style="margin:0;color:#666;font-size:12px;line-height:1.5;">
      Show this code to the store when you pick up your order.
    </p>
  `)

  try {
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Pickup reminder — ${order.listingTitle} at ${order.storeName}`,
      html,
    })
    if (error) {
      console.error('[email] Failed to send pickup reminder:', error)
      return { success: false, error }
    }
    return { success: true }
  } catch (err) {
    console.error('[email] Failed to send pickup reminder:', err)
    return { success: false, error: err }
  }
}

export async function sendOrderCancelled(
  to: string,
  order: {
    listingTitle: string
    reason: string
  }
) {
  const client = getResendClient()
  if (!client) return { success: false, error: 'Email not configured' }

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#2B3A2B;font-size:18px;">Order Cancelled</h2>
    <p style="margin:0 0 16px;color:#333;font-size:14px;line-height:1.5;">
      Your order for <strong>${order.listingTitle}</strong> has been cancelled.
    </p>
    <div style="background:#f9f9f9;border-radius:6px;padding:12px 16px;margin-bottom:16px;">
      <p style="margin:0;color:#666;font-size:13px;"><strong>Reason:</strong> ${order.reason}</p>
    </div>
    <p style="margin:0;color:#666;font-size:12px;line-height:1.5;">
      If you paid online, your refund will be processed automatically. Browse FoodSaver for more deals!
    </p>
  `)

  try {
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Order cancelled — ${order.listingTitle}`,
      html,
    })
    if (error) {
      console.error('[email] Failed to send cancellation email:', error)
      return { success: false, error }
    }
    return { success: true }
  } catch (err) {
    console.error('[email] Failed to send cancellation email:', err)
    return { success: false, error: err }
  }
}

export async function sendNewOrderNotification(
  to: string,
  order: {
    listingTitle: string
    quantity: number
    totalPrice: number
    pickupCode: string
  }
) {
  const client = getResendClient()
  if (!client) return { success: false, error: 'Email not configured' }

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#2B3A2B;font-size:18px;">New Order Received!</h2>
    <p style="margin:0 0 16px;color:#333;font-size:14px;line-height:1.5;">
      You have a new paid order. Please prepare it for pickup.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Item</td>
        <td style="padding:8px 0;color:#333;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">${order.listingTitle} x${order.quantity}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:13px;border-bottom:1px solid #eee;">Total</td>
        <td style="padding:8px 0;color:#333;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">${formatPrice(order.totalPrice)}</td>
      </tr>
    </table>
    <div style="background:#2B3A2B;border-radius:6px;padding:16px;text-align:center;margin-bottom:16px;">
      <p style="margin:0 0 4px;color:#ccc;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Customer Pickup Code</p>
      <p style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:4px;">${order.pickupCode}</p>
    </div>
    <p style="margin:0;color:#666;font-size:12px;line-height:1.5;">
      The customer will show this code when they arrive. Verify it before handing over the order.
    </p>
  `)

  try {
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `New order — ${order.listingTitle} x${order.quantity}`,
      html,
    })
    if (error) {
      console.error('[email] Failed to send new order notification:', error)
      return { success: false, error }
    }
    return { success: true }
  } catch (err) {
    console.error('[email] Failed to send new order notification:', err)
    return { success: false, error: err }
  }
}
