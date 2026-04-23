import { AlertTriangle } from 'lucide-react';
import { strings } from '../data/strings';
import type { TranslateError } from '../api/errors';

type Props = {
  error: TranslateError;
  currentQuery: string | null;
  onRetry: () => void;
  onEditAndResubmit: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement>;
};

function errorMessage(error: TranslateError): React.ReactNode {
  switch (error.kind) {
    case 'transport':
      return strings.error.transport;
    case 'validation':
      return strings.error.validation;
    case 'application':
      return (
        <>
          <span style={{ color: 'var(--text-muted)' }}>{strings.error.application} </span>
          {error.message}
        </>
      );
    case 'degenerate':
      return strings.error.degenerate;
    case 'timeout':
      return strings.error.timeout;
  }
}

// Collapsed details for validation errors in dev mode (§8.5.3).
function ValidationDetails({ error }: { error: TranslateError }) {
  if (error.kind !== 'validation') return null;
  if (!import.meta.env.DEV) return null;
  return (
    <details style={{ marginTop: '8px' }}>
      <summary
        style={{
          fontSize: '12px',
          color: 'var(--text-subtle)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        Zod error details (dev only)
      </summary>
      <pre
        style={{
          marginTop: '8px',
          padding: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {JSON.stringify(error.cause.issues, null, 2)}
      </pre>
    </details>
  );
}

export function ErrorState({ error, currentQuery, onRetry, onEditAndResubmit, headingRef }: Props) {
  return (
    <section
      role="alert"
      aria-label={strings.error.heading}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '24px',
      }}
    >
      {/* Panel heading with warning icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <AlertTriangle
          size={20}
          strokeWidth={1.5}
          style={{ color: 'var(--danger)', flexShrink: 0 }}
          aria-hidden="true"
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          style={{
            fontFamily: 'var(--font-serif, Source Serif 4, serif)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.2,
            outline: 'none',
          }}
        >
          {strings.error.heading}
        </h2>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--border)',
          marginBottom: '16px',
        }}
      />

      {/* Humanised error message */}
      <p
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          color: 'var(--text)',
          lineHeight: 1.5,
          marginBottom: '16px',
        }}
      >
        {errorMessage(error)}
      </p>

      <ValidationDetails error={error} />

      {/* Query echo block */}
      {currentQuery && (
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
            {currentQuery}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            height: '40px',
            padding: '0 16px',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--accent-fg)',
            backgroundColor: 'var(--accent)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--accent)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = '';
            e.currentTarget.style.outlineOffset = '';
          }}
        >
          {strings.error.tryAgain}
        </button>

        <button
          type="button"
          onClick={onEditAndResubmit}
          style={{
            height: '40px',
            padding: '0 16px',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-muted)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--accent)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = '';
            e.currentTarget.style.outlineOffset = '';
          }}
        >
          {strings.error.editAndResubmit}
        </button>
      </div>
    </section>
  );
}
