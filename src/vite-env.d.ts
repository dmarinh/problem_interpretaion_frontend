/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string | undefined;
  readonly VITE_CACHE_MODE: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
