import { isLimitReached } from '../../types.js';
import { getProviderLabel } from '../../stdin.js';
import { red, yellow, quotaBar } from '../colors.js';
import { formatUsagePercent, formatUsageError, formatFiveHourReset, formatSevenDayReset, formatResetTime } from '../utils.js';
export function renderUsageLine(ctx) {
    const display = ctx.config?.display;
    if (display?.showUsage === false) {
        return null;
    }
    if (!ctx.usageData?.planName) {
        return null;
    }
    if (getProviderLabel(ctx.stdin)) {
        return null;
    }
    const label = '⚡';
    if (ctx.usageData.apiUnavailable) {
        const errorHint = formatUsageError(ctx.usageData.apiError);
        return `${label} ${yellow(`⚠${errorHint}`)}`;
    }
    if (isLimitReached(ctx.usageData)) {
        const resetTime = ctx.usageData.fiveHour === 100
            ? formatResetTime(ctx.usageData.fiveHourResetAt)
            : formatResetTime(ctx.usageData.sevenDayResetAt);
        return `${label} ${red(`⚠ Limit reached${resetTime ? ` (resets ${resetTime})` : ''}`)}`;
    }
    const threshold = display?.usageThreshold ?? 0;
    const fiveHour = ctx.usageData.fiveHour;
    const sevenDay = ctx.usageData.sevenDay;
    const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);
    if (effectiveUsage < threshold) {
        return null;
    }
    const fiveHourDisplay = formatUsagePercent(ctx.usageData.fiveHour);
    const fiveHourReset = formatFiveHourReset(ctx.usageData.fiveHourResetAt);
    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const fiveHourPart = usageBarEnabled
        ? (fiveHourReset
            ? `${quotaBar(fiveHour ?? 0, ctx.config?.barWidth, ctx.config?.barStyle)} ${fiveHourDisplay} (${fiveHourReset})`
            : `${quotaBar(fiveHour ?? 0, ctx.config?.barWidth, ctx.config?.barStyle)} ${fiveHourDisplay}`)
        : (fiveHourReset
            ? `5h: ${fiveHourDisplay} (${fiveHourReset})`
            : `5h: ${fiveHourDisplay}`);
    const sevenDayThreshold = display?.sevenDayThreshold ?? 80;
    if (sevenDay !== null && sevenDay >= sevenDayThreshold) {
        const sevenDayDisplay = formatUsagePercent(sevenDay);
        const sevenDayReset = formatSevenDayReset(ctx.usageData.sevenDayResetAt);
        const sevenDayPart = usageBarEnabled
            ? (sevenDayReset
                ? `${quotaBar(sevenDay, ctx.config?.barWidth, ctx.config?.barStyle)} ${sevenDayDisplay} (${sevenDayReset})`
                : `${quotaBar(sevenDay, ctx.config?.barWidth, ctx.config?.barStyle)} ${sevenDayDisplay}`)
            : `7d: ${sevenDayDisplay}`;
        return `${label} ${fiveHourPart} · ${sevenDayPart}`;
    }
    return `${label} ${fiveHourPart}`;
}
//# sourceMappingURL=usage.js.map