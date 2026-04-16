'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { formatPhpShort, formatPrice, formatPickupWindow, reservationRef } from '@/lib/utils'
import { detectBrowserLang, t, type Lang } from '@/lib/i18n'
import { fetchPlatformConfig } from '@/lib/platformConfig'
import { track } from '@/lib/analytics'
import type { Order, PlatformConfig } from '@/lib/types'

/**
 * Reservation fee payment screen.
 *
 * The reservation is already in `pending_fee_payment` when the user lands
 * here (created by ListingsFeed). This page shows:
 *   - GCash account details + reference code
 *   - Screenshot upload (goes directly to Supabase Storage)
 *   - \u201CSubmit for verification\u201D button that moves status to
 *     `pending_verification`
 *
 * Once the buyer submits we render the "waiting for verification" state.
 * If admin rejects, the reservation bounces back to `pending_fee_payment`
 * with a `reservation_fee_rejected_reason` set — we surface that here so
 * the user can retry.
 */
export default function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [lang, setLang] = useState<Lang>('en')
  const [order, setOrder] = useState<Order | null>(null)
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { setLang(detectBrowserLang()) }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const [{ data: orderData }, cfg] = await Promise.all([
        supabase
          .from('orders')
          .select('*, listing:listings(*), store:stores(*)')
          .eq('id', id)
          .single(),
        fetchPlatformConfig(),
      ])
      if (cancelled) return
      setOrder((orderData as Order) ?? null)
      setConfig(cfg)
      setLoading(false)
      if (orderData?.status === 'pending_fee_payment') {
        track('fee_payment_shown', { order_id: id })
      }
    })()
    return () => { cancelled = true }
  }, [user, id])

  const ref = reservationRef(id)
  const feeAmount = order?.reservation_fee_php ?? config?.reservation_fee_php ?? 20
  const rejected = !!order?.reservation_fee_rejected_reason && order?.status === 'pending_fee_payment'

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async () => {
    if (!file || !order || !user) return
    setSubmitting(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${order.id}/proof-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('reservation-proofs')
        .upload(path, file, { upsert: true, cacheControl: '0' })
      if (uploadErr) {
        setError(uploadErr.message)
        setSubmitting(false)
        return
      }

      const { data: urlData } = await supabase.storage
        .from('reservation-proofs')
        .createSignedUrl(path, 60 * 60 * 24 * 7)
      const proofUrl = urlData?.signedUrl ?? path

      const res = await fetch(`/api/reservations/${order.id}/submit-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof_url: proofUrl }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error || 'Failed to submit proof')
        setSubmitting(false)
        return
      }

      track('fee_proof_uploaded', { order_id: order.id })

      // Refresh order state
      const { data: updated } = await supabase
        .from('orders')
        .select('*, listing:listings(*), store:stores(*)')
        .eq('id', order.id)
        .single()
      setOrder((updated as Order) ?? null)
      setFile(null)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="h-32 bg-white rounded-2xl animate-pulse mb-3" />
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  if (!order) {
    return (
      <div className="px-6 pt-10 text-center max-w-lg mx-auto">
        <p className="text-4xl mb-3">\u2753</p>
        <p className="font-semibold text-dark-green">Reservation not found</p>
        <Link href="/" className="text-sm text-olive underline mt-2 inline-block">Back to listings</Link>
      </div>
    )
  }

  if (order.status === 'confirmed' || order.status === 'picked_up' || order.status === 'no_show') {
    router.replace('/orders')
    return null
  }

  if (order.status === 'cancelled') {
    return (
      <div className="px-6 pt-10 text-center max-w-lg mx-auto">
        <p className="text-4xl mb-3">\u274C</p>
        <p className="font-semibold text-dark-green mb-1">{t('reserve.expired.title', lang)}</p>
        <p className="text-sm text-dark-green/60 mb-6">{t('reserve.expired.body', lang)}</p>
        <Link href="/"><Button>{t('common.back', lang)}</Button></Link>
      </div>
    )
  }

  if (order.status === 'pending_verification') {
    return (
      <div className="px-4 pt-6 pb-12 max-w-lg mx-auto">
        <LangSwitch lang={lang} setLang={setLang} />
        <div className="bg-gold/10 border border-gold/25 rounded-2xl p-5 mb-4 text-center">
          <span className="text-4xl block mb-2">\u23F3</span>
          <p className="font-display font-semibold text-dark-green text-lg">{t('reserve.verification.title', lang)}</p>
          <p className="text-sm text-dark-green/60 mt-1">{t('reserve.verification.body', lang)}</p>
        </div>

        {order.reservation_fee_proof_url && (
          <div className="bg-white rounded-2xl p-4 mb-4 border border-dark-green/10">
            <p className="text-xs text-dark-green/50 mb-2">Your submitted receipt</p>
            <a href={order.reservation_fee_proof_url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={order.reservation_fee_proof_url} alt="Receipt" className="w-full max-h-80 object-contain rounded-xl bg-cream" />
            </a>
          </div>
        )}

        <Link href="/orders">
          <Button variant="outline" className="w-full">View my orders</Button>
        </Link>
      </div>
    )
  }

  // pending_fee_payment (either first attempt or after a rejection)
  return (
    <div className="px-4 pt-6 pb-12 max-w-lg mx-auto">
      <LangSwitch lang={lang} setLang={setLang} />

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-dark-green/10">
        <p className="text-xs font-semibold text-dark-green/45 uppercase tracking-wider mb-1">You\u2019re reserving</p>
        <h1 className="font-display font-bold text-dark-green text-lg leading-tight">{order.listing?.title}</h1>
        <p className="text-xs text-dark-green/55 mt-0.5">{order.store?.name} \u00B7 {order.store?.address}</p>
        {order.listing && (
          <p className="text-xs text-dark-green/55 mt-1">
            Pickup: {formatPickupWindow(order.listing.pickup_start, order.listing.pickup_end)}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-dark-green/60">Pay store at pickup (cash)</span>
          <span className="font-semibold text-dark-green">{formatPrice(order.total_price)}</span>
        </div>
      </div>

      {/* Rejected banner */}
      {rejected && (
        <div className="bg-error/10 border border-error/25 rounded-2xl p-4 mb-4">
          <p className="font-semibold text-error text-sm">{t('reserve.rejected.title', lang)}</p>
          <p className="text-xs text-dark-green/70 mt-1">{order.reservation_fee_rejected_reason}</p>
          <p className="text-xs text-dark-green/50 mt-1">{t('reserve.rejected.body', lang)}</p>
        </div>
      )}

      {/* Fee amount */}
      <div className="bg-dark-green text-white rounded-2xl p-5 mb-4 text-center">
        <p className="text-xs opacity-70 uppercase tracking-wider">{t('reserve.amount.label', lang)}</p>
        <p className="font-display text-5xl font-bold my-1">{formatPhpShort(feeAmount)}</p>
        <p className="text-[11px] opacity-70 px-2 leading-relaxed">{t('reserve.amount.hint', lang)}</p>
      </div>

      {/* GCash details */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-dark-green/10">
        <h2 className="font-display font-semibold text-dark-green text-base mb-2">{t('reserve.gcash.howto', lang)}</h2>
        <ol className="text-sm text-dark-green/70 space-y-1 mb-4 list-decimal pl-5">
          <li>{t('reserve.gcash.step1', lang)}</li>
          <li>{t('reserve.gcash.step2', lang)}</li>
          <li>{t('reserve.gcash.step3', lang)}</li>
          <li>{t('reserve.gcash.step4', lang)}</li>
        </ol>

        <div className="bg-cream rounded-xl p-3 space-y-2">
          <Row label={t('reserve.account.name', lang)} value={config?.gcash_account_name ?? 'FoodSaver PH'} />
          <Row label={t('reserve.account.number', lang)} value={config?.gcash_account_number ?? '—'} copyable />
          <Row label={t('reserve.ref', lang)} value={ref} copyable />
          <Row label="Amount" value={formatPhpShort(feeAmount)} copyable />
        </div>

        {config?.gcash_qr_image_url && (
          <div className="mt-3 flex justify-center">
            <img src={config.gcash_qr_image_url} alt="GCash QR" className="w-48 h-48 object-contain rounded-xl border border-dark-green/10" />
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-dark-green/10">
        {preview ? (
          <div className="relative mb-3">
            <img src={preview} alt="Receipt preview" className="w-full max-h-80 object-contain rounded-xl bg-cream" />
            <button
              onClick={() => { setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full text-dark-green/70 hover:text-dark-green text-lg"
              aria-label="Remove image"
            >
              \u00D7
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-dark-green/20 rounded-xl cursor-pointer hover:border-gold/50 transition-colors bg-cream/50">
            <span className="text-3xl mb-1">\uD83D\uDCF7</span>
            <span className="text-sm font-medium text-dark-green/70">{t('reserve.upload.cta', lang)}</span>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        )}

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-xl p-3 text-center mb-3">{error}</div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!file || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? t('reserve.submitting', lang) : t('reserve.submit', lang)}
        </Button>
      </div>

      <p className="text-xs text-dark-green/40 text-center">
        Questions? <a href={config?.support_messenger_url ?? '#'} target="_blank" rel="noopener noreferrer" className="underline">Message support</a>
      </p>
    </div>
  )
}

function Row({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* ignore */ }
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-dark-green/55">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-dark-green text-right">{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-[10px] font-medium text-olive px-2 py-0.5 rounded-md bg-olive/10 hover:bg-olive/20"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="inline-flex rounded-full bg-white border border-dark-green/10 p-0.5 text-xs">
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full ${lang === 'en' ? 'bg-dark-green text-white' : 'text-dark-green/60'}`}
        >EN</button>
        <button
          onClick={() => setLang('tl')}
          className={`px-3 py-1 rounded-full ${lang === 'tl' ? 'bg-dark-green text-white' : 'text-dark-green/60'}`}
        >TL</button>
      </div>
    </div>
  )
}
