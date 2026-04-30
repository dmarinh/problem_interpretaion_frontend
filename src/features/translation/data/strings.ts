export const strings = {
  header: {
    productName: 'Problem Translator',
    descriptor: 'Natural-language food safety queries, grounded in predictive microbiology.',
    logoAlt: 'Foodigit logo',
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
    curveCaveat: 'Simplified visualisation — see table for exact per-step values.',
    muMaxStep1Suffix: '(step 1)',
  },
  c4: {
    heading: 'Provenance of grounded values',
    subtitle: 'How each parameter was determined. Expand a row for extraction and retrieval details.',
    subtitleFallback: 'All fields with their source.',
    colField: 'FIELD',
    colValue: 'VALUE',
    colSource: 'SOURCE',
    colStandardization: 'STANDARDIZATION',
    colDetail: 'DETAIL',
    // Legacy column kept for fallback rendering (non-verbose responses)
    colNotes: 'NOTES',
    allUserExplicit:
      'All values were taken directly from your query. No grounding was required.',
    expandLabel: 'Show details for this field',
    collapseLabel: 'Hide details for this field',
    // Disclosure subsection headings
    extractionHeading: 'EXTRACTION',
    standardisationHeading: 'STANDARDISATION',
    interpretationHeading: 'INTERPRETATION',
    retrievalHeading: 'RETRIEVAL',
    runnersUpHeading: 'ALTERNATIVE MATCHES',
    showFullText: 'Show full text',
    hideFullText: 'Hide full text',
    showAlternatives: 'Show alternatives',
    hideAlternatives: 'Hide alternatives',
    similarityLabel: 'Similarity',
    sharedRetrievalNote: 'This retrieval also supplied: {fields}',
  },
  pipeline: {
    intent: 'Intent',
    extraction: 'Extraction',
    grounding: 'Grounding',
    standardization: 'Standardization',
    execution: 'Execution',
  },
  c5: {
    heading: 'Safety flags',
    // Three fixed audit category labels (verbose mode)
    groupRangeClamps: 'RANGE CLAMPS',
    groupDefaultsImputed: 'DEFAULTS IMPUTED',
    groupWarnings: 'WARNINGS',
    noneApplied: '(none applied)',
    // Legacy group labels for fallback rendering (non-verbose responses)
    groupCorrections: 'CORRECTIONS APPLIED',
    groupClamps: 'VALUES CLAMPED',
    groupNotes: 'NOTES',
    stepAttached: '(attached to step {N} — see timeline)',
  },
  c6: {
    heading: 'ComBase model & audit detail',
    modelSubheading: 'SELECTED MODEL',
    rangesSubheading: 'VALID PARAMETER RANGES',
    coefficientsLabel: 'Coefficients',
    showFullCoefficients: 'Show full string',
    hideFullCoefficients: 'Hide full string',
    systemSubheading: 'SYSTEM PROVENANCE',
    systemToggleExpand: 'Show system details',
    systemToggleCollapse: 'Hide system details',
    fieldOrganism: 'Organism',
    fieldModelType: 'Model type',
    fieldModelId: 'Model ID',
    fieldSelectionReason: 'Selection reason',
    fieldPtmVersion: 'PTM version',
    fieldCombaseHash: 'ComBase table hash',
    fieldRagHash: 'RAG store hash',
    fieldRagIngested: 'RAG ingested',
    fieldSourceCsv: 'Source CSV date',
  },
  footer: {
    docs: 'Documentation',
    source: 'Source',
  },
} as const;
