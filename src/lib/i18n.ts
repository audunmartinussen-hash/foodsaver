/**
 * Minimal bilingual string table for launch (English + Tagalog).
 *
 * Structure is intentionally boring — a flat dictionary keyed by string ID.
 * Bisaya lands post-launch; add a new column to this dict and extend
 * `Lang`. Falls back to English if a translation is missing.
 */

export type Lang = 'en' | 'tl'

const strings = {
  // Landing
  'landing.badge': {
    en: 'Now in Cagayan de Oro',
    tl: 'Available na sa Cagayan de Oro',
  },
  'landing.tagline': {
    en: 'Save big on surplus food near you',
    tl: 'Malaking tipid sa sobrang pagkain malapit sa iyo',
  },
  'landing.hero.sub': {
    en: 'Rescue delicious food from local bakeries, restaurants, and groceries at 50–70% off',
    tl: 'Sagipin ang masasarap na pagkain mula sa mga tindahan sa paligid — 50–70% off',
  },
  'landing.cta.getStarted': {
    en: 'Get Started',
    tl: 'Magsimula',
  },
  'landing.cta.free': {
    en: 'Free to join. Pay only a small reservation fee.',
    tl: 'Libre mag-join. Maliit lang ang reservation fee.',
  },
  'landing.how.title': { en: 'How It Works', tl: 'Paano Ito Gumagana' },
  'landing.how.sub': { en: 'Three simple steps', tl: 'Tatlong simpleng hakbang' },
  'landing.how.step1.title': { en: 'Browse Deals', tl: 'Mag-browse ng Deals' },
  'landing.how.step1.desc': {
    en: 'See discounted food from stores near you',
    tl: 'Tingnan ang mga discounted pagkain sa palapit',
  },
  'landing.how.step2.title': { en: 'Reserve & Pay Fee', tl: 'Mag-reserve at Magbayad ng Fee' },
  'landing.how.step2.desc': {
    en: 'Pay a small reservation fee via GCash to hold your item',
    tl: 'Magbayad ng maliit na fee sa GCash para ma-hold ang item mo',
  },
  'landing.how.step3.title': { en: 'Pick Up & Pay the Store', tl: 'Kunin at Bayaran ang Tindahan' },
  'landing.how.step3.desc': {
    en: 'Show your pickup code, pay the store in cash, enjoy',
    tl: 'Ipakita ang pickup code, magbayad sa tindahan ng cash, kainin',
  },
  'landing.why.title': { en: 'Why FoodSaver?', tl: 'Bakit FoodSaver?' },
  'landing.why.save.title': { en: 'Save 50–70%', tl: 'Makatipid ng 50–70%' },
  'landing.why.save.desc': {
    en: 'Premium food at a fraction of the price',
    tl: 'Premium na pagkain sa mas mababang presyo',
  },
  'landing.why.waste.title': { en: 'Reduce Food Waste', tl: 'Bawasan ang Basura' },
  'landing.why.waste.desc': {
    en: 'Every bag saved means less food thrown away',
    tl: 'Bawat bag na na-save ay hindi napupunta sa basura',
  },
  'landing.why.local.title': { en: 'Support Local', tl: 'Suportahan ang Local' },
  'landing.why.local.desc': {
    en: 'Help CDO bakeries, restaurants, and groceries',
    tl: 'Tulungan ang mga tindahan sa CDO',
  },
  'landing.business.title': { en: 'For Business Owners', tl: 'Para sa mga May-ari ng Negosyo' },
  'landing.business.sub': { en: 'Turn surplus into revenue', tl: 'Gawing kita ang sobra' },
  'landing.business.cta': { en: 'Sign Up as a Business', tl: 'Mag-sign Up Bilang Negosyo' },
  'landing.cta.final': { en: 'Ready to start saving?', tl: 'Ready ka na bang makatipid?' },
  'landing.cta.final.sub': {
    en: 'Join FoodSaver today — never let good food go to waste',
    tl: 'Sumali na sa FoodSaver — huwag hayaang mapunta sa basura ang masarap na pagkain',
  },

  // Reservation flow
  'reserve.title': { en: 'Pay Reservation Fee', tl: 'Magbayad ng Reservation Fee' },
  'reserve.amount.label': { en: 'Amount to pay', tl: 'Bayaran' },
  'reserve.amount.hint': {
    en: 'Non-refundable. Covers the reservation only. You pay the store separately in cash at pickup.',
    tl: 'Non-refundable. Para sa reservation lang. Bayaran mo ang tindahan ng cash sa pickup.',
  },
  'reserve.gcash.howto': { en: 'How to pay', tl: 'Paano magbayad' },
  'reserve.gcash.step1': { en: 'Open your GCash app', tl: 'Buksan ang GCash app mo' },
  'reserve.gcash.step2': { en: 'Send money to the number or scan the QR below', tl: 'Mag-send ng pera sa numero o i-scan ang QR sa ibaba' },
  'reserve.gcash.step3': {
    en: 'Include the reference code in the notes',
    tl: 'Isulat ang reference code sa notes',
  },
  'reserve.gcash.step4': {
    en: 'Upload a screenshot of the receipt below',
    tl: 'I-upload ang screenshot ng resibo sa ibaba',
  },
  'reserve.account.name': { en: 'Account name', tl: 'Pangalan' },
  'reserve.account.number': { en: 'GCash number', tl: 'GCash number' },
  'reserve.ref': { en: 'Reference code', tl: 'Reference code' },
  'reserve.upload.cta': { en: 'Upload GCash receipt', tl: 'I-upload ang GCash resibo' },
  'reserve.upload.change': { en: 'Change photo', tl: 'Palitan ang larawan' },
  'reserve.submit': { en: 'Submit for verification', tl: 'I-submit para sa verification' },
  'reserve.submitting': { en: 'Submitting…', tl: 'Sini-submit…' },
  'reserve.verification.title': { en: 'Waiting for verification', tl: 'Hinihintay ang verification' },
  'reserve.verification.body': {
    en: 'We usually confirm within 1 hour. You\u2019ll get an SMS and email when your reservation is confirmed.',
    tl: 'Kadalasan within 1 hour kami nag-co-confirm. Makakatanggap ka ng SMS at email kapag confirmed na.',
  },
  'reserve.rejected.title': { en: 'Payment not verified', tl: 'Hindi na-verify ang bayad' },
  'reserve.rejected.body': {
    en: 'The screenshot didn\u2019t match a payment we received. Please try uploading again with a clearer screenshot.',
    tl: 'Hindi tumugma ang screenshot sa bayad na natanggap namin. Pakisubukan uli na mas malinaw.',
  },
  'reserve.expired.title': { en: 'Reservation expired', tl: 'Nag-expire ang reservation' },
  'reserve.expired.body': {
    en: 'You took too long to pay. Please reserve again if you still want this item.',
    tl: 'Tumagal ng masyado ang pagbayad. Mag-reserve uli kung gusto mo pa rin.',
  },

  // Order statuses (buyer-facing)
  'status.pending_fee_payment': { en: 'Pay fee to confirm', tl: 'Bayaran ang fee para maging confirmed' },
  'status.pending_verification': { en: 'Awaiting verification', tl: 'Hinihintay ang verification' },
  'status.confirmed': { en: 'Confirmed', tl: 'Confirmed' },
  'status.picked_up': { en: 'Picked up', tl: 'Nakuha na' },
  'status.cancelled': { en: 'Cancelled', tl: 'Cancelled' },
  'status.no_show': { en: 'No-show', tl: 'No-show' },

  // Generic
  'common.cancel': { en: 'Cancel', tl: 'Kanselahin' },
  'common.keepOrder': { en: 'Keep order', tl: 'Huwag ikansela' },
  'common.back': { en: 'Back', tl: 'Bumalik' },

  // Abuse
  'paused.title': { en: 'Account paused', tl: 'Naka-pause ang account' },
  'paused.body': {
    en: 'Your account is paused because of repeated no-shows. Message support to reactivate.',
    tl: 'Naka-pause ang account mo dahil sa paulit-ulit na no-show. Mag-message sa support para ma-reactivate.',
  },
  'paused.contact': { en: 'Contact support', tl: 'Mag-contact sa support' },
} as const

type StringKey = keyof typeof strings

export function t(key: StringKey, lang: Lang = 'en'): string {
  const entry = strings[key]
  if (!entry) return key
  return entry[lang] ?? entry.en
}

export function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const prefs = (navigator.languages ?? [navigator.language]).map(l => l.toLowerCase())
  if (prefs.some(l => l.startsWith('tl') || l.startsWith('fil'))) return 'tl'
  return 'en'
}
