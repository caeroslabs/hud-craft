import { getTotalTokens } from '../stdin.js';
import { dim, getContextColor, getQuotaColor, RESET } from './colors.js';
// ─── 토큰 포매팅 ────────────────────────────────────────────────────
export function formatTokens(n) {
    if (n >= 1000000) {
        return `${(n / 1000000).toFixed(1)}M`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(0)}k`;
    }
    return n.toString();
}
// ─── 컨텍스트 값 포매팅 ─────────────────────────────────────────────
export function formatContextValue(ctx, percent, mode) {
    if (mode === 'tokens') {
        const totalTokens = getTotalTokens(ctx.stdin);
        const size = ctx.stdin.context_window?.context_window_size ?? 0;
        if (size > 0) {
            return `${formatTokens(totalTokens)}/${formatTokens(size)}`;
        }
        return formatTokens(totalTokens);
    }
    if (mode === 'remaining') {
        const totalTokens = getTotalTokens(ctx.stdin);
        const size = ctx.stdin.context_window?.context_window_size ?? 0;
        const remaining = Math.max(0, size - totalTokens);
        return `${formatTokens(remaining)} left`;
    }
    return `${percent}%`;
}
// ─── 사용량 퍼센트 포매팅 ───────────────────────────────────────────
export function formatUsagePercent(percent) {
    if (percent === null) {
        return dim('--');
    }
    const color = getQuotaColor(percent);
    return `${color}${percent}%${RESET}`;
}
// ─── 컨텍스트 퍼센트 포매팅 (session-line용) ─────────────────────────
export function formatContextPercent(percent) {
    if (percent === null) {
        return dim('--');
    }
    const color = getContextColor(percent);
    return `${color}${percent}%${RESET}`;
}
// ─── 에러 포매팅 ────────────────────────────────────────────────────
export function formatUsageError(error) {
    if (!error)
        return '';
    if (error.startsWith('http-')) {
        return ` (${error.slice(5)})`;
    }
    return ` (${error})`;
}
// ─── 리셋 시간 포매팅 ────────────────────────────────────────────────
export function formatResetTime(resetAt) {
    if (!resetAt)
        return '';
    const now = new Date();
    const diffMs = resetAt.getTime() - now.getTime();
    if (diffMs <= 0)
        return '';
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60)
        return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
export function formatLocalTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function formatLocalDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function formatFiveHourReset(resetAt) {
    if (!resetAt)
        return '';
    if (resetAt.getTime() - Date.now() <= 0)
        return '';
    return formatLocalTime(resetAt);
}
export function formatSevenDayReset(resetAt) {
    if (!resetAt)
        return '';
    if (resetAt.getTime() - Date.now() <= 0)
        return '';
    return formatLocalDateTime(resetAt);
}
export function buildGitParts(gitStatus, gitConfig) {
    const gitParts = [gitStatus.branch];
    if ((gitConfig?.showDirty ?? true) && gitStatus.isDirty) {
        gitParts.push('*');
    }
    if (gitConfig?.showAheadBehind) {
        if (gitStatus.ahead > 0) {
            gitParts.push(` ↑${gitStatus.ahead}`);
        }
        if (gitStatus.behind > 0) {
            gitParts.push(` ↓${gitStatus.behind}`);
        }
    }
    if (gitConfig?.showFileStats && gitStatus.fileStats) {
        const { modified, added, deleted, untracked } = gitStatus.fileStats;
        const statParts = [];
        if (modified > 0)
            statParts.push(`!${modified}`);
        if (added > 0)
            statParts.push(`+${added}`);
        if (deleted > 0)
            statParts.push(`✘${deleted}`);
        if (untracked > 0)
            statParts.push(`?${untracked}`);
        if (statParts.length > 0) {
            gitParts.push(` ${statParts.join(' ')}`);
        }
    }
    return gitParts;
}
//# sourceMappingURL=utils.js.map