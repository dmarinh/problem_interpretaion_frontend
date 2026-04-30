import { EXAMPLE_QUERIES, PERSONA_LABELS, PERSONA_ORDER } from './exampleQueries';
import { TEST_QUERIES } from './exampleQueries_UseCase';

// Change this to switch which example set the picker loads.
const MODE: 'standard' | 'use-case' = 'use-case';

export type DisplayQuery = { id: string; summary: string; fullText: string; goal?: string };
export type DisplayGroup = { label: string; queries: DisplayQuery[] };

function buildStandardGroups(): DisplayGroup[] {
  return PERSONA_ORDER.map((persona) => ({
    label: PERSONA_LABELS[persona],
    queries: EXAMPLE_QUERIES.filter((q) => q.persona === persona).map(({ id, summary, fullText }) => ({
      id,
      summary,
      fullText,
    })),
  }));
}

function buildUseCaseGroups(): DisplayGroup[] {
  return [
    {
      label: 'USE CASE DEMOS',
      queries: TEST_QUERIES.map(({ id, summary, fullText, goal }) => ({ id, summary, fullText, goal })),
    },
  ];
}

const BUILDERS: Record<'standard' | 'use-case', () => DisplayGroup[]> = {
  standard: buildStandardGroups,
  'use-case': buildUseCaseGroups,
};

export const ACTIVE_GROUPS: DisplayGroup[] = BUILDERS[MODE]();
