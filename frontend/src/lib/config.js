/**
 * Frontend runtime config — API base comes only from env (no hardcoded hosts).
 * Set NEXT_PUBLIC_API_URL in frontend/.env or .env.local
 * Example: http://127.0.0.1:8080/api  or  https://api.yourdomain.com/api
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

if (typeof window !== 'undefined' && !API_URL) {
  console.error(
    'NEXT_PUBLIC_API_URL is not set. Add it to frontend/.env.local (e.g. http://127.0.0.1:8080/api).'
  );
}
