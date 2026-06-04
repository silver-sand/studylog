/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly AI_PROVIDER?: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
