import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FoodSaver — Save on Surplus Food',
  description: 'Save money on surplus food from local stores. Get surprise bags and discounted bundles at 50-70% off.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FoodSaver',
  },
}

export const viewport: Viewport = {
  themeColor: '#2B3A2B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="font-body bg-cream text-dark-green antialiased">
        <main className="min-h-screen">
          {children}
        </main>
        <Navbar />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
