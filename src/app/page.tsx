import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/LandingPage'
import ListingsFeed from '@/components/ListingsFeed'

/**
 * Page-level metadata override for `/`.
 *
 * The root layout already sets defaults, but we explicitly re-state the
 * landing-page description + canonical here so that when Next.js resolves
 * metadata for this route the most specific values win. This also keeps the
 * landing-page SEO copy colocated with the landing-page component.
 */
export const metadata: Metadata = {
  title: 'FoodSaver — Rescue surplus food in Cagayan de Oro. Save 50–70%.',
  description:
    'Reserve unsold food from Cagayan de Oro bakeries, restaurants and groceries at 50–70% off. ₱20 GCash reservation fee, cash at pickup. No subscription, no surprise bags — just fixed-price deals from verified local stores.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'FoodSaver — Rescue surplus food in Cagayan de Oro',
    description:
      'Bakeries, restaurants and groceries in CDO drop unsold food at 50–70% off at closing time. Reserve with ₱20 GCash, pay the rest cash at pickup.',
    url: '/',
    type: 'website',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  // Use getSession (reads cookie, no network call) instead of getUser
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <LandingPage />
  }

  return <ListingsFeed />
}
