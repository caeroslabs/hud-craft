# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

hud-craft is a customizable Claude Code statusline plugin. It extends the HUD concept with configurable bar styles, emoji modes, and display options - all controlled via a single `config.json`.

## Build Commands

```bash
npm ci               # Install dependencies
npm run build        # Build TypeScript to dist/

# Test with sample stdin data
echo '{"model":{"display_name":"Opus"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000}}' | node dist/index.js
```

## Architecture

### Data Flow

```
Claude Code -> stdin JSON -> parse -> render lines -> stdout -> Claude Code displays
            \-> transcript_path -> parse JSONL -> tools/agents/todos
```

**Key insight**: The statusline is invoked every ~300ms by Claude Code. Each invocation:
1. Receives JSON via stdin (model, context, tokens)
2. Parses the transcript JSONL file for tools, agents, and todos
3. Renders multi-line output to stdout
4. Claude Code displays all lines

### Customization System

All visual customization is driven by `~/.claude/plugins/hud-craft/config.json`:

- **barStyle**: `block` | `segment` | `dot` | `ascii` - progress bar characters
- **barWidth**: 4-20 - bar character count
- **emojiMode**: `full` | `minimal` | `none` - emoji decoration level
- **lineLayout**: `compact` | `expanded` - single-line or multi-line
- Plus all display toggles (tools, agents, todos, usage, duration, etc.)

### File Structure

```
src/
|-- index.ts           # Entry point
|-- stdin.ts           # Parse Claude's JSON input
|-- transcript.ts      # Parse transcript JSONL
|-- config-reader.ts   # Read MCP/rules configs
|-- config.ts          # Load/validate user config (BarStyle, EmojiMode, barWidth)
|-- git.ts             # Git status (branch, dirty, ahead/behind)
|-- usage-api.ts       # Fetch usage from Anthropic API
|-- types.ts           # TypeScript interfaces
|-- speed-tracker.ts   # Output speed tracking
|-- extra-cmd.ts       # Custom command support
|-- debug.ts           # Debug logging
+-- render/
    |-- index.ts       # Main render coordinator
    |-- session-line.ts   # Compact mode: single line
    |-- tools-line.ts     # Tool activity
    |-- agents-line.ts    # Agent status
    |-- todos-line.ts     # Todo progress
    |-- colors.ts         # ANSI colors + BAR_PRESETS
    |-- emojis.ts         # Emoji mode system
    +-- lines/
        |-- index.ts      # Barrel export
        |-- project.ts    # Model + project + git
        |-- identity.ts   # Context bar
        |-- usage.ts      # Usage bar
        +-- environment.ts # Config counts
```

### Bar Style Presets (colors.ts)

```
block:   ████░░░░░░  (default)
segment: ▰▰▰▰▱▱▱▱▱▱
dot:     ●●●●○○○○○○
ascii:   ####------
```

### Emoji Modes (emojis.ts)

| Key | full | minimal | none |
|-----|------|---------|------|
| tools_running | spinner | spinner | (empty) |
| tools_done | checkmark | checkmark | (empty) |
| duration | timer | timer | (empty) |
| warning | warning | warning | ! |

### Context Thresholds

| Threshold | Color | Action |
|-----------|-------|--------|
| <70% | Green | Normal |
| 70-85% | Yellow | Warning |
| >85% | Red | Show token breakdown |

## Plugin Configuration

Plugin manifest: `.claude-plugin/plugin.json` (metadata only).

StatusLine config goes in `~/.claude/settings.json` via `/hud-craft:setup`.

User preferences go in `~/.claude/plugins/hud-craft/config.json` via `/hud-craft:configure`.

## Dependencies

- **Runtime**: Node.js 18+ or Bun
- **Build**: TypeScript 5, ES2022 target, NodeNext modules
