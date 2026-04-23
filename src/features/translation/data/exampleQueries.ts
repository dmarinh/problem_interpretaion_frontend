export type Persona = 'Risk Assessor' | 'Regulatory Inspector' | 'Industry HACCP / QA';

export type ExampleQuery = {
  id: string;
  persona: Persona;
  summary: string;
  fullText: string;
};

export const PERSONA_LABELS: Record<Persona, string> = {
  'Risk Assessor': 'RISK ASSESSORS',
  'Regulatory Inspector': 'REGULATORY INSPECTORS',
  'Industry HACCP / QA': 'INDUSTRY HACCP / QA',
};

export const PERSONA_ORDER: readonly Persona[] = [
  'Risk Assessor',
  'Regulatory Inspector',
  'Industry HACCP / QA',
] as const;

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    id: 'A1',
    persona: 'Risk Assessor',
    summary: 'Listeria in vacuum-packed deli meat…',
    fullText:
      'We need to model L. monocytogenes growth in vacuum-packed sliced turkey deli meat during retail display. Assume typical retail refrigeration. The product has a 35-day shelf life. What growth can we expect?',
  },
  {
    id: 'A2',
    persona: 'Risk Assessor',
    summary: 'Salmonella on ground beef — transport to home storage…',
    fullText:
      'For the exposure assessment, we need to estimate Salmonella growth on ground beef from purchase to cooking. The consumer picks it up at the supermarket, drives home — assume a typical shopping trip — and stores it in the home refrigerator. Model the growth during the transport and home storage segments separately.',
  },
  {
    id: 'A7',
    persona: 'Risk Assessor',
    summary: 'B. cereus in buffet rice…',
    fullText:
      'Cooked rice is held at a buffet for service. The rice was cooked to above 95°C, cooled to serving temperature, and placed on a heated display. We need to assess B. cereus risk assuming the rice is held for the service period.',
  },
  {
    id: 'B1',
    persona: 'Regulatory Inspector',
    summary: 'Failed refrigeration — poultry truck…',
    fullText:
      'During a routine inspection of a poultry distribution truck, I found the refrigeration unit had failed. The driver says it broke down about two hours ago. The truck thermometer reads 12°C now. The load is fresh chicken portions.',
  },
  {
    id: 'B2',
    persona: 'Regulatory Inspector',
    summary: 'Hot-holding deviation — chicken soup…',
    fullText:
      "At a restaurant inspection, the chicken soup on the hot-holding line measured 48°C. The cook says it's been on the line since the start of lunch service, roughly two and a half hours. The soup was boiled before service.",
  },
  {
    id: 'B7',
    persona: 'Regulatory Inspector',
    summary: 'Frozen turkey thawing on counter…',
    fullText:
      "I found several large frozen turkey breasts thawing on the counter. The kitchen staff said they were taken out of the freezer 'first thing this morning' — it's now mid-afternoon. The surface temperature reads 18°C but the core is still frozen.",
  },
  {
    id: 'C1',
    persona: 'Industry HACCP / QA',
    summary: 'Overnight refrigeration breakdown…',
    fullText:
      'The refrigeration chamber for our turkey storage broke down overnight. When we came in this morning, the temperature was reading 13°C. We think it failed sometime during the night — maybe around 2 AM. The turkey portions have been there since yesterday afternoon. Can we still use them?',
  },
  {
    id: 'C2',
    persona: 'Industry HACCP / QA',
    summary: 'Chicken nuggets — thermal inactivation…',
    fullText:
      'One of our oven lines had a temperature drop during a production run of breaded chicken nuggets. The oven thermocouples show the product core temp only reached 68°C instead of our target 74°C. The nuggets were in the oven for the normal time of 8 minutes. Do we need to discard the batch?',
  },
  {
    id: 'C3',
    persona: 'Industry HACCP / QA',
    summary: 'Cooked ham cooling validation…',
    fullText:
      'We need to validate our cooling process for cooked bone-in hams. After the smokehouse, the hams are shower-cooled then placed in the blast chiller. It takes about 4 hours to go from 54°C to 27°C, and then another 8 hours to go from 27°C to 4°C. Does this meet the FSIS cooling requirements?',
  },
];
