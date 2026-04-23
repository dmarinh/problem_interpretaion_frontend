import { useMutation, useQuery } from '@tanstack/react-query';
import { translateApi } from '../api/client';
import { translationKeys } from '../api/keys';
import type { TranslationResponse } from '../api/types';
import type { TranslateError } from '../api/errors';

type Status = 'empty' | 'loading' | 'error' | 'success';

export interface UseTranslateQueryResult {
  data: TranslationResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: TranslateError | null;
  status: Status;
  /** The most recently submitted query string (mutation variable or initial URL query). */
  currentQuery: string | null;
  submit: (query: string) => void;
  retry: () => void;
  reset: () => void;
}

export function useTranslateQuery(
  initialQuery: string | null,
): UseTranslateQueryResult {
  // URL-bootstrapped query — fires on mount when ?q= is present.
  const bootstrap = useQuery<TranslationResponse, TranslateError>({
    queryKey: translationKeys.byQuery(initialQuery ?? ''),
    queryFn: () => translateApi(initialQuery!),
    enabled: !!initialQuery,
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
    retry: 0,
  });

  // User-initiated submit mutation.
  const mutation = useMutation<TranslationResponse, TranslateError, string>({
    mutationFn: translateApi,
  });

  // Derive unified state — mutation takes priority over bootstrap.
  const data = mutation.data ?? bootstrap.data;
  const isLoading = mutation.isPending || (bootstrap.isLoading && !!initialQuery);
  const isError = mutation.isError || bootstrap.isError;
  const error = (mutation.error ?? bootstrap.error) as TranslateError | null;
  const currentQuery = mutation.variables ?? initialQuery;

  // Status chain per §9.3 — order matters.
  const status: Status = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : data != null
        ? 'success'
        : 'empty';

  // Active query for retry: last mutation variable, then fall back to initial.
  const activeQuery = mutation.variables ?? initialQuery;

  return {
    data,
    isLoading,
    isError,
    error,
    status,
    currentQuery,
    submit: (query: string) => { mutation.mutate(query); },
    retry: () => { if (activeQuery) mutation.mutate(activeQuery); },
    reset: () => { mutation.reset(); },
  };
}
