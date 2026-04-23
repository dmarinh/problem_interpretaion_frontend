import type { z } from 'zod';
import type { TranslationResponseSchema } from './schema';

export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;
export type Prediction = NonNullable<TranslationResponse['prediction']>;
export type ProvenanceItem = TranslationResponse['provenance'][number];
export type WarningItem = TranslationResponse['warnings'][number];
export type Step = Prediction['steps'][number];
export type StepPrediction = Prediction['step_predictions'][number];
