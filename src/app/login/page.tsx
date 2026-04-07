'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'consumer' | 'business'>('consumer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })
      if (error) {
        setError(error.message)
      } else {
        router.push(role === 'business' ? '/dashboard' : '/')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        // Check role and redirect
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          router.push(profile?.role === 'business' ? '/dashboard' : '/')
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-dark-green mb-2">
          FoodSaver
        </h1>
        <p className="text-dark-green/60">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
        {isSignUp && (
          <>
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan dela Cruz"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark-green">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('consumer')}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    role === 'consumer'
                      ? 'border-dark-green bg-dark-green text-white'
                      : 'border-dark-green/15 text-dark-green/60'
                  }`}
                >
                  🛍 Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('business')}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    role === 'business'
                      ? 'border-dark-green bg-dark-green text-white'
                      : 'border-dark-green/15 text-dark-green/60'
                  }`}
                >
                  🏪 Store Owner
                </button>
              </div>
            </div>
          </>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />

        {!isSignUp && (
          <div className="text-right -mt-2">
            <Link href="/reset-password" className="text-sm text-olive font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        {error && (
          <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-2">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-dark-green/50">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="text-olive font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <p className="text-center text-xs text-dark-green/40 mt-2">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-olive hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-olive hover:underline">Privacy Policy</Link>
        </p>
      </form>
    </div>
  )
}
