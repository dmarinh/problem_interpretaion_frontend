const rawBase = import.meta.env.VITE_API_BASE_URL;
const rawCacheMode = import.meta.env.VITE_CACHE_MODE;

// Called once at startup by main.tsx. Throws a descriptive Error if either
// variable is missing or invalid. Must be called before mounting React.
export function validateEnv(): void {
  if (!rawBase) {
    throw new Error(
      'VITE_API_BASE_URL is required but not set. Check your .env.development file.',
    );
  }
  if (rawCacheMode !== undefined && rawCacheMode !== 'off' && rawCacheMode !== 'session') {
    throw new Error(
      `VITE_CACHE_MODE must be "off" or "session", got: "${rawCacheMode}"`,
    );
  }
}

export const env = {
  apiBaseUrl: rawBase ?? '',
  cacheMode: (rawCacheMode === 'session' ? 'session' : 'off') as 'off' | 'session',
} as const;
