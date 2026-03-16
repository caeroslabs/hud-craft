const emojiMap = {
    tools_running: { full: '\u25D0', minimal: '\u25D0', none: '', nerd: '\uF013' },
    tools_done: { full: '\u2713', minimal: '\u2713', none: '', nerd: '\uF00C' },
    agents_running: { full: '\u25D0', minimal: '\u25D0', none: '', nerd: '\uF0C0' },
    agents_done: { full: '\u2713', minimal: '\u2713', none: '', nerd: '\uF00C' },
    todo_active: { full: '\u25B8', minimal: '\u25B8', none: '>', nerd: '\uF0AE' },
    todo_done: { full: '\u2713', minimal: '\u2713', none: '', nerd: '\uF00C' },
    duration: { full: '\u23F1\uFE0F ', minimal: '\u23F1\uFE0F ', none: '', nerd: '\uF017 ' },
    warning: { full: '\u26A0', minimal: '\u26A0', none: '!', nerd: '\uF071' },
    dirty: { full: '*', minimal: '*', none: '*', nerd: '\uF12A' },
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