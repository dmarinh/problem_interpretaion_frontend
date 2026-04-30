// /src/data/testQueries.ts
//
// Curated query set for PTM testing & demo runs.
// Companion to exampleQueries.ts — that file shows realistic user scenarios
// grouped by persona; this file drives the test journal sequence and is
// loaded when running the demo flow. IDs match journal entries (Q01..QNN).
//
// `summary` is the button label.
// `goal` is shown to the audience alongside the loaded query — frame it as
// the question the system is being asked to answer, in plain food-science /
// system-behaviour language. Internal architecture terms live in the
// corresponding journal entry, not here.

export type TestQuery = {
  id: string;
  summary: string;     // button label — short
  goal: string;        // shown during demo — one-line audience-facing question
  fullText: string;    // verbatim query sent to the API
};

export const TEST_QUERIES: TestQuery[] = [
  {
    id: 'Q04',
    summary: 'Q04 — Raw chicken, no pathogen specified',
    goal: "Can the system identify the right pathogen for a food when the user doesn't specify one — and fill in the food's properties from the knowledge base?",
    fullText:
      "What's the worst-case pathogen growth on raw chicken left at 25 °C for 4 hours?",
  },
];