/**
 * BYOK Provider Registry — supported providers for Bring Your Own Key mode.
 *
 * Each provider has:
 *   - API endpoint configuration
 *   - Model catalog with free/paid indicators
 *   - Key validation (prefix check)
 *   - Stream parsing support
 */

export type ByokProviderId =
  | 'groq'
  | 'google'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'deepseek'
  | 'together'
  | 'fireworks';

export interface ByokModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutput: number;
  isFree?: boolean;
}

export interface ByokProviderConfig {
  id: ByokProviderId;
  name: string;
  icon: string;
  description: string;
  docsUrl: string;
  keyPrefix: string[];
  keyPlaceholder: string;
  defaultModel: string;
  /** OpenAI-compatible endpoint (most providers use this) */
  apiUrl: string;
  /** Extra headers to send (e.g. Anthropic anthropic-version) */
  extraHeaders?: Record<string, string>;
  /** Map model ID before sending to API */
  mapModel?: (model: string) => string;
  /** Models available for this provider */
  models: ByokModel[];
  /** Whether to use Anthropic Messages API format instead of OpenAI */
  useAnthropicFormat?: boolean;
}

export const BYOK_PROVIDERS: ByokProviderConfig[] = [
  {
    id: 'groq',
    name: 'Groq',
    icon: 'Zap',
    description: 'Ultra-fast LLM inference. Free tier available.',
    docsUrl: 'https://console.groq.com/keys',
    keyPrefix: ['gsk_'],
    keyPlaceholder: 'gsk_...',
    defaultModel: 'llama-3.3-70b-versatile',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Best quality, ~300ms TTFT', contextWindow: 131072, maxOutput: 8192, isFree: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Fastest responses', contextWindow: 131072, maxOutput: 8192, isFree: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'MoE architecture', contextWindow: 32768, maxOutput: 8192, isFree: true },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google compact model', contextWindow: 8192, maxOutput: 4096, isFree: true },
    ],
  },
  {
    id: 'google',
    name: 'Google AI Studio',
    icon: 'Sparkles',
    description: 'Gemini models via Google AI Studio. Free tier available.',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPrefix: ['AIza'],
    keyPlaceholder: 'AIza...',
    defaultModel: 'gemini-2.0-flash',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and capable', contextWindow: 1048576, maxOutput: 8192, isFree: true },
      { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', description: 'Latest thinking model', contextWindow: 1048576, maxOutput: 8192, isFree: true },
      { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', description: 'Best quality', contextWindow: 1048576, maxOutput: 8192 },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'Bot',
    description: 'GPT-4o, GPT-4o-mini. Paid API.',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: ['sk-'],
    keyPlaceholder: 'sk-...',
    defaultModel: 'gpt-4o-mini',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cheap', contextWindow: 128000, maxOutput: 16384 },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Flagship multimodal', contextWindow: 128000, maxOutput: 16384 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous gen flagship', contextWindow: 128000, maxOutput: 4096 },
      { id: 'o1-mini', name: 'o1-mini', description: 'Reasoning model (fast)', contextWindow: 128000, maxOutput: 65536 },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'Brain',
    description: 'Claude models. Paid API. Uses Messages API.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: ['sk-ant-'],
    keyPlaceholder: 'sk-ant-...',
    defaultModel: 'claude-sonnet-4-20250514',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    extraHeaders: { 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    useAnthropicFormat: true,
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Best balance of speed and quality', contextWindow: 200000, maxOutput: 16384 },
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', description: 'Previous gen', contextWindow: 200000, maxOutput: 8192 },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', description: 'Fast and cheap', contextWindow: 200000, maxOutput: 8192 },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: 'Globe',
    description: 'Access 200+ models via one key. Has free models.',
    docsUrl: 'https://openrouter.ai/keys',
    keyPrefix: ['sk-or-'],
    keyPlaceholder: 'sk-or-...',
    defaultModel: 'google/gemini-2.0-flash-exp:free',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    extraHeaders: { 'HTTP-Referer': 'https://shadowtalk.app', 'X-Title': 'ShadowTalk AI (BYOK)' },
    models: [
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', description: 'Free via OpenRouter', contextWindow: 1048576, maxOutput: 8192, isFree: true },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', description: 'Free via OpenRouter', contextWindow: 131072, maxOutput: 8192, isFree: true },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Via OpenRouter', contextWindow: 128000, maxOutput: 16384 },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Via OpenRouter', contextWindow: 200000, maxOutput: 16384 },
      { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Hermes 3 405B', description: 'Advanced open weights agent', contextWindow: 131072, maxOutput: 8192 },
      { id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', name: 'Hermes 2 Mixtral', description: 'Fast Hermes agent', contextWindow: 32768, maxOutput: 8192 },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: 'Search',
    description: 'DeepSeek V3/R1. Very competitive pricing.',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    keyPrefix: ['sk-'],
    keyPlaceholder: 'sk-...',
    defaultModel: 'deepseek-chat',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', description: 'General purpose', contextWindow: 131072, maxOutput: 8192 },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'Reasoning model', contextWindow: 131072, maxOutput: 8192 },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    icon: 'Server',
    description: 'Open-source models. $25 free credit.',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    keyPrefix: [''],
    keyPlaceholder: 'Your Together API key',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', description: 'Fast inference', contextWindow: 131072, maxOutput: 8192 },
      { id: 'meta-llama/Llama-3.3-8B-Instruct-Turbo', name: 'Llama 3.3 8B Turbo', description: 'Fastest', contextWindow: 131072, maxOutput: 8192 },
    ],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    icon: 'Flame',
    description: 'Fast open-source model hosting.',
    docsUrl: 'https://fireworks.ai/api-keys',
    keyPrefix: ['fw_'],
    keyPlaceholder: 'fw_...',
    defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B', description: 'Fireworks fast', contextWindow: 131072, maxOutput: 8192 },
      { id: 'accounts/fireworks/models/llama-v3p1-8b-instruct', name: 'Llama 3.1 8B', description: 'Ultra fast', contextWindow: 131072, maxOutput: 8192 },
    ],
  },
];

export function getByokProvider(id: ByokProviderId): ByokProviderConfig | undefined {
  return BYOK_PROVIDERS.find(p => p.id === id);
}

export function isValidKeyForProvider(providerId: ByokProviderId, key: string): boolean {
  const provider = getByokProvider(providerId);
  if (!provider) return false;
  if (provider.keyPrefix.length === 0 || provider.keyPrefix[0] === '') return key.length > 10;
  return provider.keyPrefix.some(prefix => key.startsWith(prefix));
}
