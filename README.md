# hud-craft

Customizable statusline HUD for [Claude Code](https://claude.com/claude-code). Configure bar styles, emoji modes, and display options — all from a single `config.json`.

## Features

- **4 Bar Styles** — Block, Segment, Dot, ASCII
- **3 Emoji Modes** — Full, Minimal, None
- **Configurable Width** — 4 to 20 characters
- **Two Layouts** — Expanded (multi-line) or Compact (single line)
- **Interactive Setup** — `/hud-craft:configure` walks you through every option
- **Zero Config Required** — Works out of the box with sensible defaults

## Bar Styles

```
block:   ████░░░░░░ 45%    (default)
segment: ▰▰▰▰▱▱▱▱▱▱ 45%
dot:     ●●●●○○○○○○ 45%
ascii:   ####------ 45%
```

## Quick Start

1. Install the plugin:
   ```
   /install hud-craft
   ```

2. Run setup:
   ```
   /hud-craft:setup
   ```

3. Customize (optional):
   ```
   /hud-craft:configure
   ```

## Configuration

All settings live in `~/.claude/plugins/hud-craft/config.json`:

```json
{
  "lineLayout": "expanded",
  "barStyle": "segment",
  "barWidth": 10,
  "emojiMode": "minimal",
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showModel": true,
    "showContextBar": true,
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showDuration": true,
    "showConfigCounts": true,
    "showTokenBreakdown": true,
    "showSpeed": false
  }
}
```

### Config Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `lineLayout` | `"compact"` \| `"expanded"` | `"expanded"` | Single line or multi-line layout |
| `showSeparators` | boolean | `false` | Show separator line before activity |
| `pathLevels` | 1-3 | `1` | Directory depth in project path |
| `barStyle` | `"block"` \| `"segment"` \| `"dot"` \| `"ascii"` | `"block"` | Progress bar character style |
| `barWidth` | 4-20 | `10` | Number of bar characters |
| `emojiMode` | `"full"` \| `"minimal"` \| `"none"` | `"minimal"` | Emoji decoration level |

### Display Toggles

| Key | Default | What it shows |
|-----|---------|--------------|
| `showModel` | `true` | `[Opus \| Max]` model bracket |
| `showContextBar` | `true` | Visual progress bar for context |
| `showUsage` | `true` | API usage percentages |
| `usageBarEnabled` | `true` | Bar vs text for usage display |
| `showTools` | `false` | Running/completed tool activity |
| `showAgents` | `false` | Subagent status |
| `showTodos` | `false` | Todo progress |
| `showDuration` | `false` | Session timer |
| `showConfigCounts` | `false` | CLAUDE.md, rules, MCPs, hooks counts |
| `showTokenBreakdown` | `true` | Token details at high context (>85%) |
| `showSpeed` | `false` | Output tokens per second |

## Output Examples

### Expanded Layout (default)
```
[Opus | Max] | my-project git:(main*)
Context ████░░░░░░ 45% | Usage ██░░░░░░░░ 19% (2h 30m / 5h)
```

### Compact Layout
```
[Opus | Max] ████░░░░░░ 45% | my-project git:(main*) | ██░░░░░░░░ 19% | 5m
```

### With Activity Lines
```
[Opus | Max] | my-project git:(main*)
Context ▰▰▰▰▱▱▱▱▱▱ 45% | Usage ▰▰▱▱▱▱▱▱▱▱ 19%
◐ Edit: auth.ts | ✓ Read x3
▸ Fix authentication bug (2/5)
```

## Development

```bash
npm ci                # Install dependencies
npm run build         # Build TypeScript
npm test              # Run tests
npm run dev           # Watch mode
```

### Testing with stdin

```bash
echo '{"model":{"display_name":"Opus"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000}}' | node dist/index.js
```

## Credits

Based on [claude-hud](https://github.com/jarrodwatts/claude-hud) by [Jarrod Watts](https://github.com/jarrodwatts). Licensed under MIT.

## License

[MIT](LICENSE)
