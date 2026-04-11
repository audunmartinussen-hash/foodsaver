import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/LandingPage'
import ListingsFeed from '@/components/ListingsFeed'

export default async function HomePage() {
  const supabase = await createClient()
  // Use getSession (reads cookie, no network call) instead of getUser
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <LandingPage />
  }

  return <ListingsFeed />
}
