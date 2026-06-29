// Generate deterministic but seemingly random data
export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
};

const initialMockData: MarketAsset[] = [
  // Stocks
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', price: 189.45, change24h: 1.2, volume24h: 54000000, marketCap: 2900000000000, type: 'stock' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla Inc.', price: 215.30, change24h: -2.4, volume24h: 120000000, marketCap: 680000000000, type: 'stock' },
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 890.10, change24h: 4.5, volume24h: 45000000, marketCap: 2200000000000, type: 'stock' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.50, change24h: 0.8, volume24h: 22000000, marketCap: 3100000000000, type: 'stock' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.90, change24h: -0.5, volume24h: 38000000, marketCap: 1800000000000, type: 'stock' },
  
  // Forex
  { id: 'EUR-USD', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0854, change24h: -0.15, volume24h: 2500000000, marketCap: 0, type: 'forex' },
  { id: 'GBP-USD', symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2640, change24h: 0.25, volume24h: 1800000000, marketCap: 0, type: 'forex' },
  { id: 'USD-JPY', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 151.20, change24h: 0.40, volume24h: 2100000000, marketCap: 0, type: 'forex' },
  { id: 'AUD-USD', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6520, change24h: -0.30, volume24h: 900000000, marketCap: 0, type: 'forex' },
  
  // Commodities
  { id: 'XAU-USD', symbol: 'XAU/USD', name: 'Gold (Oz)', price: 2345.60, change24h: 0.85, volume24h: 85000000, marketCap: 14000000000000, type: 'commodity' },
  { id: 'XAG-USD', symbol: 'XAG/USD', name: 'Silver (Oz)', price: 28.40, change24h: 1.15, volume24h: 34000000, marketCap: 1300000000000, type: 'commodity' },
  { id: 'WTI-USD', symbol: 'WTI/USD', name: 'Crude Oil (WTI)', price: 82.50, change24h: -1.20, volume24h: 120000000, marketCap: 0, type: 'commodity' },
];

export function getMockMarkets(): MarketAsset[] {
  return initialMockData;
}

// Function to simulate price ticks for mock data
export function simulateMarketTick(markets: MarketAsset[]): MarketAsset[] {
  return markets.map(market => {
    // Volatility based on asset type
    let maxChangePercent = 0.001; // 0.1% default
    if (market.type === 'crypto') maxChangePercent = 0.005; // 0.5%
    else if (market.type === 'stock') maxChangePercent = 0.002; // 0.2%
    else if (market.type === 'forex') maxChangePercent = 0.0005; // 0.05%
    
    // Random move between -maxChangePercent and +maxChangePercent
    const randomMove = (Math.random() * 2 - 1) * maxChangePercent;
    
    const newPrice = market.price * (1 + randomMove);
    const newChange24h = market.change24h + (randomMove * 100);
    
    return {
      ...market,
      price: newPrice,
      change24h: newChange24h
    };
  });
}
