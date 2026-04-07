'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'notif-prompt-dismissed'
const DISMISS_DAYS = 7

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const dismissedAt = parseInt(dismissed, 10)
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

export default function ServiceWorkerRegistration() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        // After successful SW registration, check notification permission
        if (
          'Notification' in window &&
          Notification.permission === 'default' &&
          !wasDismissedRecently()
        ) {
          const timer = setTimeout(() => setShowPrompt(true), 5000)
          return () => clearTimeout(timer)
        }
      }).catch(() => {
        // SW registration failed — ignore in dev
      })
    }
  }, [])

  const handleAllow = async () => {
    setShowPrompt(false)
    await Notification.requestPermission()
  }

  const handleLater = () => {
    setShowPrompt(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-in slide-in-from-bottom">
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-4 flex flex-col gap-3">
        <p className="text-sm text-dark-green font-medium">
          Enable notifications to get pickup reminders?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAllow}
            className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Allow
          </button>
          <button
            onClick={handleLater}
            className="flex-1 bg-emerald-50 text-emerald-700 text-sm font-semibold py-2 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
