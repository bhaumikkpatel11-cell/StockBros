import 'server-only';
// Explicit warning: This file must never be imported into a client component!
// It contains server-side secrets and logic for the Angel One SmartAPI integration.

import { TOTP } from 'totp-generator';
import { createClient } from '@supabase/supabase-js';
import { 
  AngelOneAuthResponse, 
  AngelOneHistoricalResponse, 
  AngelOneAuthError, 
  AngelOneRateLimitError, 
  AngelOneError 
} from './types';
import { PriceBar } from '../../lib/types';

// Supabase client initialization (Server-side admin access)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// Angel One Config
const ANGELONE_API_KEY = process.env.ANGELONE_API_KEY || '';
const ANGELONE_CLIENT_CODE = process.env.ANGELONE_CLIENT_CODE || '';
const ANGELONE_PASSWORD = process.env.ANGELONE_PASSWORD || process.env.ANGELONE_MPIN || '';
const ANGELONE_TOTP_SECRET = process.env.ANGELONE_TOTP_SECRET || '';

const API_BASE_URL = 'https://apiconnect.angelbroking.com';

// In-memory session cache
let sessionJwtToken: string | null = null;
let sessionRefreshToken: string | null = null;

// Rate limiting state
const REQUESTS_PER_SECOND = 3;
const throttleQueue: Array<() => void> = [];
let activeRequests = 0;

// Rate Limiter logic
setInterval(() => {
  activeRequests = 0;
  while (throttleQueue.length > 0 && activeRequests < REQUESTS_PER_SECOND) {
    const resolve = throttleQueue.shift();
    if (resolve) {
      activeRequests++;
      resolve();
    }
  }
}, 1000);

async function waitRateLimit(): Promise<void> {
  if (activeRequests < REQUESTS_PER_SECOND) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    throttleQueue.push(resolve as () => void);
  });
}

/**
 * Authenticates with Angel One using TOTP and caches tokens in memory.
 */
