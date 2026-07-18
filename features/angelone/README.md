# Angel One SmartAPI Integration

This module provides a secure, rate-limited, and cached data layer around Angel One's SmartAPI.

## Authentication Flow (TOTP-based)

Angel One does not use static long-lived tokens. The authentication uses a combination of credentials and a Time-Based One-Time Password (TOTP) to obtain temporary session tokens (`jwtToken` and `refreshToken`). 

### Flow Overview:
1. **Credentials**: We securely provide `ANGELONE_API_KEY`, `ANGELONE_CLIENT_CODE`, `ANGELONE_PASSWORD`, and `ANGELONE_TOTP_SECRET` via server-side environment variables.
2. **TOTP Generation**: When authentication is required, we use the `otplib` package to generate a fresh TOTP code in-memory on the server using the `ANGELONE_TOTP_SECRET`.
3. **Session Tokens**: We call the Angel One login endpoint (`/rest/auth/angelbroking/user/v1/loginByPassword`) with the credentials and the generated TOTP code. If successful, Angel One returns a `jwtToken` and `refreshToken`.
4. **Caching & Re-auth**: The `jwtToken` is cached in memory and used as a Bearer token in subsequent requests. When a request fails with an authentication error (e.g., token expired after a few hours), the module automatically traps the error, generates a new TOTP code, calls the login endpoint to fetch a fresh `jwtToken`, and retries the failed request transparently.

### Single Account Limitation (Important)
⚠️ **Currently, this integration uses a single account's credentials configured globally for the server.** 

This means the application interacts with Angel One using a single centralized broker account. It is **not** designed for per-user broker linking. If the product later requires serving other users' personal data or executing trades on behalf of individual users through this same API, we would need to implement per-user broker OAuth flows. This requires compliance review and a different architectural approach.

## Rate Limiting and Caching

The `getHistoricalDaily` function enforces a maximum of 3 requests per second to Angel One. It checks the Supabase `price_cache` table before fetching data and only requests dates it doesn't already have, upserting the results for future requests.

**Warning**: Do not import `angelOneClient.ts` into any Client Components, as it relies on server-only secrets.
