import Link from 'next/link'

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-dark-green/50 mb-10">
          Last updated: April 6, 2026
        </p>

        <div className="space-y-8 text-dark-green/80 text-sm leading-relaxed">
          <section>
            <p>
              FoodSaver Ph (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the privacy and personal data of our users in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations. This Privacy Policy explains how we collect, use, share, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              1. Information We Collect
            </h2>
            <p className="mb-3">We collect the following types of personal information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Full name, email address, and password when you register for an account.
              </li>
              <li>
                <strong>Profile Information:</strong> Account type (consumer or business), profile photo (optional), and contact details.
              </li>
              <li>
                <strong>Transaction Data:</strong> Order history, payment records, pickup codes, and reservation details.
              </li>
              <li>
                <strong>Location Data:</strong> General location information to show nearby food listings (only when you grant permission).
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address collected automatically when you use the Platform.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, and interaction patterns to improve our services.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              2. How We Use Your Information
            </h2>
            <p className="mb-3">We use your personal information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your account.</li>
              <li>To process orders, payments, and reservations.</li>
              <li>To connect consumers with nearby stores offering surplus food.</li>
              <li>To send order confirmations, pickup reminders, and service updates.</li>
              <li>To improve the Platform, fix bugs, and develop new features.</li>
              <li>To comply with legal obligations and prevent fraud.</li>
              <li>To respond to your inquiries and provide customer support.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              3. Data Sharing
            </h2>
            <p className="mb-3">We may share your personal information with the following parties:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Stores:</strong> When you place an order, the Store receives your name and pickup code to fulfill the order. Stores do not receive your email or payment details.
              </li>
              <li>
                <strong>PayMongo:</strong> Our payment processor receives the payment information necessary to process transactions. PayMongo is PCI-DSS compliant and handles payment data in accordance with their own privacy policy.
              </li>
              <li>
                <strong>Service Providers:</strong> We use third-party services (such as Supabase for data storage and Vercel for hosting) that may process your data on our behalf, subject to data processing agreements.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information when required by Philippine law, regulation, legal process, or governmental request.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              4. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. Transaction records are retained for a minimum of five (5) years as required by Philippine tax and commerce regulations. If you delete your account, we will remove your personal data within thirty (30) days, except for information we are legally required to retain.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              5. Your Rights Under the Data Privacy Act
            </h2>
            <p className="mb-3">As a data subject under RA 10173, you have the following rights:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Right to Be Informed:</strong> You have the right to know how your personal data is being collected, used, and processed.
              </li>
              <li>
                <strong>Right to Access:</strong> You may request a copy of your personal data in our possession.
              </li>
              <li>
                <strong>Right to Correction:</strong> You may request correction of inaccurate or incomplete personal data.
              </li>
              <li>
                <strong>Right to Erasure:</strong> You may request deletion of your personal data, subject to legal retention requirements.
              </li>
              <li>
                <strong>Right to Object:</strong> You may object to the processing of your personal data, including for direct marketing purposes.
              </li>
              <li>
                <strong>Right to Data Portability:</strong> You may request your data in a structured, commonly used, and machine-readable format.
              </li>
              <li>
                <strong>Right to File a Complaint:</strong> You may file a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              6. Data Security
            </h2>
            <p>
              We implement reasonable technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include encryption of data in transit and at rest, secure authentication mechanisms, and regular security reviews. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              7. Cookies and Tracking
            </h2>
            <p>
              The Platform uses essential cookies and local storage to maintain your session, remember your preferences, and ensure the Platform functions correctly. We do not use third-party advertising cookies or trackers. Analytics data is collected in aggregate form to improve our services and is not used to identify individual users.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p>
              The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a minor, we will take steps to delete the information promptly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and updating the &quot;Last updated&quot; date. Your continued use of the Platform after such changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-dark-green mb-3">
              10. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, wish to exercise your data privacy rights, or need to report a concern, please contact us:
            </p>
            <div className="mt-3 bg-white rounded-2xl border border-dark-green/10 p-5 space-y-1">
              <p className="font-semibold text-dark-green">FoodSaver Ph</p>
              <p>
                Email:{' '}
                <a href="mailto:support@foodsaverph.com" className="text-olive font-semibold hover:underline">
                  support@foodsaverph.com
                </a>
              </p>
              <p className="text-dark-green/50 text-xs mt-2">
                You may also file a complaint with the National Privacy Commission at{' '}
                <a href="https://privacy.gov.ph" className="text-olive hover:underline" target="_blank" rel="noopener noreferrer">
                  privacy.gov.ph
                </a>.
              </p>
            </div>
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
