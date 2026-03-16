export const RESET = '\x1b[0m';
// 기본 ANSI 색상 (변경 불가 상수)
const DEFAULT_DIM = '\x1b[2m';
const DEFAULT_RED = '\x1b[31m';
const DEFAULT_GREEN = '\x1b[32m';
const DEFAULT_YELLOW = '\x1b[33m';
const DEFAULT_MAGENTA = '\x1b[35m';
const DEFAULT_CYAN = '\x1b[36m';
// 하위 호환용 별칭
const DIM = DEFAULT_DIM;
const RED = DEFAULT_RED;
const GREEN = DEFAULT_GREEN;
const YELLOW = DEFAULT_YELLOW;
const MAGENTA = DEFAULT_MAGENTA;
const CYAN = DEFAULT_CYAN;
// 커스텀 오버라이드 가능한 색상
let currentColors = {};
export function applyCustomColors(colors) {
    currentColors = colors;
}
export const BAR_PRESETS = {
    block: { filled: '█', empty: '░' },
    segment: { filled: '▰', empty: '▱' },
    dot: { filled: '●', empty: '○' },
    ascii: { filled: '#', empty: '-' },
};
export function green(text) {
    return `${GREEN}${text}${RESET}`;
}
export function yellow(text) {
    return `${YELLOW}${text}${RESET}`;
}
export function red(text) {
    return `${RED}${text}${RESET}`;
}
export function cyan(text) {
    return `${CYAN}${text}${RESET}`;
}
export function magenta(text) {
    return `${MAGENTA}${text}${RESET}`;
}
export function dim(text) {
    return `${DIM}${text}${RESET}`;
}
export function getContextColor(percent) {
    if (percent >= 85)
        return currentColors.contextHigh || DEFAULT_RED;
    if (percent >= 70)
        return currentColors.contextMid || DEFAULT_YELLOW;
    return currentColors.contextLow || DEFAULT_GREEN;
}
export function getQuotaColor(percent) {
    if (percent >= 90)
        return currentColors.quotaHigh || DEFAULT_RED;
    if (percent >= 75)
        return currentColors.quotaMid || DEFAULT_YELLOW;
    return currentColors.quotaLow || DEFAULT_GREEN;
}
export function quotaBar(percent, width = 6, style = 'segment') {
    const safeWidth = Number.isFinite(width) ? Math.max(0, Math.round(width)) : 0;
    const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
    const filled = Math.round((safePercent / 100) * safeWidth);
    const empty = safeWidth - filled;
    const color = getQuotaColor(safePercent);
    const chars = BAR_PRESETS[style];
    return `${color}${chars.filled.repeat(filled)}${DIM}${chars.empty.repeat(empty)}${RESET}`;
}
export function coloredBar(percent, width = 6, style = 'segment') {
    const safeWidth = Number.isFinite(width) ? Math.max(0, Math.round(width)) : 0;
    const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
    const filled = Math.round((safePercent / 100) * safeWidth);
    const empty = safeWidth - filled;
    const color = getContextColor(safePercent);
    const chars = BAR_PRESETS[style];
    return `${color}${chars.filled.repeat(filled)}${DIM}${chars.empty.repeat(empty)}${RESET}`;
}
//# sourceMappingURL=colors.js.map