import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-olive font-semibold hover:underline mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>

        <h1 className="font-display text-3xl font-bold text-dark-green mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-dark-green/50 mb-10">
          Last updated: April 6, 2026
        </p>

        <div className="space-y-8 text-dark-green/80 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the FoodSaver platform (&quot;Platform&quot;), operated by FoodSaver Ph, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Platform. We reserve the right to update these Terms at any time, and continued use of the Platform after such changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              2. Account Registration
            </h2>
            <p>
              To use certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account credentials secure. You are responsible for all activity that occurs under your account. You must be at least 18 years old to create an account. FoodSaver Ph reserves the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              3. Platform Overview
            </h2>
            <p>
              FoodSaver is a marketplace that connects consumers with local businesses (restaurants, bakeries, groceries, and other food establishments) that have surplus food available at discounted prices (typically 50-70% off). FoodSaver acts as an intermediary and does not itself prepare, package, or sell food products.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              4. Food Safety Disclaimer
            </h2>
            <p>
              FoodSaver Ph does not manufacture, prepare, or handle any food products listed on the Platform. All food items are prepared and sold by independent third-party businesses (&quot;Stores&quot;). While we encourage all Stores to comply with applicable food safety regulations set by the Food and Drug Administration (FDA) of the Philippines and local government units, FoodSaver Ph makes no warranties or representations regarding the quality, safety, or suitability of any food products. Consumers assume all risk associated with the purchase and consumption of food items obtained through the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              5. Payment Terms
            </h2>
            <p>
              All payments are processed through our third-party payment provider, PayMongo. By making a purchase, you agree to PayMongo&apos;s terms of service. FoodSaver Ph charges a platform fee of 20% on each transaction, which is included in the listed price. Prices displayed on the Platform are in Philippine Pesos (PHP). Payment must be completed at the time of reservation via GCash, Maya, or credit/debit card.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              6. Order Cancellation Policy
            </h2>
            <p>
              Orders may be cancelled by the consumer before the pickup window begins, subject to a full refund. Once the pickup window has started, cancellations are at the discretion of the Store. If a Store is unable to fulfill an order (e.g., due to stock-out), the consumer will receive a full refund. No-shows (failure to pick up within the designated window) will not be refunded. Repeated no-shows may result in account restrictions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              7. Store Responsibilities
            </h2>
            <p>
              Stores listed on the Platform are responsible for the accuracy of their listings, including descriptions, pricing, quantities, and pickup windows. Stores must comply with all applicable Philippine food safety laws and regulations, including proper food handling, storage, and labeling requirements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by Philippine law, FoodSaver Ph and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform. This includes, but is not limited to, damages for foodborne illness, allergic reactions, loss of data, or business interruption. Our total liability shall not exceed the amount you paid for the specific transaction giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              9. Dispute Resolution
            </h2>
            <p>
              Any disputes arising from or related to these Terms or the use of the Platform shall first be resolved through good-faith negotiation between the parties. If the dispute cannot be resolved informally within thirty (30) days, it shall be submitted to mediation in Cagayan de Oro City, Philippines. Any unresolved disputes shall be subject to the exclusive jurisdiction of the courts of Cagayan de Oro City, Misamis Oriental, Philippines.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              10. Intellectual Property
            </h2>
            <p>
              All content on the Platform, including but not limited to text, graphics, logos, and software, is the property of FoodSaver Ph and is protected by Philippine intellectual property laws. You may not reproduce, distribute, or create derivative works from any content on the Platform without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              11. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:support@foodsaverph.com" className="text-olive font-semibold hover:underline">
                support@foodsaverph.com
              </a>.
            </p>
          </section>
        </div>

        <div className="border-t border-dark-green/10 mt-12 pt-6">
          <p className="text-xs text-dark-green/40 text-center">
            &copy; 2026 FoodSaver Ph. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
