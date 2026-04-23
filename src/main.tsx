import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { env, validateEnv } from './shared/config/env';
import './styles/globals.css';

function renderFatalError(message: string): void {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  // Inline styles — CSS tokens and fonts may not be applied yet at this point.
  rootEl.innerHTML = `
    <div role="alert" style="padding:2rem;font-family:sans-serif;color:#1A1A17;background:#FAFAF7;min-height:100vh">
      <h1 style="font-size:1.1rem;font-weight:600;margin:0 0 .75rem;color:#8B2020">Configuration error</h1>
      <pre style="color:#5B5B55;font-size:.8125rem;background:#F4F4F1;padding:1rem;border-radius:4px;white-space:pre-wrap;margin:0 0 1rem;border:1px solid #E4E4DF">${message}</pre>
      <button onclick="window.location.reload()" style="padding:.5rem 1rem;background:#2E3A4C;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.875rem">Reload page</button>
    </div>`;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '2rem',
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text)',
            backgroundColor: 'var(--background)',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {this.state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function mountApp(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: env.cacheMode === 'session' ? Infinity : 0,
        gcTime: 1000 * 60 * 30,
        retry: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element #root not found in index.html');

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

try {
  validateEnv();
  mountApp();
} catch (err) {
  renderFatalError(err instanceof Error ? err.message : String(err));
}
