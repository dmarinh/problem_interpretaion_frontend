import { useEffect, useMemo, useRef } from 'react';
import packageJson from '../package.json';
import { useTranslateQuery } from './features/translation/hooks/useTranslateQuery';
import { QueryPanel } from './features/translation/components/QueryPanel';
import { ResultLayout } from './features/translation/components/ResultLayout';
import { strings } from './features/translation/data/strings';

// ── URL helpers (§9.5) ────────────────────────────────────────────────────────

function readInitialQuery(): string | null {
  const q = new URLSearchParams(window.location.search).get('q')?.trim() ?? null;
  if (!q || q.length > 2000) return null;
  return q;
}

function writeQueryToUrl(originalQuery: string) {
  const current = new URLSearchParams(window.location.search).get('q');
  if (current === originalQuery) return;
  const params = new URLSearchParams();
  params.set('q', originalQuery);
  window.history.replaceState(null, '', `?${params.toString()}`);
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  // Read ?q= once at mount — never re-derive from URL during the session.
  const initialQuery = useMemo(readInitialQuery, []);

  const translate = useTranslateQuery(initialQuery);

  // Refs for scroll target and focus management.
  const resultAreaRef = useRef<HTMLElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // URL sync: write ?q= when a successful response arrives (§9.5).
  useEffect(() => {
    if (translate.status !== 'success' || !translate.data) return;
    writeQueryToUrl(translate.data.original_query);
  }, [translate.status, translate.data]);

  // Auto-scroll and focus management on status transitions (§8.12).
  const prevStatusRef = useRef(translate.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = translate.status;

    if (prev !== 'loading' && curr === 'loading') {
      // Scroll result area into view when submit fires.
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultAreaRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    if (prev === 'loading' && (curr === 'success' || curr === 'error')) {
      // Focus result heading when response arrives so screen readers announce it.
      resultHeadingRef.current?.focus();
    }

    prevStatusRef.current = curr;
  }, [translate.status]);

  function handleEditAndResubmit() {
    // Focus and scroll to textarea so user can edit (§8.5.3).
    const el = textareaRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    el.focus();
    // Move cursor to end.
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-8 py-8 flex flex-col flex-1">

        {/* Region A — Header (§8.2) */}
        <header className="h-16 flex items-center" aria-label="Site header">
          <img
            src="/logo.png"
            alt={strings.header.logoAlt}
            width={100}
            height={32}
            className="h-8 w-auto mr-3"
          />
          <span
            className="font-serif text-2xl font-medium"
            style={{ color: 'var(--text)' }}
          >
            {strings.header.productName}
          </span>
          <div
            className="mx-4 w-px h-6 shrink-0"
            style={{ backgroundColor: 'var(--border-strong)' }}
            aria-hidden="true"
          />
          <span
            className="font-sans text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {strings.header.descriptor}
          </span>
        </header>

        <hr className="border-0 border-t" style={{ borderColor: 'var(--border)' }} />

        {/* Regions B + C */}
        <main className="flex-1 mt-8 mb-8 flex flex-col gap-8">

          {/* Region B — Query Panel (§8.3) */}
          <QueryPanel
            initialQuery={initialQuery}
            onSubmit={translate.submit}
            isSubmitting={translate.status === 'loading'}
            textareaRef={textareaRef}
          />

          {/* Region C — Result Area (§8.5) */}
          <section
            ref={resultAreaRef}
            aria-label="Translation result"
            aria-live="polite"
            aria-busy={translate.status === 'loading'}
          >
            <ResultLayout
              status={translate.status}
              data={translate.data}
              error={translate.error}
              currentQuery={translate.currentQuery}
              onRetry={translate.retry}
              onEditAndResubmit={handleEditAndResubmit}
              headingRef={resultHeadingRef}
            />
          </section>

        </main>

        {/* Region D — Footer (§8.11) */}
        <div>
          <hr className="border-0 border-t" style={{ borderColor: 'var(--border)' }} />
          <footer
            className="h-10 flex items-center justify-between font-sans"
            aria-label="Site footer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {strings.header.productName}
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: 'var(--text-subtle)' }}
              >
                v{packageJson.version}
              </span>
            </div>
            {/* Inert labels — real URLs not yet defined (§8.11) */}
            <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              {strings.footer.docs}&nbsp;·&nbsp;{strings.footer.source}
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}
