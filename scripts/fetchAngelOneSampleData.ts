import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getHistoricalDaily } from '../features/angelone/angelOneClient';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('Fetching Angel One sample data...');
  
  // 5 sample symbols. e.g. Reliance, TCS, HDFC Bank, Infosys, SBI
  const sampleTickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN'];
  
  const { data: symbols, error } = await supabase
    .from('symbols')
    .select('angel_one_symbol_token, ticker')
    .in('ticker', sampleTickers);
    
  if (error || !symbols || symbols.length === 0) {
    console.error('Could not find sample symbols in DB. Did you run syncAngelOneSymbols.ts?');
    return;
  }
  
  const toDateObj = new Date();
  const toDate = toDateObj.toISOString().split('T')[0];
  const fromDateObj = new Date(toDateObj.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
  const fromDate = fromDateObj.toISOString().split('T')[0];
  
  for (const sym of symbols) {
    if (!sym.angel_one_symbol_token) {
      console.warn(`Skipping ${sym.ticker}, no angel_one_symbol_token found.`);
      continue;
    }

    console.log(`\nFetching 2 years of daily data for ${sym.ticker} (Token: ${sym.angel_one_symbol_token})`);
    try {
      const bars = await getHistoricalDaily(sym.angel_one_symbol_token, fromDate, toDate);
      console.log(`=> Retrieved ${bars.length} bars for ${sym.ticker}. First bar: ${bars[0]?.date}, Last bar: ${bars[bars.length - 1]?.date}`);
    } catch (e) {
      console.error(`Error fetching data for ${sym.ticker}:`, e);
    }
  }
  
  console.log('\nFinished fetching sample data.');
}

main().catch(console.error);
