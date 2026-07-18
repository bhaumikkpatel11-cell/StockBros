# Angel One Integration

This module provides a secure, rate-limited, and cached data layer over the Angel One SmartAPI for historical OHLC data.

## Environment Variables

You need to configure the following environment variables in your `.env.local` file:

```env
ANGELONE_API_KEY=your_smartapi_key
ANGELONE_CLIENT_CODE=your_client_code
ANGELONE_PASSWORD=your_mpin_or_password
ANGELONE_TOTP_SECRET=your_totp_secret
```

### How to get the TOTP Secret

1. Log in to the [Angel One SmartAPI Dashboard](https://smartapi.angelbroking.com/).
2. Enable TOTP for your account via the Angel One mobile app / web platform.
3. During the TOTP setup process, instead of just scanning the QR code, look for an option to "View Secret Key" or "Setup Manually".
4. Copy the base32 secret string (usually looks like `JBSWY3DPEHPK3PXP`).
5. Save this string as `ANGELONE_TOTP_SECRET` in your `.env.local` file.

## Important Note

The `angelOneClient.ts` module includes server-side only secrets (like the TOTP secret and password) and must **never** be imported into client-side components. The file is protected by the `server-only` package.
