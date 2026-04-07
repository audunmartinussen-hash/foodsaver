'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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
          Reset your password
        </p>
      </div>

      {sent ? (
        <div className="max-w-sm mx-auto w-full text-center space-y-6">
          <div className="bg-olive/10 border border-olive/20 rounded-2xl p-6">
            <p className="text-4xl mb-3">📧</p>
            <p className="font-display font-semibold text-dark-green text-lg mb-2">
              Check your email
            </p>
            <p className="text-sm text-dark-green/60 leading-relaxed">
              Check your email for a password reset link. It may take a minute to arrive.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-sm text-olive font-semibold hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          <p className="text-sm text-dark-green/60 text-center mb-2">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />

          {error && (
            <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-2">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <p className="text-center text-sm text-dark-green/50">
            <Link href="/login" className="text-olive font-semibold hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
