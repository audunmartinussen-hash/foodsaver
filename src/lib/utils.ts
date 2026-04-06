export function formatPrice(amount: number): string {
  return `₱${amount.toFixed(2)}`
}

export function calcDiscountPercent(original: number, discounted: number): number {
  return Math.round(((original - discounted) / original) * 100)
}

export function generatePickupCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function formatPickupWindow(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