export async function authenticateAngelOne(): Promise<void> {
  if (!ANGELONE_API_KEY || !ANGELONE_CLIENT_CODE || !ANGELONE_PASSWORD || !ANGELONE_TOTP_SECRET) {
    throw new AngelOneAuthError('Missing Angel One credentials in environment variables');
  }

  const { otp: totpCode } = await TOTP.generate(ANGELONE_TOTP_SECRET);

  const response = await fetch(`${API_BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '192.168.1.1',
      'X-ClientPublicIP': '106.193.147.98',
      'X-MACAddress': '00-B0-D0-63-C2-26',
      'X-PrivateKey': ANGELONE_API_KEY
    },
    body: JSON.stringify({
      clientcode: ANGELONE_CLIENT_CODE,
      password: ANGELONE_PASSWORD,
      totp: totpCode
    })
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new AngelOneAuthError(data.message || 'Login failed', data.errorcode);
  }

  const authData = data as AngelOneAuthResponse;
  sessionJwtToken = authData.data.jwtToken;
  sessionRefreshToken = authData.data.refreshToken;
}

/**
 * Performs a request to the Angel One API with automatic re-authentication and rate limiting.
 */
async function fetchAngelOne<T>(endpoint: string, method: string, body?: any): Promise<T> {
  if (!sessionJwtToken) {
    await authenticateAngelOne();
  }

  const makeRequest = async () => {
    await waitRateLimit();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '192.168.1.1',
      'X-ClientPublicIP': '106.193.147.98',
      'X-MACAddress': '00-B0-D0-63-C2-26',
      'X-PrivateKey': ANGELONE_API_KEY,
      'Authorization': `Bearer ${sessionJwtToken}`
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    if (response.status === 429 || data.errorcode === 'AG8003' || data.message?.includes('Rate limit')) {
      throw new AngelOneRateLimitError('Rate limit exceeded');
    }

    if (response.status === 401 || response.status === 403 || data.errorcode === 'AB1050' || data.errorcode === 'AG8001' || data.message === 'Invalid Token') {
      throw new AngelOneAuthError('Session expired', data.errorcode);
    }

    if (!response.ok || !data.status) {
      throw new AngelOneError(data.message || 'API request failed', data.errorcode);
    }

    return data as T;
  };

  try {
    return await makeRequest();
  } catch (error) {
    if (error instanceof AngelOneRateLimitError) {
      // Basic exponential backoff for transient failures could go here
      // But we have queue throttling. We wait 1 second and retry once
      await new Promise(r => setTimeout(r, 1000));
      return await makeRequest();
    }
    
    if (error instanceof AngelOneAuthError) {
      // Re-authenticate and retry once
      await authenticateAngelOne();
      return await makeRequest();
    }
    
    throw error;
  }
}

/**
 * Fetches historical daily data with cache check.
 */
export async function getHistoricalDaily(
  symbolToken: string,
  fromDate: string, // YYYY-MM-DD
  toDate: string    // YYYY-MM-DD
): Promise<PriceBar[]> {
  if (!supabase) {
    throw new Error("Supabase client not initialized. Check credentials.");
  }
  
  // 1. Resolve ticker from symbolToken
  const { data: symInfo, error: symError } = await supabase
    .from('symbols')
    .select('ticker, exchange_segment')
    .eq('angel_one_symbol_token', symbolToken)
    .single();

  if (symError || !symInfo) {
    throw new Error(`Symbol not found for token: ${symbolToken}`);
  }

  const ticker = symInfo.ticker;
  const exch_seg = symInfo.exchange_segment || 'NSE';

  // 2. Check Supabase cache for existing dates
  const { data: cachedData, error: cacheError } = await supabase
    .from('price_cache')
    .select('date, open, high, low, close, volume')
    .eq('symbol', ticker)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });

  if (cacheError) {
    console.error('Cache query error:', cacheError);
  }

  const cachedDates = new Set(cachedData?.map(d => d.date) || []);

  // Format dates for Angel One API (YYYY-MM-DD HH:MM)
  const formattedFromDate = `${fromDate} 00:00`;
  const formattedToDate = `${toDate} 23:59`;

  // We should theoretically find the "missing gaps" but for simplicity and since
  // Angel One returns bulk data efficiently (up to 2000 days), we'll fetch the whole range 
  // if there are missing days, then upsert everything.
  // A robust gap-finding logic could split requests, but since one call gives 2000 days,
  // we can just make one call if cache doesn't fully cover the range.
  
  const fromDateObj = new Date(fromDate);
  const toDateObj = new Date(toDate);
  let expectedDays = 0;
  for (let d = new Date(fromDateObj); d <= toDateObj; d.setDate(d.getDate() + 1)) {
    // skip weekends for rough estimate, though market holidays make exact count tricky
    const day = d.getDay();
    if (day !== 0 && day !== 6) expectedDays++;
  }
  
  // If we have mostly all days cached, just return cached.
  // Actually, let's just fetch if we have 0 data, or if we want to be safe, fetch and upsert missing.
  // The requirement says: "fetch only the missing gap from Angel One"
  // Let's implement finding the first missing day to fetch from there to toDate.
  
  let fetchStartDate = fromDate;
  if (cachedData && cachedData.length > 0) {
     // find the latest consecutive date we have
     const lastCachedDate = cachedData[cachedData.length - 1].date;
     if (lastCachedDate >= toDate) {
       // We have data up to toDate (assuming no gaps in middle)
       return cachedData.map(d => ({
         date: d.date,
         open: Number(d.open),
         high: Number(d.high),
         low: Number(d.low),
         close: Number(d.close),
         volume: Number(d.volume)
       }));
     }
     
     // Otherwise we fetch from the day after the last cached date
     const nextDay = new Date(lastCachedDate);
     nextDay.setDate(nextDay.getDate() + 1);
     fetchStartDate = nextDay.toISOString().split('T')[0];
  }

  // 3. Fetch from Angel One
  const reqBody = {
    exchange: exch_seg,
    symboltoken: symbolToken,
    interval: 'ONE_DAY',
    fromdate: `${fetchStartDate} 00:00`,
    todate: formattedToDate
  };

  const response = await fetchAngelOne<AngelOneHistoricalResponse>(
    '/rest/secure/angelbroking/historical/v1/getCandleData',
    'POST',
    reqBody
  );

  const newBars: PriceBar[] = [];
  const rowsToInsert = [];

  if (response.data && response.data.length > 0) {
    for (const candle of response.data) {
      // timestamp is something like "2021-02-08T00:00:00+05:30"
      const dateStr = candle[0].substring(0, 10);
      
      const bar: PriceBar = {
        date: dateStr,
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      };
      
      newBars.push(bar);

      // Only upsert if not already cached
      if (!cachedDates.has(dateStr)) {
        rowsToInsert.push({
          symbol: ticker,
          date: dateStr,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume
        });
      }
    }

    if (rowsToInsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('price_cache')
        .upsert(rowsToInsert, { onConflict: 'symbol,date' });
        
      if (upsertError) {
        console.error('Failed to upsert cache:', upsertError);
      }
    }
  }

  // Combine and sort
  const allBarsMap = new Map<string, PriceBar>();
  if (cachedData) {
    for (const d of cachedData) {
      allBarsMap.set(d.date, {
        date: d.date,
        open: Number(d.open),
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close),
        volume: Number(d.volume)
      });
    }
  }
  for (const b of newBars) {
    allBarsMap.set(b.date, b);
  }

  const result = Array.from(allBarsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  
  // Filter to just the requested range
  return result.filter(b => b.date >= fromDate && b.date <= toDate);
}

/**
 * Appends just the newest candle intended to run once daily after market close.
 */
export async function refreshLatestBar(symbolToken: string): Promise<PriceBar | null> {
  const today = new Date().toISOString().split('T')[0];
  const bars = await getHistoricalDaily(symbolToken, today, today);
  return bars.length > 0 ? bars[bars.length - 1] : null;
}
