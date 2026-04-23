import type { TranslationResponse } from '../api/types';
import type { TranslateError } from '../api/errors';
import { strings } from '../data/strings';
import { ErrorState } from './ErrorState';

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

// ── Success placeholder (CP2 — real panels come at Checkpoint 3) ───────────────

function SuccessPlaceholder({
  data,
  headingRef,
}: {
  data: TranslationResponse;
  headingRef: Props['headingRef'];
}) {
  const p = data.prediction!;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Main panel */}
      <section
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '24px',
        }}
      >
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
          Translation result
        </h2>
        <div
          style={{
            height: '1px',
            backgroundColor: 'var(--border)',
            marginBottom: '20px',
          }}
        />

        {/* Key fields — placeholder until Checkpoint 3 panels are implemented */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '12px 16px',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '14px',
          }}
        >
          <KeyValueRow label="Organism" value={p.organism} mono />
          <KeyValueRow label="Model type" value={p.model_type} mono />
          <KeyValueRow
            label="Total log change"
            value={`${p.total_log_increase >= 0 ? '+' : ''}${p.total_log_increase.toFixed(2)} log₁₀`}
            mono
          />
          <KeyValueRow
            label="Is multi-step"
            value={p.is_multi_step ? `Yes (${p.steps.length} steps)` : 'No (single step)'}
            mono
          />
          <KeyValueRow label="pH" value={p.ph.toFixed(2)} mono />
          <KeyValueRow label="Water activity" value={p.water_activity.toFixed(2)} mono />
          {data.overall_confidence != null && (
            <KeyValueRow
              label="Overall confidence"
              value={`${Math.round(data.overall_confidence * 100)}%`}
              mono
            />
          )}
          <KeyValueRow label="Warnings" value={String(data.warnings.length)} mono />
          <KeyValueRow label="Provenance entries" value={String(data.provenance.length)} mono />
        </div>

        <p
          style={{
            marginTop: '24px',
            fontSize: '12px',
            color: 'var(--text-subtle)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          ↑ Placeholder — full panels (C1–C5) implemented at Checkpoint 3
        </p>
      </section>

      {/* Raw step data — useful for reviewer verification */}
      {p.is_multi_step && (
        <section
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '24px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif, Source Serif 4, serif)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '16px',
            }}
          >
            Step predictions ({p.steps.length} steps)
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            {p.step_predictions.map((sp) => (
              <div
                key={sp.step_order}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--surface-muted)',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                }}
              >
                Step {sp.step_order}: {sp.temperature_celsius}°C · {sp.duration_minutes} min ·{' '}
                μ_max {sp.mu_max.toFixed(4)} · Δlog{' '}
                {sp.log_increase >= 0 ? '+' : ''}
                {sp.log_increase.toFixed(4)}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KeyValueRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '13px',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          color: 'var(--text)',
          fontFamily: mono
            ? 'var(--font-mono, JetBrains Mono, monospace)'
            : 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          margin: 0,
        }}
      >
        {value}
      </dd>
    </>
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
        <SuccessPlaceholder data={data} headingRef={headingRef} />
      ) : null;
  }
}
