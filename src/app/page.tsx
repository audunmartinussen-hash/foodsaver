import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/LandingPage'
import ListingsFeed from '@/components/ListingsFeed'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  return <ListingsFeed />
}
