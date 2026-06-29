import { LegalPage, SECTION, H2, P } from '../LegalLayout'

export default function RiskPage() {
  return (
    <LegalPage tag="Legal" title="Risk Disclaimer" updated="June 28, 2026">
      <div style={{ background: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
        <p style={{ color: '#F6465D', fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.7 }}>
          ⚠️ Important Notice: Trading involves substantial risk of loss. This platform is provided for educational and simulation purposes only. Past performance is not indicative of future results.
        </p>
      </div>

      <div style={SECTION}>
        <p style={P}>
          This Risk Disclaimer outlines the potential risks associated with trading activities and the use of the NexoTrading platform. Please read this document carefully.
        </p>
      </div>

      <h2 style={H2}>1. Simulation Environment</h2>
      <p style={P}>NexoTrading operates as a simulated trading environment. All balances and positions are virtual. No real financial assets are held, traded, or transferred through this platform unless otherwise explicitly stated in a separate agreement.</p>

      <h2 style={H2}>2. Market Volatility Risk</h2>
      <p style={P}>Financial markets — including cryptocurrencies, stocks, forex, and commodities — are highly volatile. Prices can fluctuate dramatically in short periods due to market events, regulatory announcements, geopolitical factors, and changes in investor sentiment.</p>

      <h2 style={H2}>3. Leverage Risk</h2>
      <p style={P}>Using leverage amplifies both potential profits and potential losses. A leveraged position that moves against you can result in losses that exceed your initial margin. Higher leverage ratios carry significantly higher risk of total loss of invested capital.</p>

      <h2 style={H2}>4. Liquidity Risk</h2>
      <p style={P}>Some assets may have limited liquidity, making it difficult to enter or exit positions at desired prices. This can result in slippage and unintended losses, especially in fast-moving markets.</p>

      <h2 style={H2}>5. Technology Risk</h2>
      <p style={P}>System outages, connectivity interruptions, software bugs, or cyberattacks may prevent you from accessing the platform or executing orders at critical times. We strive for 99.9% uptime but cannot guarantee uninterrupted access.</p>

      <h2 style={H2}>6. Regulatory Risk</h2>
      <p style={P}>Laws and regulations governing financial markets, cryptocurrencies, and online trading platforms may change and vary by jurisdiction. Users are responsible for complying with the laws applicable in their country of residence.</p>

      <h2 style={H2}>7. No Financial Advice</h2>
      <p style={P}>Nothing on the NexoTrading platform constitutes financial, investment, legal, or tax advice. All content is for informational and educational purposes only. You should consult a qualified financial advisor before making any real investment decisions.</p>

      <h2 style={H2}>8. User Responsibility</h2>
      <p style={P}>You are solely responsible for your trading decisions and for understanding the risks involved. NexoTrading, its affiliates, employees, and partners shall not be held liable for any trading losses, missed opportunities, or consequential damages resulting from the use of our platform.</p>

      <h2 style={H2}>9. Contact</h2>
      <p style={P}>For risk-related questions: <span style={{ color: '#F0B90B' }}>compliance@nexotrading.io</span></p>
    </LegalPage>
  )
}
