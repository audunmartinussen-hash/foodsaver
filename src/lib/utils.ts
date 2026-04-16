/**
 * Launch economics.
 *
 * After the April 2026 pivot, FoodSaver does NOT process merchant payments.
 * Buyers pay the merchant in cash at pickup. The only money FoodSaver handles
 * is a small non-refundable reservation fee charged to the buyer up front via
 * manual GCash. This fee is read from `platform_config.reservation_fee_php`
 * at runtime; the constant below is only a fallback for client-side rendering.
 */
export const PRICING = {
  MIN_DISCOUNT: 20, // merchants must discount at least 20%
  DEFAULT_RESERVATION_FEE_PHP: 20,
  PAYMENT_METHODS: ['cash'] as const,
}

export const LAUNCH_CITY = 'Cagayan de Oro'

export function formatPrice(amount: number): string {
  return `\u20B1${amount.toFixed(2)}`
}

/**
 * PHP without decimals — used for the reservation fee copy. "20 PHP" reads
 * better than "₱20.00" in SMS and short UI surfaces.
 */
export function formatPhpShort(amount: number): string {
  return `\u20B1${Math.round(amount)}`
}

export function calcDiscountPercent(original: number, discounted: number): number {
  if (!original || original <= 0) return 0
  return Math.round(((original - discounted) / original) * 100)
}

/**
 * Merchant cash-at-pickup total. Reservation fee is paid separately to FoodSaver
 * and is NOT part of the merchant owed amount.
 */
export function calcMerchantCashOwed(discountedPrice: number, quantity: number): number {
  return discountedPrice * quantity
}

export function generatePickupCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function formatPickupWindow(start: string, end: string): string {
  return `${formatTime(start)}\u00A0\u2013\u00A0${formatTime(end)}`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * A short human-readable reference code used as the GCash payment note so
 * founders can match an incoming payment to a reservation without opening
 * the app. Derives from the reservation UUID — first 8 chars, uppercase.
 */
export function reservationRef(reservationId: string): string {
  return `FS-${reservationId.slice(0, 8).toUpperCase()}`
}

/** Kept for backwards compatibility with older code. */
export function calcPlatformFee(): number {
  return 0
}
