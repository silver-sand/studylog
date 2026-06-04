/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly AI_PROVIDER?: string;
  readonly GEMINI_API_KEY?: string;
  readonly GROQ_API_KEY?: string;
  readonly AI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
