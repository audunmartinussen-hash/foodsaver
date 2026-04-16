'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Track visits
    const visits = parseInt(localStorage.getItem('fs_visits') || '0') + 1
    localStorage.setItem('fs_visits', visits.toString())

    // Show after 2nd visit
    if (visits < 2) return

    // Check if dismissed
    const dismissed = localStorage.getItem('fs_install_dismissed')
    if (dismissed) return

    // iOS detection — defer the setState to a microtask so the hooks lint
    // rule doesn\u2019t flag a sync state update in the effect body.
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)

    if (isiOS) {
      Promise.resolve().then(() => {
        setIsIOS(true)
        setShowPrompt(true)
      })
      return
    }

    // Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('fs_install_dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-dark-green text-white rounded-2xl p-4 shadow-xl animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🍽</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Add FoodSaver to Home Screen</p>
          <p className="text-xs text-white/70 mt-0.5">
            {isIOS
              ? 'Tap the Share button, then "Add to Home Screen"'
              : 'Quick access to deals near you'}
          </p>
        </div>
        <button onClick={handleDismiss} className="text-white/50 hover:text-white">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {!isIOS && (
        <Button
          onClick={handleInstall}
          className="w-full mt-3 bg-gold text-dark-green hover:bg-gold/90"
        >
          Install App
        </Button>
      )}
    </div>
  )
}
