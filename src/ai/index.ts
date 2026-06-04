import type { AIServiceConfig } from '../types/ai';
import type { AIService } from './interface';
import { MockAIService } from './mock';
import { GeminiAIService } from './gemini';

export function createAIService(config?: AIServiceConfig): AIService {
  if (config?.provider === 'gemini' && config.apiKey) {
    try {
      return new GeminiAIService(config.apiKey, config.modelName);
    } catch (e) {
      console.warn('Failed to initialize Gemini AI, falling back to mock:', e);
    }
  }
  return new MockAIService();
}

/**
 * Create AI service from environment variables.
 * Priority: env vars > passed config
 */
export function createAIServiceFromEnv(): AIService {
  // Use both import.meta.env (build-time) and process.env (runtime fallback)
  const provider = (import.meta.env.AI_PROVIDER || process.env.AI_PROVIDER) as string | undefined;
  const apiKey = (import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY) as string | undefined;
  const modelName = (import.meta.env.AI_MODEL || process.env.AI_MODEL) as string | undefined;

  // Auto-detect gemini if API key is set, even without explicit AI_PROVIDER
  const resolvedProvider = provider || (apiKey ? 'gemini' : 'mock');

  console.log(`[AI] provider=${resolvedProvider} hasKey=${!!apiKey} model=${modelName || 'default'}`);

  return createAIService({
    provider: resolvedProvider as 'mock' | 'gemini',
    apiKey,
    modelName,
  });
}
