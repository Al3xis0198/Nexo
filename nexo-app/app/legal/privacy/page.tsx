import { LegalPage, SECTION, H2, P } from '../LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalPage tag="Legal" title="Privacy Policy" updated="June 28, 2026">
      <div style={SECTION}>
        <p style={P}>
          At NexoTrading, your privacy is a priority. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
        </p>
      </div>

      <h2 style={H2}>1. Information We Collect</h2>
      <p style={P}>We collect information you provide directly when registering: email address, display name, and account preferences. We also automatically collect usage data including IP address, browser type, pages visited, and interaction timestamps.</p>

      <h2 style={H2}>2. How We Use Your Information</h2>
      <p style={P}>We use collected information to: operate and improve the platform, authenticate your identity, communicate important updates, analyze usage patterns to enhance user experience, and comply with legal obligations.</p>

      <h2 style={H2}>3. Data Storage and Security</h2>
      <p style={P}>Your data is stored securely on Supabase infrastructure with encryption at rest and in transit. We implement industry-standard security measures including row-level security (RLS) policies, multi-factor authentication options, and regular security audits.</p>

      <h2 style={H2}>4. Data Sharing</h2>
      <p style={P}>We do not sell your personal information to third parties. We may share data with trusted service providers necessary to operate the platform (such as cloud hosting and analytics), or when required by law.</p>

      <h2 style={H2} id="cookies">5. Cookies Policy</h2>
      <p style={P}>We use essential cookies to maintain your session and preferences. Analytics cookies help us understand how users interact with the platform. You may disable non-essential cookies through your browser settings, though this may affect functionality.</p>

      <h2 style={H2}>6. Your Rights</h2>
      <p style={P}>Depending on your jurisdiction, you may have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your account and associated data, and object to certain processing activities.</p>

      <h2 style={H2}>7. Data Retention</h2>
      <p style={P}>We retain your data for as long as your account is active or as needed to provide the service. Upon account deletion, personal data is removed within 30 days except where retention is required by law.</p>

      <h2 style={H2}>8. Changes to This Policy</h2>
      <p style={P}>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the platform.</p>

      <h2 style={H2}>9. Contact</h2>
      <p style={P}>For privacy-related inquiries: <span style={{ color: '#F0B90B' }}>privacy@nexotrading.io</span></p>
    </LegalPage>
  )
}
