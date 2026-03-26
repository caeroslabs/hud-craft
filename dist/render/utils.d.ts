import type { RenderContext } from '../types.js';
export declare function formatTokens(n: number): string;
export declare function formatContextValue(ctx: RenderContext, percent: number, mode: 'percent' | 'tokens' | 'remaining'): string;
export declare function formatUsagePercent(percent: number | null): string;
export declare function formatContextPercent(percent: number | null): string;
export declare function formatUsageError(error?: string): string;
export declare function formatResetTime(resetAt: Date | null): string;
export declare function formatLocalTime(date: Date): string;
export declare function formatLocalDateTime(date: Date): string;
export declare function formatFiveHourReset(resetAt: Date | null): string;
export declare function formatSevenDayReset(resetAt: Date | null): string;
import type { HudConfig } from '../config.js';
import type { GitStatus } from '../git.js';
export interface GitRenderConfig {
    gitConfig?: HudConfig['gitStatus'];
    gitStatus: GitStatus | null;
}
export declare function buildGitParts(gitStatus: GitStatus, gitConfig?: HudConfig['gitStatus']): string[];
//# sourceMappingURL=utils.d.ts.map