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
    id: 'Q01',
    summary: 'Q01 — All parameters specified',
    goal: 'When the user provides every input directly — pathogen, temperature, pH, water activity, duration — does the system pass them through cleanly without invoking retrieval or defaults?',
    fullText:
      'Predict Bacillus cereus growth at 25 °C, pH 6.0, water activity 0.95, for 4 hours.',
  },
  {
    id: 'Q02',
    summary: 'Q02 — Chicken, single-property retrieval',
    goal: 'When the user gives the food name and water activity directly, will the system fetch the missing pH from the knowledge base while leaving the user-supplied value untouched?',
    fullText:
      'Predict Salmonella growth on chicken at 25 °C, water activity 0.99, for 4 hours.',
  },
  {
    id: 'Q03',
    summary: 'Q03 — White bread, multi-source citation',
    goal: 'When the system retrieves a food whose properties come from two different scientific authorities, will it cite both — without extra plumbing — so the user can see exactly where each value came from?',
    fullText:
      'A slice of white bread was kept at 25 °C for 4 hours. Predict Bacillus cereus growth.',
  },
  {
    id: 'Q04',
    summary: 'Q04 — Raw chicken, no pathogen specified',
    goal: "Can the system identify the right pathogen for a food when the user doesn't specify one — and fill in the food's properties from the knowledge base?",
    fullText:
      "What's the worst-case pathogen growth on raw chicken left at 25 °C for 4 hours?",
  },
  {
    id: 'Q05',
    summary: 'Q05 — Bread at "room temperature"',
    goal: 'When the user describes the temperature in everyday language instead of giving a number, will the system understand it and explain the assumption it made?',
    fullText:
      'A slice of white bread was kept at room temperature for 4 hours. Predict B. cereus growth.',
  },
  {
    id: 'Q06',
    summary: 'Q06 — Cooked rice, vague duration and no pathogen',
    goal: 'When the user describes a scenario in everyday language without specifying the dangerous pathogen, will the system understand what to assume — and tell the user clearly what assumptions it made?',
    fullText:
      'Cooked rice was sitting out for a while. Predict pathogen growth.',
  },
  {
    id: 'Q07',
    summary: 'Q07 — Bread on a sunny windowsill',
    goal: 'When the user describes a temperature situation in words the system has never seen before, can it still understand what was meant — and explain the resemblance it found?',
    fullText:
      'A slice of white bread was left on a sunny windowsill for 4 hours. Predict B. cereus growth.',
  },
  {
    id: 'Q08',
    summary: 'Q08 — Cooking chicken: was it enough?',
    goal: 'When the user asks whether a cooking step was sufficient to make food safe, will the system reverse its conservative-direction reasoning — taking the lower-kill bound instead of the higher-growth one — and explain why?',
    fullText:
      'We cooked the chicken to 65 °C for 10 minutes — was that enough?',
  },
  {
    id: 'Q09',
    summary: 'Q09 — E. coli on milk at extreme temperature',
    goal: 'When the user gives conditions that fall outside what the prediction model is validated for, will the system tell them, evaluate at the safest boundary it can defend, and warn about every adjustment it had to make?',
    fullText:
      'Predict E. coli growth on milk at 50 °C for 6 hours.',
  },
  {
    id: 'Q10',
    summary: 'Q10 — Listeria on cheese, fortnight in the fridge',
    goal: 'When a pathogen is famously able to grow at refrigeration temperatures over long periods, can the system predict its slow growth correctly — and tell the user when the food it found in its database might not be what they meant?',
    fullText:
      'Predict Listeria growth in cheese at 4°C for 14 days.',
  },
  {
    id: 'Q11',
    summary: 'Q11 — Chicken left out overnight, conversational',
    goal: 'When the user asks a safety question in everyday language with multiple vague time and temperature cues, will the system understand the scenario and predict growth — even if interpreting the result as a safety verdict requires more than a growth model alone?',
    fullText:
      'Was the chicken left out overnight at room temperature still safe to eat?',
  },
  {
    id: 'Q12',
    summary: 'Q12 — Bread with no pathogen specified',
    goal: 'When the user asks about a food that the knowledge base has no pathogen-specific data for, will the system honestly say so and fall back to a conservative default — rather than fabricating an answer?',
    fullText:
      'Predict pathogen growth on a slice of white bread at 25°C for 4 hours.',
  },
  {
    id: 'Q13',
    summary: 'Q13 — How long until pathogen reaches 3-log growth?',
    goal: 'When the user asks for a duration as the answer rather than as an input, will the system recognise that this is the inverse of what it was built to do — and fail clearly rather than fabricate a number?',
    fullText:
      'How long can chicken be left at 25°C before Salmonella grows by 3 logs?',
  },
  {
    id: 'Q14',
    summary: 'Q14 — Salmonella on chicken with no duration given',
    goal: 'When the user provides every input except how long the food was held, what should the system do? This entry is a deliberate case study — the right behaviour is a design question, not a fixed answer.',
    fullText:
      'How will Salmonella grow on chicken at 25°C, pH 6.4, water activity 0.99?',
  },
  {
    id: 'Q15',
    summary: 'Q15 — Made-up food name (zarblax burger)',
    goal: 'When the user asks about a food the system has never heard of, will it tell them clearly that it filled in conservative assumptions for the missing properties — rather than pretending it knew?',
    fullText:
      'Predict B. cereus growth on zarblax burger at 25°C for 4 hours.',
  },
  {
    id: 'Q16',
    summary: 'Q16 — Bread with user-supplied pH range',
    goal: 'When the user provides a value as a range rather than a single number, will the system understand it the same way it understands ranges from its own database — and explain the assumption it made?',
    fullText:
      'Predict B. cereus growth on white bread at pH 5.5–6.0, 25°C, for 4 hours.',
  },

];
//Jam, hard cheese, and yogurt are left out at 30 °C for 4 hours. Which is safest from E.coli?