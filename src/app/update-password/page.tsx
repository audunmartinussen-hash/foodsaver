'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
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
          Set a new password
        </p>
      </div>

      {success ? (
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="bg-olive/10 border border-olive/20 rounded-2xl p-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-display font-semibold text-dark-green text-lg mb-2">
              Password updated
            </p>
            <p className="text-sm text-dark-green/60">
              Redirecting you to sign in...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          {error && (
            <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-2">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>

          <p className="text-center text-sm text-dark-green/50">
            <a href="/login" className="text-olive font-semibold hover:underline">
              Back to Sign In
            </a>
          </p>
        </form>
      )}
    </div>
  )
}
