import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { strings } from '../data/strings';
import { ExamplePicker } from './ExamplePicker';

type Props = {
  initialQuery: string | null;
  onSubmit: (query: string) => void;
  isSubmitting: boolean;
  /** External ref so App.tsx can focus the textarea for "Edit and resubmit". */
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
};

const MAX_LENGTH = 2000;
const COUNTER_THRESHOLD = 1800;

export function QueryPanel({ initialQuery, onSubmit, isSubmitting, textareaRef }: Props) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Use the external ref if provided, else the internal one.
  const resolvedTextareaRef: React.RefObject<HTMLTextAreaElement> =
    textareaRef ?? internalTextareaRef;

  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const loadExampleButtonRef = useRef<HTMLButtonElement>(null);

  const trimmed = query.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_LENGTH;
  const isOverLimit = query.length > MAX_LENGTH;
  const showCounter = query.length >= COUNTER_THRESHOLD;

  // Focus textarea on mount (§8.3).
  useEffect(() => {
    resolvedTextareaRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-grow textarea (min 96px / 3 rows, max 256px / 8 rows).
  useLayoutEffect(() => {
    const el = resolvedTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 256)}px`;
  }, [query, resolvedTextareaRef]);

  // Close picker on click outside the picker container (§8.4).
  useEffect(() => {
    if (!isPickerOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(e.target as Node)
      ) {
        setIsPickerOpen(false);
        // Do not return focus here — the user clicked somewhere else intentionally.
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => { document.removeEventListener('mousedown', handleMouseDown); };
  }, [isPickerOpen]);

  function handleSubmit() {
    if (!isValid || isSubmitting) return;
    onSubmit(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleExampleSelect(fullText: string) {
    setQuery(fullText);
    setIsPickerOpen(false);
    // Return focus to textarea per §8.4.
    resolvedTextareaRef.current?.focus();
    // Move cursor to end of pasted text.
    requestAnimationFrame(() => {
      const el = resolvedTextareaRef.current;
      if (!el) return;
      el.selectionStart = el.value.length;
      el.selectionEnd = el.value.length;
    });
  }

  function handlePickerClose() {
    setIsPickerOpen(false);
    // Return focus to the "Load example" button on Esc (keyboard user convention).
    loadExampleButtonRef.current?.focus();
  }

  function handleLoadExampleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' && !isPickerOpen) {
      e.preventDefault();
      setIsPickerOpen(true);
    }
  }

  return (
    <section
      aria-label={strings.query.heading}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '24px',
      }}
    >
      {/* Panel header */}
      <h2
        style={{
          fontFamily: 'var(--font-serif, Source Serif 4, serif)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '16px',
          lineHeight: 1.2,
        }}
      >
        {strings.query.heading}
      </h2>

      {/* Textarea */}
      <textarea
        ref={resolvedTextareaRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={strings.query.placeholder}
        aria-label={strings.query.heading}
        aria-describedby={showCounter ? 'char-counter' : undefined}
        rows={3}
        style={{
          display: 'block',
          width: '100%',
          minHeight: '96px',
          maxHeight: '256px',
          overflowY: 'auto',
          resize: 'none',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '16px',
          lineHeight: '1.5',
          color: 'var(--text)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '16px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = '';
        }}
      />

      {/* Footer row: Load example | char counter | Translate */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          gap: '12px',
        }}
      >
        {/* Load example button + picker */}
        <div ref={pickerContainerRef} style={{ position: 'relative' }}>
          <button
            ref={loadExampleButtonRef}
            type="button"
            onClick={() => { setIsPickerOpen((prev) => !prev); }}
            onKeyDown={handleLoadExampleKeyDown}
            aria-haspopup="true"
            aria-expanded={isPickerOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
            {strings.query.loadExample}
            <ChevronDown
              size={14}
              style={{
                strokeWidth: 1.5,
                transform: isPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
              }}
            />
          </button>

          {isPickerOpen && (
            <ExamplePicker onSelect={handleExampleSelect} onClose={handlePickerClose} />
          )}
        </div>

        {/* Character counter (visible only when approaching limit) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          {showCounter && (
            <span
              id="char-counter"
              aria-live="polite"
              style={{
                fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                fontSize: '13px',
                color: isOverLimit ? 'var(--danger)' : 'var(--text-muted)',
              }}
            >
              {query.length} / {MAX_LENGTH}
            </span>
          )}

          {/* Translate / submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            title={
              isSubmitting
                ? 'Translating…'
                : !trimmed
                  ? 'Enter a query first'
                  : isOverLimit
                    ? `Query exceeds ${MAX_LENGTH} characters`
                    : `${strings.query.submit} (Ctrl+Enter)`
            }
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
              cursor: !isValid || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: !isValid || isSubmitting ? 0.4 : 1,
              transition: 'opacity 150ms ease, background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isValid || isSubmitting) return;
              (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--accent) 85%, black)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)';
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
            {isSubmitting ? 'Translating…' : strings.query.submit}
          </button>
        </div>
      </div>
    </section>
  );
}
