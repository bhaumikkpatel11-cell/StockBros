export interface AngelOneAuthResponse {
  status: boolean;
  message: string;
  errorcode: string;
  data: {
    jwtToken: string;
    refreshToken: string;
    feedToken: string;
  };
}

export interface AngelOneHistoricalResponse {
  status: boolean;
  message: string;
  errorcode: string;
  data: Array<[string, number, number, number, number, number]> | null;
}

export class AngelOneError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AngelOneError';
  }
}

export class AngelOneAuthError extends AngelOneError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'AngelOneAuthError';
  }
}

export class AngelOneRateLimitError extends AngelOneError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'AngelOneRateLimitError';
  }
}

export interface InstrumentMaster {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: string;
  lotsize: string;
  instrumenttype: string;
  exch_seg: string;
  tick_size: string;
}
