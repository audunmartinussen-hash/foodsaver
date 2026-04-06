'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push('/')
    }
  }, [profile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-dark-green/20 border-t-dark-green rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') return null

  return (
    <div className="min-h-screen">
      <header className="bg-dark-green text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">Admin Panel</h1>
          <Link href="/profile" className="text-white/70 hover:text-white text-sm">
            Back to App
          </Link>
        </div>
      </header>
      <div className="px-4 py-5">
        {children}
      </div>
    </div>
  )
}
