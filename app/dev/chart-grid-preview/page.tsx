import { ChartGrid } from '@/features/charts/components/ChartGrid';
import { PriceBar } from '@/lib/types';

// generate mock daily bars
function generateMockBars(startPrice: number, volatility: number, days = 150): PriceBar[] {
  const bars: PriceBar[] = [];
  let currentPrice = startPrice;
  let time = new Date(Date.UTC(2023, 0, 1)).getTime();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(time);
    // Skip weekends
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) {
      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (volatility / 2);
      const low = Math.min(open, close) - Math.random() * (volatility / 2);
      const volume = Math.floor(Math.random() * 10000) + 1000;
      
      bars.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });
      currentPrice = close;
    }
    time += 86400000; // Add 1 day
  }
  
  return bars;
}

const mockCharts = [
  { symbol: 'AAPL', bars: generateMockBars(150, 5) },
  { symbol: 'MSFT', bars: generateMockBars(300, 10) },
  { symbol: 'GOOGL', bars: generateMockBars(120, 4) },
  { symbol: 'AMZN', bars: generateMockBars(130, 6) },
  { symbol: 'META', bars: generateMockBars(250, 8) },
  { symbol: 'TSLA', bars: generateMockBars(200, 12) },
  { symbol: 'NVDA', bars: generateMockBars(400, 15) },
  { symbol: 'NFLX', bars: generateMockBars(350, 10) },
];

export default function ChartGridPreviewPage() {
  return (
    <main className="min-h-screen bg-black">
      <ChartGrid charts={mockCharts} />
    </main>
  );
}
