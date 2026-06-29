import { LegalPage, SECTION, H2, P } from '../LegalLayout'

export default function TermsPage() {
  return (
    <LegalPage tag="Legal" title="Terms of Service" updated="June 28, 2026">
      <div style={SECTION}>
        <p style={P}>
          Welcome to NexoTrading. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using the platform.
        </p>
      </div>

      <h2 style={H2}>1. Acceptance of Terms</h2>
      <p style={P}>By creating an account and using NexoTrading, you confirm that you are at least 18 years old, have the legal capacity to enter into contracts in your jurisdiction, and agree to these Terms in full.</p>

      <h2 style={H2}>2. Description of Service</h2>
      <p style={P}>NexoTrading provides a simulated trading platform for educational purposes. All balances, positions, and transactions on this platform are virtual and do not represent real financial assets unless explicitly stated. No real money is exchanged through the platform.</p>

      <h2 style={H2}>3. Account Registration</h2>
      <p style={P}>You agree to provide accurate, current, and complete information during registration and to maintain the accuracy of such information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

      <h2 style={H2}>4. Acceptable Use</h2>
      <p style={P}>You agree not to use NexoTrading for any unlawful purpose or in any way that could damage, disable, overburden, or impair the platform. You must not attempt to gain unauthorized access to any part of the service or its related systems.</p>

      <h2 style={H2}>5. Intellectual Property</h2>
      <p style={P}>All content, features, and functionality on the NexoTrading platform — including but not limited to text, graphics, logos, icons, and software — are owned by NexoTrading Global LLC and are protected by applicable intellectual property laws.</p>

      <h2 style={H2}>6. Disclaimer of Warranties</h2>
      <p style={P}>The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. NexoTrading does not guarantee that the service will be uninterrupted, error-free, or free of viruses or other harmful components.</p>

      <h2 style={H2}>7. Limitation of Liability</h2>
      <p style={P}>To the maximum extent permitted by law, NexoTrading Global LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>

      <h2 style={H2}>8. Termination</h2>
      <p style={P}>We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion, with or without notice.</p>

      <h2 style={H2}>9. Governing Law</h2>
      <p style={P}>These Terms are governed by and construed in accordance with the laws of the jurisdiction where NexoTrading Global LLC is registered, without regard to its conflict of law provisions.</p>

      <h2 style={H2}>10. Contact</h2>
      <p style={P}>For questions regarding these Terms, contact us at: <span style={{ color: '#F0B90B' }}>legal@nexotrading.io</span></p>
    </LegalPage>
  )
}
