import { env } from '@/shared/config/env';
import { TranslationResponseSchema, runDevAssertions } from './schema';
import type { TranslationResponse } from './types';
import type { TranslateError } from './errors';

export async function translateApi(query: string): Promise<TranslationResponse> {
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}/api/v1/translate?verbose=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } catch (cause) {
    throw { kind: 'transport', cause } satisfies TranslateError;
  }

  if (!response.ok) {
    throw { kind: 'transport', cause: new Error(`HTTP ${response.status}`) } satisfies TranslateError;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw { kind: 'transport', cause } satisfies TranslateError;
  }

  const parsed = TranslationResponseSchema.safeParse(json);
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.error('[translateApi] Zod parse failure:', parsed.error);
    }
    throw { kind: 'validation', cause: parsed.error } satisfies TranslateError;
  }

  const data = parsed.data;

  runDevAssertions(data);

  if (!data.success) {
    throw { kind: 'application', message: data.error ?? '' } satisfies TranslateError;
  }

  if (data.prediction === null) {
    throw { kind: 'degenerate' } satisfies TranslateError;
  }

  return data;
}
