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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://foodsaverph.com'

/**
 * Root metadata.
 *
 * We set `metadataBase` so every relative `openGraph.images` / `twitter.images`
 * in child routes resolves to an absolute URL (required by social scrapers).
 * The homepage and other routes can override `title`, `description`, and
 * `alternates.canonical` per page; this layout sets the defaults.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'FoodSaver — Rescue surplus food in Cagayan de Oro. Save 50–70%.',
    template: '%s · FoodSaver',
  },
  description:
    'FoodSaver is a Cagayan de Oro app for rescuing surplus food from local bakeries, restaurants and groceries at 50–70% off. Reserve with a ₱20 GCash fee, pay the rest in cash at pickup.',
  applicationName: 'FoodSaver',
  keywords: [
    'FoodSaver',
    'food rescue Philippines',
    'surplus food Cagayan de Oro',
    'CDO food deals',
    'cheap food CDO',
    'save food waste Philippines',
    'surplus bakery Philippines',
    'Too Good To Go Philippines',
    'discounted food pickup CDO',
    'reduce food waste Mindanao',
  ],
  authors: [{ name: 'FoodSaver PH' }],
  creator: 'FoodSaver PH',
  publisher: 'FoodSaver PH',
  category: 'food',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-PH': '/',
      'tl-PH': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'FoodSaver',
    title: 'FoodSaver — Rescue surplus food in Cagayan de Oro',
    description:
      'Bakeries, restaurants and groceries in CDO drop unsold food on FoodSaver at 50–70% off at closing time. Reserve with ₱20 GCash, pay the rest cash at pickup.',
    locale: 'en_PH',
    alternateLocale: ['tl_PH'],
    url: SITE_URL,
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'FoodSaver logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodSaver — Rescue surplus food in Cagayan de Oro',
    description:
      'Reserve unsold food from local CDO bakeries and restaurants at 50–70% off. ₱20 GCash reservation, cash at pickup.',
    images: ['/icons/icon-512.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FoodSaver',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
    <html lang="en-PH" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-body bg-cream text-dark-green antialiased">
        <main className="min-h-screen lg:pt-16">
          {children}
        </main>
        <Navbar />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
