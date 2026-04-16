'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { identify as phIdentify, reset as phReset } from '@/lib/analytics'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
        // PostHog identify. No-op if NEXT_PUBLIC_POSTHOG_KEY isn\u2019t set;
        // uses the Supabase user id so events join to the right person.
        phIdentify(user.id, {
          role: data?.role ?? null,
          full_name: data?.full_name ?? null,
        })
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
          if (event === 'SIGNED_IN') {
            phIdentify(session.user.id, {
              role: data?.role ?? null,
              full_name: data?.full_name ?? null,
            })
          }
        } else {
          setProfile(null)
          if (event === 'SIGNED_OUT') phReset()
        }
      }
    )

    return () => subscription.unsubscribe()
  // supabase is a stable client ref; including it would re-subscribe on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    phReset()
  }

  return { user, profile, loading, signOut, supabase }
}
