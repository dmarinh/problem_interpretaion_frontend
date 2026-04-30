import { useMemo } from 'react';
import type { TranslationResponse } from '../api/types';
import type { TranslateError } from '../api/errors';
import { strings } from '../data/strings';
import { correlateWarnings, buildWarningStepMap } from '../utils/warnings';
import { ErrorState } from './ErrorState';
import { TranslationPanel } from './TranslationPanel';
import { StepTimeline } from './StepTimeline';
import { PredictionPanel } from './PredictionPanel';
import { ProvenancePanel } from './ProvenancePanel';
import { AuditChecks } from './AuditChecks';
import { AuditDetailPanel } from './AuditDetailPanel';
import { PipelineStrip } from './PipelineStrip';

type Status = 'empty' | 'loading' | 'error' | 'success';

type Props = {
  status: Status;
  data: TranslationResponse | undefined;
  error: TranslateError | null;
  currentQuery: string | null;
  onRetry: () => void;
  onEditAndResubmit: () => void;
  /** Always provided by App.tsx — required so sub-components can receive it without undefined checks. */
  headingRef: React.RefObject<HTMLHeadingElement>;
};

// ── Shared skeleton block (§8.5.2) ────────────────────────────────────────────

function SkeletonBlock({
  height,
  width = '100%',
}: {
  height: number;
  width?: string;
}) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        height: `${height}px`,
        width,
        borderRadius: '4px',
      }}
    />
  );
}

// ── Query echo block — shared by loading and error states ──────────────────────

function QueryEcho({ query }: { query: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <p
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {strings.loading.queryLabel}
      </p>
      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '14px',
          color: 'var(--text)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {query}
      </div>
    </div>
  );
}

// ── Empty state (§8.5.1) ───────────────────────────────────────────────────────

function EmptyState({ headingRef }: { headingRef: Props['headingRef'] }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '24px',
        minHeight: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Hidden heading for screen reader / focus target */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
        }}
      >
        Result area
      </h2>

      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <p
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '8px',
          }}
        >
          {strings.empty.line1}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          {strings.empty.line2}
        </p>
      </div>
    </div>
  );
}

// ── Loading state (§8.5.2) ────────────────────────────────────────────────────

function LoadingState({
  currentQuery,
  headingRef,
}: {
  currentQuery: string | null;
  headingRef: Props['headingRef'];
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '24px',
      }}
    >
      {/* Heading */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        style={{
          fontFamily: 'var(--font-serif, Source Serif 4, serif)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '4px',
          lineHeight: 1.2,
          outline: 'none',
        }}
      >
        {strings.loading.heading}
      </h2>
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--border)',
          marginBottom: '20px',
        }}
      />

      {/* Query echo */}
      {currentQuery && <QueryEcho query={currentQuery} />}

      {/* Skeleton blocks mimicking the eventual panel structure */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {/* C1 skeleton — two-column shape */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <SkeletonBlock height={80} width="50%" />
          <SkeletonBlock height={80} width="50%" />
        </div>

        {/* C2 skeleton — single timeline bar */}
        <SkeletonBlock height={60} />

        {/* C3 skeleton — two columns, taller for chart area */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <SkeletonBlock height={120} width="35%" />
          <SkeletonBlock height={120} width="65%" />
        </div>

        {/* C4 skeleton — table rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBlock height={24} />
          <SkeletonBlock height={24} width="85%" />
          <SkeletonBlock height={24} width="70%" />
        </div>
      </div>

      {/* Bottom status line */}
      <p
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-subtle)',
        }}
      >
        {strings.loading.status}
      </p>
    </div>
  );
}

// ── Success state — six real panels (C1–C6) ───────────────────────────────────

function SuccessState({
  data,
  headingRef,
}: {
  data: TranslationResponse;
  headingRef: Props['headingRef'];
}) {
  const p = data.prediction!

  // §9.10: memoised because it's computed once per response.
  const { perStep, perStep: perStepWarnings } = useMemo(
    () => correlateWarnings(data.warnings, p.steps),
    [data.warnings, p.steps],
  )

  const warningStepMap = useMemo(
    () => buildWarningStepMap(perStep),
    [perStep],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Pipeline strip — navigable stage summary, placed before C1 (§8.5.4) */}
      <PipelineStrip data={data} />

      {/* C1 — Translation Panel: "your words ↔ system's parameters" */}
      <div id="result-c1" data-panel>
        <TranslationPanel data={data} headingRef={headingRef} />
      </div>

      {/* C2 — Step Timeline: always present (single or multi) */}
      <StepTimeline data={data} perStepWarnings={perStepWarnings} />

      {/* C3 — Prediction Panel: headline numbers + growth curve */}
      <div id="result-c3" data-panel>
        <PredictionPanel data={data} />
      </div>

      {/* C4 — Provenance Panel: per-field grounding breakdown */}
      <div id="result-c4" data-panel>
        <ProvenancePanel data={data} />
      </div>

      {/* C5 — Safety Flags: always rendered; "(none applied)" for empty categories */}
      <AuditChecks data={data} warningStepMap={warningStepMap} />

      {/* C6 — ComBase Model & Audit Detail: rendered only when audit block is present */}
      <AuditDetailPanel data={data} />
    </div>
  );
}

// ── ResultLayout ──────────────────────────────────────────────────────────────

export function ResultLayout({
  status,
  data,
  error,
  currentQuery,
  onRetry,
  onEditAndResubmit,
  headingRef,
}: Props) {
  switch (status) {
    case 'empty':
      return <EmptyState headingRef={headingRef} />;

    case 'loading':
      return <LoadingState currentQuery={currentQuery} headingRef={headingRef} />;

    case 'error':
      return error ? (
        <ErrorState
          error={error}
          currentQuery={currentQuery}
          onRetry={onRetry}
          onEditAndResubmit={onEditAndResubmit}
          headingRef={headingRef}
        />
      ) : null;

    case 'success':
      return data?.prediction ? (
        <SuccessState data={data} headingRef={headingRef} />
      ) : null;
  }
}
