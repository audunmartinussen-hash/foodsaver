'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const tabs = [
  {
    label: 'Home',
    href: '/',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Hide navbar on login, dashboard, admin, auth pages
  const hiddenPrefixes = ['/login', '/dashboard', '/admin', '/reset-password', '/update-password', '/terms', '/privacy']
  if (hiddenPrefixes.some(p => pathname.startsWith(p))) {
    return null
  }

  // Hide on the public landing page (`/` when signed out) — avoid showing a
  // logged-in tab bar to visitors who don\u2019t have an account yet. While auth
  // resolves, keep it hidden to prevent a flash of navbar on the landing hero.
  if (!user || loading) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-dark-green/10 z-40 safe-bottom lg:top-0 lg:bottom-auto lg:border-b lg:border-t-0">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 lg:max-w-6xl lg:justify-start lg:gap-1">
        <span className="hidden lg:block font-display text-lg font-bold text-dark-green mr-8">FoodSaver</span>
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[60px]',
                'lg:flex-row lg:gap-2 lg:px-4 lg:py-2 lg:min-w-0',
                isActive ? 'text-dark-green' : 'text-dark-green/40'
              )}
            >
              <span className={cn('lg:w-5 lg:h-5 lg:[&>svg]:w-5 lg:[&>svg]:h-5', isActive && 'scale-110 transition-transform')}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium lg:text-sm">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
