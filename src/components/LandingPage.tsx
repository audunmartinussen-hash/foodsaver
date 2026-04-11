import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-dark-green text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-olive blur-3xl" />
        </div>
        <div className="relative px-6 pt-14 pb-16 text-center max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm">🇵🇭</span>
            <span className="text-xs font-medium text-white/80">Now in Cagayan de Oro</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-3">
            FoodSaver
          </h1>
          <p className="text-lg text-white/80 mb-2 font-medium">
            Save big on surplus food near you
          </p>
          <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto">
            Rescue delicious food from local restaurants, bakeries, and groceries at 50-70% off
          </p>
          <Link
            href="/login"
            className="inline-block bg-gold text-dark-green hover:bg-gold/90 font-bold text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-gold/20 transition-colors"
          >
            Get Started
          </Link>
          <p className="text-xs text-white/40 mt-4">Free to join. Pay only for what you save.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-12 max-w-md mx-auto">
        <h2 className="font-display text-2xl font-bold text-dark-green text-center mb-2">
          How It Works
        </h2>
        <p className="text-sm text-dark-green/50 text-center mb-8">
          Three simple steps to save food and money
        </p>
        <div className="space-y-4">
          {[
            {
              step: '1',
              emoji: '🔍',
              title: 'Browse Deals',
              desc: 'Discover surprise bags and discounted bundles from stores near you',
            },
            {
              step: '2',
              emoji: '🛒',
              title: 'Reserve',
              desc: 'Tap to reserve your pick. No payment needed until pickup.',
            },
            {
              step: '3',
              emoji: '🎉',
              title: 'Pick Up & Save',
              desc: 'Show your pickup code at the store and enjoy your food at up to 70% off',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-dark-green/5"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div>
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-0.5">
                  Step {item.step}
                </p>
                <h3 className="font-display font-bold text-dark-green text-base">
                  {item.title}
                </h3>
                <p className="text-sm text-dark-green/55 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-dark-green text-white px-6 py-12">
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-2">
            Why FoodSaver?
          </h2>
          <p className="text-sm text-white/50 text-center mb-8">
            Good for you, good for the planet
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                emoji: '💰',
                title: 'Save 50-70%',
                desc: 'Get premium food at a fraction of the price. Stretch your budget further.',
              },
              {
                emoji: '🌱',
                title: 'Reduce Food Waste',
                desc: 'Every bag you save means less food in the landfill. Make an impact daily.',
              },
              {
                emoji: '🏪',
                title: 'Support Local',
                desc: 'Help neighborhood bakeries, restaurants, and groceries recover value from surplus.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/8 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
              >
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <h3 className="font-display font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Business Owners */}
      <section className="px-6 py-12 max-w-md mx-auto">
        <div className="bg-olive/8 border border-olive/15 rounded-3xl p-6">
          <div className="text-center mb-6">
            <span className="text-3xl mb-3 block">🏢</span>
            <h2 className="font-display text-2xl font-bold text-dark-green mb-1">
              For Business Owners
            </h2>
            <p className="text-sm text-dark-green/50">
              Turn surplus into revenue
            </p>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { emoji: '♻️', text: 'Reduce waste and disposal costs' },
              { emoji: '💵', text: 'Earn extra revenue from surplus inventory' },
              { emoji: '👥', text: 'Attract new customers to your store' },
              { emoji: '📊', text: 'Simple dashboard to manage listings and orders' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-sm text-dark-green/70 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/login"
            className="block w-full text-center bg-dark-green/10 text-dark-green hover:bg-dark-green/15 font-bold py-3 rounded-xl transition-colors"
          >
            Sign Up as a Business
          </Link>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-white border-y border-dark-green/5 px-6 py-10">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: '50-70%', label: 'Savings' },
            { value: '0', label: 'Food Waste' },
            { value: '100%', label: 'Fresh' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl font-bold text-gold">{stat.value}</p>
              <p className="text-xs text-dark-green/50 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-12 text-center max-w-md mx-auto">
        <h2 className="font-display text-2xl font-bold text-dark-green mb-2">
          Ready to start saving?
        </h2>
        <p className="text-sm text-dark-green/50 mb-6">
          Join FoodSaver today and never let good food go to waste
        </p>
        <Link
          href="/login"
          className="inline-block bg-dark-green text-white hover:bg-dark-green/90 font-bold text-base px-10 py-3.5 rounded-2xl transition-colors"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-dark-green text-white/40 px-6 py-8">
        <div className="max-w-md mx-auto">
          <p className="font-display font-bold text-white/80 text-lg mb-3">FoodSaver</p>
          <p className="text-xs mb-6 leading-relaxed">
            Rescuing surplus food from local businesses, one bag at a time. Saving you money while reducing food waste in Cagayan de Oro.
          </p>
          <div className="flex gap-6 text-xs mb-6">
            <Link href="/login" className="text-white/50 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/terms" className="text-white/50 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] text-white/30">
              &copy; 2026 FoodSaver. Made with love in CDO.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
