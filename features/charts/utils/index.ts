import { PriceBar } from '@/lib/types';

export function resampleDailyToWeekly(dailyBars: PriceBar[]): PriceBar[] {
  if (!dailyBars.length) return [];

  const weeklyBars: PriceBar[] = [];
  let currentWeekBars: PriceBar[] = [];
  
  // Sort by date to ensure chronological order
  const sortedBars = [...dailyBars].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Helper to get ISO week string
  const getWeek = (dateString: string) => {
    const d = new Date(dateString);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  };

  let currentWeek = getWeek(sortedBars[0].date);

  for (const bar of sortedBars) {
    const week = getWeek(bar.date);
    if (week !== currentWeek) {
      weeklyBars.push(aggregateBars(currentWeekBars));
      currentWeekBars = [bar];
      currentWeek = week;
    } else {
      currentWeekBars.push(bar);
    }
  }

  if (currentWeekBars.length > 0) {
    weeklyBars.push(aggregateBars(currentWeekBars));
  }

  return weeklyBars;
}

function aggregateBars(bars: PriceBar[]): PriceBar {
  return {
    date: bars[0].date, // Use first day's date of the week
    open: bars[0].open,
    high: Math.max(...bars.map(b => b.high)),
    low: Math.min(...bars.map(b => b.low)),
    close: bars[bars.length - 1].close,
    volume: bars.reduce((sum, b) => sum + b.volume, 0),
  };
}

export function calculateEma(bars: PriceBar[], period: number): { time: string, value: number }[] {
  if (bars.length < period) return [];
  
  const k = 2 / (period + 1);
  const emaData: { time: string, value: number }[] = [];
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += bars[i].close;
  }
  let prevEma = sum / period;
  
  // Lightweight charts uses 'time' which can be an ISO string for daily bars
  emaData.push({ time: bars[period - 1].date, value: prevEma });
  
  for (let i = period; i < bars.length; i++) {
    const currentEma = (bars[i].close - prevEma) * k + prevEma;
    emaData.push({ time: bars[i].date, value: currentEma });
    prevEma = currentEma;
  }
  
  return emaData;
}
