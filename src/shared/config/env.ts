const rawBase = import.meta.env.VITE_API_BASE_URL;

// Called once at startup by main.tsx. Throws a descriptive Error if the
// required variable is missing. Must be called before mounting React.
export function validateEnv(): void {
  if (!rawBase) {
    throw new Error(
      'VITE_API_BASE_URL is required but not set. Check your .env.development file.',
    );
  }
}

export const env = {
  apiBaseUrl: rawBase ?? '',
} as const;
