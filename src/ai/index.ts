import type { AIServiceConfig } from '../types/ai';
import type { AIService } from './interface';
import { MockAIService } from './mock';
import { GeminiAIService } from './gemini';
import { GroqAIService } from './groq';

export function createAIService(config?: AIServiceConfig): AIService {
  if (config?.provider === 'gemini' && config.apiKey) {
    try {
      return new GeminiAIService(config.apiKey, config.modelName);
    } catch (e) {
      console.warn('Failed to initialize Gemini AI, falling back to mock:', e);
    }
  }

  if (config?.provider === 'groq' && config.apiKey) {
    try {
      return new GroqAIService(config.apiKey, config.modelName);
    } catch (e) {
      console.warn('Failed to initialize Groq AI, falling back to mock:', e);
    }
  }

  return new MockAIService();
}

/**
 * Create AI service from environment variables.
 * Priority: explicit AI_PROVIDER > auto-detect from keys > mock
 *
 * Env vars:
 *   AI_PROVIDER   — 'gemini', 'groq', or 'mock' (default: auto-detect)
 *   GEMINI_API_KEY — Gemini API key
 *   GROQ_API_KEY   — Groq API key (https://console.groq.com/keys)
 *   AI_MODEL       — model override (defaults per provider)
 */
export function createAIServiceFromEnv(): AIService {
  // Runtime-only env access — never import.meta.env for secrets: Vite inlines
  // those at build time, which would bake API keys into the server bundle.
  const provider = process.env.AI_PROVIDER as string | undefined;
  const geminiKey = process.env.GEMINI_API_KEY as string | undefined;
  const groqKey = process.env.GROQ_API_KEY as string | undefined;
  const modelName = process.env.AI_MODEL as string | undefined;

  // Auto-detect provider: explicit > gemini key > groq key > mock
  let resolvedProvider = provider;
  if (!resolvedProvider) {
    if (geminiKey) resolvedProvider = 'gemini';
    else if (groqKey) resolvedProvider = 'groq';
    else resolvedProvider = 'mock';
  }

  // Pick the right API key for the resolved provider
  const apiKey = resolvedProvider === 'groq' ? groqKey : geminiKey;

  console.log(`[AI] provider=${resolvedProvider} hasKey=${!!apiKey} model=${modelName || 'default'}`);

  return createAIService({
    provider: resolvedProvider as 'mock' | 'gemini' | 'groq',
    apiKey,
    modelName,
  });
}
