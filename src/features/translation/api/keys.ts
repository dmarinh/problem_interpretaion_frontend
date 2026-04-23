export const translationKeys = {
  all: ['translation'] as const,
  byQuery: (query: string) => ['translation', query] as const,
};
