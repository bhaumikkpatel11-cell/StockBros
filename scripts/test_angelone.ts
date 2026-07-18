import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local for secrets
config({ path: resolve(process.cwd(), '.env.local') });

import { angelOneClient } from '../features/angelone/angelOneClient';

const SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];

async function main() {
  console.log('Testing Angel One Client...');

  try {
    console.log('Logging in...');
    await angelOneClient.login();
    console.log('Login successful.');

    console.log('Fetching Instruments Master (this may take a while)...');
    await angelOneClient.fetchInstrumentsMaster();
    console.log('Instruments Master fetched and equities saved to database.');

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(toDate.getFullYear() - 2); // 2 years of history

    for (const symbol of SYMBOLS) {
      console.log(`\nFetching 2 years of historical data for ${symbol}...`);
      const bars = await angelOneClient.getHistoricalDaily(symbol, fromDate, toDate);
      console.log(`Fetched ${bars.length} daily bars for ${symbol}.`);
      if (bars.length > 0) {
        console.log(`Earliest Date: ${bars[0].date}, Latest Date: ${bars[bars.length - 1].date}`);
      }
    }

    console.log('\nDemonstrating session persistence by fetching latest bar...');
    const latestBar = await angelOneClient.refreshLatestBar('RELIANCE');
    console.log('Latest Bar for RELIANCE:', latestBar);

    console.log('\nTesting completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

main();
