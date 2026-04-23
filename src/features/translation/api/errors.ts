import type { ZodError } from 'zod';

export type TranslateError =
  | { kind: 'transport'; cause: unknown }
  | { kind: 'validation'; cause: ZodError }
  | { kind: 'application'; message: string }
  | { kind: 'degenerate' }
  | { kind: 'timeout' };
