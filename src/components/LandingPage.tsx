import Link from 'next/link'

/**
 * Public landing page. Rendered only for unauthenticated visitors by `/` —
 * authenticated users see the listings feed instead.
 *
 * Copy principles:
 * - No generic "3 simple steps" / "Ready to save?" filler.
 * - Concrete numbers and Philippine-specific framing (₱, GCash, CDO).
 * - Single primary CTA per section so the page has a clear action spine.
 * - Real objections addressed in the FAQ (pickup logistics, refunds, etc.),
 *   which also doubles as FAQPage structured data for Google.
 *
 * SEO:
 * - Metadata is set by `src/app/page.tsx` and `src/app/layout.tsx`.
 * - This file embeds JSON-LD for Organization, WebSite, and FAQPage so rich
 *   results (sitelinks, FAQ accordion in SERP) are eligible on day one.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://foodsaverph.com'

const faqs = [
  {
    q: 'How does FoodSaver work in Cagayan de Oro?',
    a: 'Local bakeries, restaurants, and groceries list unsold food on FoodSaver at 50–70% off toward the end of the day. You reserve a bag with a ₱20 GCash fee, pick it up during the store\u2019s pickup window, and pay the discounted price in cash directly to the store.',
  },
  {
    q: 'Why do I pay ₱20 in GCash before pickup?',
    a: 'The ₱20 reservation fee is how FoodSaver sustains the service. It also commits you to showing up — no-shows waste food and hurt the merchant. The fee is non-refundable unless the store cancels on you.',
  },
  {
    q: 'How do I pay the rest?',
    a: 'In cash at the store when you pick up. The merchant collects the full discounted price from you directly. FoodSaver doesn\u2019t touch that money.',
  },
  {
    q: 'What kind of food will I get?',
    a: 'Fixed-price, labelled items: pandesal, ulam combos, bakery bundles, pastries, packaged goods close to their sell-by date. Everything is still fresh and safe — stores only list food they would otherwise throw out at closing.',
  },
  {
    q: 'What happens if I can\u2019t make the pickup window?',
    a: 'Cancel from the app before the window starts and the merchant can resell to someone else. If you no-show, the ₱20 fee is forfeited. Three no-shows in 30 days pauses your account automatically.',
  },
  {
    q: 'Is FoodSaver available outside Cagayan de Oro?',
    a: 'Not yet. We\u2019re starting in CDO to prove the model, then expanding to Davao and Cebu. Follow us on Messenger to hear when we launch in your city.',
  },
]

export default function LandingPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'FoodSaver',
      alternateName: 'FoodSaver PH',
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description:
        'FoodSaver connects surplus food from Cagayan de Oro bakeries, restaurants and groceries with locals at 50\u201370% off.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Cagayan de Oro',
        addressRegion: 'Misamis Oriental',
        addressCountry: 'PH',
      },
      areaServed: {
        '@type': 'City',
        name: 'Cagayan de Oro',
      },
      sameAs: [
        'https://m.me/foodsaverph',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FoodSaver',
      url: SITE_URL,
      inLanguage: ['en-PH', 'tl-PH'],
      publisher: { '@type': 'Organization', name: 'FoodSaver' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'FoodSaver',
      url: SITE_URL,
      applicationCategory: 'FoodApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'PHP',
        description: 'Free to use. ₱20 GCash reservation fee per order.',
      },
      browserRequirements: 'Requires a modern browser with JavaScript enabled.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]

  return (
    <div className="min-h-screen bg-cream text-dark-green">
      {/* JSON-LD for rich results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top nav — minimal, just logo + sign in */}
      <header className="absolute top-0 inset-x-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 lg:px-10 pt-5">
          <span className="font-display text-xl font-bold text-white tracking-tight">FoodSaver</span>
          <Link
            href="/login"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-green text-white pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-24 w-80 h-80 rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-olive/25 blur-3xl" />
        </div>

        <div className="relative px-6 lg:px-10 max-w-5xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold/90 mb-5">
              <span className="w-6 h-px bg-gold/60" />
              Launching in Cagayan de Oro
            </p>

            <h1 className="font-display text-[2.5rem] sm:text-5xl lg:text-[3.75rem] leading-[1.02] font-bold tracking-tight mb-5">
              Good food,<br />
              <span className="text-gold">half the price,</span><br />
              zero waste.
            </h1>

            <p className="text-base lg:text-lg text-white/70 leading-relaxed max-w-lg mb-8">
              CDO bakeries and restaurants end the day with food they can&rsquo;t sell.
              FoodSaver lets you reserve that food at 50&ndash;70% off,
              pick it up on your way home, and pay the store in cash.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-gold text-dark-green hover:bg-gold/90 font-semibold text-base px-7 py-3.5 rounded-2xl shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 w-full sm:w-auto"
              >
                Browse today&rsquo;s deals
                <span className="ml-2">&rarr;</span>
              </Link>
              <a
                href="#how-it-works"
                className="text-sm text-white/60 hover:text-white px-2 py-2 transition-colors"
              >
                How does it work?
              </a>
            </div>

            <p className="text-xs text-white/40 leading-relaxed max-w-sm">
              Free account. ₱20 GCash reservation fee per order.
              The rest you pay in cash at the store.
            </p>
          </div>

          {/* Hero visual — a mock listing card */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-olive/10 rounded-[2rem] rotate-3" />
            <div className="relative bg-white text-dark-green rounded-[1.75rem] p-5 shadow-2xl -rotate-2 max-w-sm mx-auto">
              <div className="aspect-[4/3] bg-gradient-to-br from-cream to-olive/15 rounded-2xl mb-4 flex items-center justify-center">
                <span className="font-display text-5xl text-olive/60">🥖</span>
              </div>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-display font-bold text-base leading-tight">Pandesal + Ensaymada Bundle</p>
                  <p className="text-xs text-dark-green/50 mt-0.5">Panaderia ni Aling Rosa · 0.4 km</p>
                </div>
                <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">-65%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-bold text-gold">₱70</span>
                <span className="text-sm text-dark-green/40 line-through">₱200</span>
              </div>
              <div className="mt-3 pt-3 border-t border-dark-green/5 flex items-center justify-between text-[11px]">
                <span className="text-dark-green/60">Pickup 5:30&ndash;7:00 PM</span>
                <span className="text-olive font-semibold">3 left</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section aria-label="Trust" className="bg-white border-b border-dark-green/5">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Verified CDO stores', sub: 'Paper merchant agreement' },
            { label: '₱20 GCash reservation', sub: 'No card, no subscription' },
            { label: '50\u201370% off', sub: 'Surplus, not expired' },
            { label: 'Cash at pickup', sub: 'Merchant keeps 100%' },
          ].map((item) => (
            <div key={item.label} className="text-center md:text-left">
              <p className="text-sm font-semibold text-dark-green">{item.label}</p>
              <p className="text-xs text-dark-green/50 mt-1 leading-relaxed">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 lg:px-10 py-20 max-w-5xl mx-auto">
        <div className="max-w-xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-olive font-semibold mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-3">
            Reserve in 30 seconds,<br />pick up on your way home.
          </h2>
          <p className="text-base text-dark-green/60 leading-relaxed">
            FoodSaver is a marketplace, not a subscription. You only pay when a store has
            food to rescue. Here&rsquo;s what ordering actually looks like.
          </p>
        </div>

        <ol className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8 list-none">
          {[
            {
              num: '01',
              title: 'Open the app at 4\u20136 PM',
              body: 'That\u2019s when CDO stores post whatever\u2019s left from the day. Filter by bakery, restaurant, or grocery — or just scroll what\u2019s near you.',
            },
            {
              num: '02',
              title: 'Reserve with GCash ₱20',
              body: 'Send ₱20 to our GCash number, upload the receipt screenshot. Once we verify (usually minutes), your 4-digit pickup code goes live.',
            },
            {
              num: '03',
              title: 'Show up, pay cash, eat well',
              body: 'Walk in during the pickup window, show your code, pay the discounted price in cash to the merchant. That\u2019s it.',
            },
          ].map((step) => (
            <li key={step.num} className="relative">
              <div className="font-display text-5xl font-bold text-gold/25 leading-none mb-3">
                {step.num}
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-dark-green/60 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The math */}
      <section className="bg-dark-green text-white px-6 lg:px-10 py-20">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold/90 font-semibold mb-3">
              Here&rsquo;s the math
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-5">
              A ₱400 merienda becomes a<br />
              <span className="text-gold">₱140 one.</span>
            </h2>
            <p className="text-white/70 leading-relaxed text-base mb-6">
              Philippine households spend roughly 40% of their income on food. When a
              bakery still has ₱1,200 worth of unsold bread at 6 PM, you benefit and
              they recover something instead of throwing it out.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              FoodSaver takes <strong className="text-white">no cut</strong> from the merchant — you pay the store
              directly in cash. The only money that goes through us is the ₱20 reservation fee.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 space-y-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Original price</span>
              <span className="text-white/50 line-through">₱400.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">You pay the store</span>
              <span className="font-display text-2xl font-bold text-gold">₱120.00</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">GCash reservation</span>
              <span className="text-white/80">₱20.00</span>
            </div>
            <div className="border-t border-white/10 pt-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">You saved</span>
              <span className="font-display text-3xl font-bold text-gold">₱260</span>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed pt-1">
              Illustrative example. Real savings vary by store and item. Discounts
              are always 20%+ and typically 50\u201370%.
            </p>
          </div>
        </div>
      </section>

      {/* Why — three value props with more human framing */}
      <section className="px-6 lg:px-10 py-20 max-w-5xl mx-auto">
        <div className="max-w-xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-olive font-semibold mb-3">
            Why bother
          </p>
          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
            Good food shouldn&rsquo;t go<br />to waste in a country<br />that can&rsquo;t afford to.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: 'Stretch your budget.',
              body: 'Get the same pandesal, same ulam, same pastries — just late in the day, at half price. Your wallet will notice.',
            },
            {
              title: 'Keep food out of landfills.',
              body: 'The Philippines throws out around 2,000 tons of food a day. Every bag you rescue is food that didn\u2019t end up rotting and releasing methane.',
            },
            {
              title: 'Back your neighborhood.',
              body: 'Panaderias, carinderias, small groceries — the places that define CDO. Rescuing their surplus turns loss into a little extra income.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-6 border border-dark-green/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-display text-lg font-bold mb-2 leading-snug">{item.title}</h3>
              <p className="text-sm text-dark-green/60 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For merchants */}
      <section className="px-6 lg:px-10 py-20 bg-cream border-y border-dark-green/5">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-olive font-semibold mb-3">
              For store owners
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Recover a few thousand pesos a week from what you already throw out.
            </h2>
            <p className="text-dark-green/70 leading-relaxed mb-6">
              Most bakeries in CDO write off 8&ndash;15% of daily production. If you&rsquo;re
              one of them, FoodSaver turns that loss back into cash &mdash; without extra staff,
              a POS integration, or a card machine.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-dark-green text-white hover:bg-dark-green/90 font-semibold px-6 py-3 rounded-2xl transition-colors"
            >
              List your store
              <span>&rarr;</span>
            </Link>
            <p className="text-xs text-dark-green/40 mt-3">
              Free to list. We sign a simple paper agreement before listings go live.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              {
                title: 'You keep 100% of pickup cash',
                body: 'Buyers pay the store in cash at pickup. FoodSaver takes zero commission on your sales.',
              },
              {
                title: 'No card reader, no integration',
                body: 'List from your phone. Mark orders picked up with one tap. That\u2019s the workflow.',
              },
              {
                title: 'Reach new customers nearby',
                body: 'Appear in the feed for every buyer within walking distance of your store.',
              },
              {
                title: 'Turn waste into goodwill',
                body: 'Customers feel good knowing they rescued real food from a real neighbor.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold">
                  &#10003;
                </span>
                <div>
                  <p className="font-semibold text-dark-green">{item.title}</p>
                  <p className="text-sm text-dark-green/55 mt-0.5 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ — SEO-heavy section, also helps real users */}
      <section id="faq" className="px-6 lg:px-10 py-20 max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.2em] text-olive font-semibold mb-3 text-center">
          FAQ
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-center leading-tight mb-10">
          Questions people usually ask
        </h2>

        <div className="divide-y divide-dark-green/8 border-y border-dark-green/8">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-start justify-between gap-6 cursor-pointer list-none">
                <h3 className="font-display text-base font-semibold text-dark-green pr-2">
                  {faq.q}
                </h3>
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-green/5 flex items-center justify-center text-dark-green/60 group-open:bg-gold/20 group-open:text-gold transition-colors">
                  <span className="block group-open:hidden text-lg leading-none">+</span>
                  <span className="hidden group-open:block text-lg leading-none">&ndash;</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-dark-green/65 leading-relaxed pr-10">
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        <p className="text-center text-sm text-dark-green/50 mt-10">
          Still have questions?{' '}
          <a
            href="https://m.me/foodsaverph"
            target="_blank"
            rel="noopener noreferrer"
            className="text-olive font-semibold underline underline-offset-2"
          >
            Message us on Facebook
          </a>
          .
        </p>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-10 py-20 bg-dark-green text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-4">
            The food&rsquo;s already made.<br />Don&rsquo;t let it go to waste.
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Sign up free. First deal from your closest store is a few taps away.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-gold text-dark-green hover:bg-gold/90 font-semibold text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-gold/20 transition-all"
          >
            Create your free account
            <span className="ml-2">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-green text-white/40 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 grid md:grid-cols-[1.2fr_1fr_1fr] gap-8">
          <div>
            <p className="font-display font-bold text-white text-lg mb-2">FoodSaver</p>
            <p className="text-xs leading-relaxed max-w-xs">
              Rescuing unsold food from Cagayan de Oro bakeries, restaurants and
              groceries. Built in CDO.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-3">
              Product
            </p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-3">
              Legal
            </p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              <li>
                <a
                  href="https://m.me/foodsaverph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Contact support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-5 text-[11px] text-white/25">
            &copy; {new Date().getFullYear()} FoodSaver PH. Made in Cagayan de Oro.
          </div>
        </div>
      </footer>
    </div>
  )
}
