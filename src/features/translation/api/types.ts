import type { z } from 'zod';
import type { TranslationResponseSchema, AuditBlockSchema, DefaultImputedInfoSchema } from './schema';

export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;
export type Prediction = NonNullable<TranslationResponse['prediction']>;
export type ProvenanceItem = TranslationResponse['provenance'][number];
export type WarningItem = TranslationResponse['warnings'][number];
export type Step = Prediction['steps'][number];
export type StepPrediction = Prediction['step_predictions'][number];

// Verbose audit block types (§4.3) — inferred from AuditBlockSchema
export type AuditBlock = z.infer<typeof AuditBlockSchema>;
export type FieldAudit = AuditBlock['field_audit'][string];
export type AuditCategories = AuditBlock['audit'];
export type RetrievalBlock = NonNullable<FieldAudit['retrieval']>;
export type RetrievalTopMatch = RetrievalBlock['top_match'];
export type RunnerUp = RetrievalBlock['runners_up'][number];
export type CombaseModel = AuditBlock['combase_model'];
export type AuditSystem = AuditBlock['system'];
export type DefaultImputedInfo = z.infer<typeof DefaultImputedInfoSchema>;
