import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { getHistoricalDaily } from '../features/dhan';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('Fetching sample data...');
  
  // 5 sample symbols. e.g. Reliance, TCS, HDFC Bank, Infosys, SBI
  // Let's get their security IDs from DB
  const sampleTickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN'];
  
  const { data: symbols, error } = await supabase
    .from('symbols')
    .select('dhan_security_id, ticker')
    .in('ticker', sampleTickers);
    
  if (error || !symbols || symbols.length === 0) {
    console.error('Could not find sample symbols in DB. Did you run syncDhanSymbols.ts?');
    return;
  }
  
  const toDate = new Date().toISOString().split('T')[0];
  const fromDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2 years ago
  
  for (const sym of symbols) {
    console.log(`\nFetching 2 years of daily data for ${sym.ticker} (ID: ${sym.dhan_security_id})`);
    try {
      const bars = await getHistoricalDaily(sym.dhan_security_id, fromDate, toDate);
      console.log(`=> Retrieved ${bars.length} bars for ${sym.ticker}. First bar: ${bars[0]?.date}, Last bar: ${bars[bars.length - 1]?.date}`);
    } catch (e) {
      console.error(`Error fetching data for ${sym.ticker}:`, e);
    }
  }
  
  console.log('\nFinished fetching sample data.');
}

main().catch(console.error);
