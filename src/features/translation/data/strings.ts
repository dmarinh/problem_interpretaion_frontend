export const strings = {
  header: {
    productName: 'Problem Translator',
    descriptor: 'Natural-language food safety queries, grounded in predictive microbiology.',
  },
  query: {
    heading: 'Your scenario',
    placeholder: 'Describe a food safety scenario in your own words…',
    loadExample: 'Load example',
    submit: 'Translate',
  },
  empty: {
    line1: 'Translate a food safety scenario to see grounded predictions and their provenance.',
    line2: 'Try an example from above, or describe your own.',
  },
  loading: {
    heading: 'Translating your scenario…',
    queryLabel: 'Your query:',
    status: 'Extracting parameters · grounding in sources · running model',
  },
  error: {
    heading: 'Translation did not complete',
    transport:
      'Could not reach the backend. Make sure the server is running at http://localhost:8000 and try again.',
    validation:
      'The backend returned an unexpected response format. This usually means the frontend and backend versions are out of sync.',
    application: 'The backend reported:',
    degenerate:
      'Translation completed, but no prediction was produced. Try rephrasing the query.',
    timeout:
      'The backend took too long to respond. Try again, or simplify the scenario.',
    tryAgain: 'Try again',
    editAndResubmit: 'Edit and resubmit',
  },
  c1: {
    heading: 'How the scenario was understood',
    yourWords: 'YOUR WORDS',
    parameters: 'SYSTEM PARAMETERS',
    multiStepNote: '{N} steps — see timeline below',
  },
  c2: {
    heading: 'Scenario timeline',
    totalDuration: 'Total duration:',
    totalLog: 'Total:',
  },
  c3: {
    heading: 'Prediction',
    confidence: 'Confidence',
    curveCaveat: 'Simplified visualisation — see table for exact per-step values.',
    muMaxStep1Suffix: '(step 1)',
  },
  c4: {
    heading: 'Provenance of grounded values',
    subtitle: 'Only fields that required grounding are shown.',
    colField: 'FIELD',
    colValue: 'VALUE',
    colSource: 'SOURCE',
    colConfidence: 'CONFIDENCE',
    colNotes: 'NOTES',
    overallConfidence: 'Overall confidence',
    allUserExplicit:
      'All values were taken directly from your query. No grounding was required.',
  },
  c5: {
    heading: 'Corrections and notes',
    groupCorrections: 'CORRECTIONS APPLIED',
    groupClamps: 'VALUES CLAMPED',
    groupNotes: 'NOTES',
    stepAttached: '(attached to step {N} — see timeline)',
  },
  footer: {
    docs: 'Documentation',
    source: 'Source',
  },
} as const;
