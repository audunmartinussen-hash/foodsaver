'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

const navItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Listings', href: '/dashboard/listings' },
  { label: 'Orders', href: '/dashboard/orders' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'business')) {
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

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <header className="bg-dark-green text-white px-4 pt-4 pb-0">
        <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-lg font-bold">Store Dashboard</h1>
          <Link href="/profile" className="text-white/70 hover:text-white text-sm">
            Profile
          </Link>
        </div>
        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-t-xl text-sm font-medium transition-colors',
                  isActive ? 'bg-cream text-dark-green' : 'text-white/60 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        </div>
      </header>

      <div className="px-4 py-5 max-w-6xl mx-auto lg:px-8">
        {children}
      </div>
    </div>
  )
}
