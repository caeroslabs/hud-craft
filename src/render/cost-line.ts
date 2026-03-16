import type { RenderContext } from '../types.js';
import { dim } from './colors.js';

// Claude API 가격표 (USD per 1M tokens, 2025년 기준)
const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'opus':   { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'sonnet': { input: 3,  output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'haiku':  { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
};

function getModelTier(modelName: string): string {
  const lower = modelName.toLowerCase();
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('haiku')) return 'haiku';
  return 'sonnet'; // default
}

export function renderCostLine(ctx: RenderContext): string | null {
  const usage = ctx.stdin.context_window?.current_usage;
  if (!usage) return null;

  const modelName = ctx.stdin.model?.display_name ?? ctx.stdin.model?.id ?? 'sonnet';
  const tier = getModelTier(modelName);
  const prices = PRICING[tier];

  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;

  // 캐시 히트된 토큰은 input에서 제외 (이미 cache로 청구)
  const pureInput = Math.max(0, inputTokens - cacheRead - cacheWrite);

  const cost = (pureInput * prices.input + outputTokens * prices.output
    + cacheRead * prices.cacheRead + cacheWrite * prices.cacheWrite) / 1_000_000;

  if (cost < 0.001) return null; // 0.1센트 미만이면 표시 안 함

  const costStr = cost < 0.01 ? `$${cost.toFixed(4)}`
    : cost < 1 ? `$${cost.toFixed(3)}`
    : `$${cost.toFixed(2)}`;

  return `\u{1F4B0} ${dim(costStr)}`;
}
