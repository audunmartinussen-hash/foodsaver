'use client'

import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="h-20 bg-white rounded-2xl animate-pulse mb-4" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-5xl mb-4">👤</p>
        <h2 className="font-display text-xl font-semibold mb-2">Sign in</h2>
        <p className="text-sm text-dark-green/50 mb-4">
          Access your account and manage your profile
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-dark-green mb-5">Profile</h1>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-olive/10 flex items-center justify-center text-2xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">{profile.full_name}</h2>
            <p className="text-sm text-dark-green/50">{user.email}</p>
            <Badge variant={profile.role === 'business' ? 'olive' : 'default'} className="mt-1">
              {profile.role === 'business' ? 'Store Owner' : 'Buyer'}
            </Badge>
          </div>
        </div>
      </Card>

      {profile.role === 'business' && (
        <Card className="p-4 mb-4">
          <Link href="/dashboard" className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Store Dashboard</p>
              <p className="text-xs text-dark-green/50">Manage your listings and orders</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await signOut()
          router.push('/')
        }}
      >
        Sign Out
      </Button>
    </div>
  )
}
