import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://foodsaverph.com'

/**
 * robots.txt generator.
 *
 * We block crawling of authenticated and transactional routes (no reason for
 * Google to index /admin or a buyer's private /reserve/[id] flow). Everything
 * else stays open.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/dashboard',
          '/dashboard/',
          '/orders',
          '/reserve/',
          '/profile',
          '/update-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
