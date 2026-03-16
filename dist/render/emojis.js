const emojiMap = {
    tools_running: { full: '\u25D0', minimal: '\u25D0', none: '' },
    tools_done: { full: '\u2713', minimal: '\u2713', none: '' },
    agents_running: { full: '\u25D0', minimal: '\u25D0', none: '' },
    agents_done: { full: '\u2713', minimal: '\u2713', none: '' },
    todo_active: { full: '\u25B8', minimal: '\u25B8', none: '>' },
    todo_done: { full: '\u2713', minimal: '\u2713', none: '' },
    duration: { full: '\u23F1\uFE0F ', minimal: '\u23F1\uFE0F ', none: '' },
    warning: { full: '\u26A0', minimal: '\u26A0', none: '!' },
    dirty: { full: '*', minimal: '*', none: '*' },
};
const NO_TRAILING_SPACE = new Set(['dirty']);
export function emoji(key, mode) {
    const entry = emojiMap[key];
    if (!entry)
        return '';
    const value = entry[mode];
    if (!value)
        return '';
    if (NO_TRAILING_SPACE.has(key))
        return value;
    return value + ' ';
}
//# sourceMappingURL=emojis.js.map