---
description: Configure HUD display options (layout, bar style, emoji mode, presets, display elements)
allowed-tools: Read, Write, AskUserQuestion
---

# Configure hud-craft

**FIRST**: Use the Read tool to load `~/.claude/plugins/hud-craft/config.json` if it exists.

Store current values and note whether config exists (determines which flow to use).

## Always On (Core Features)

These are always enabled and NOT configurable:
- Model name `[Opus]`
- Context bar (style configurable)

---

## Two Flows Based on Config State

### Flow A: New User (no config)
Questions: **Bar Style → Layout → Preset → Turn Off/On**

### Flow B: Update Config (config exists)
Questions: **Bar Style → Turn Off → Turn On → Layout/Reset**

---

## Flow A: New User (4 Questions)

### Q1: Bar Style
- header: "Bar Style"
- question: "Choose your progress bar style:"
- multiSelect: false
- options (with markdown previews):
  - "Block (Default)" - Classic block characters
    Preview: `████░░░░░░ 45%`
  - "Segment" - Parallelogram segments
    Preview: `▰▰▰▰▱▱▱▱▱▱ 45%`
  - "Dot" - Filled/empty circles
    Preview: `●●●●○○○○○○ 45%`
  - "ASCII" - Plain ASCII characters
    Preview: `####------ 45%`

### Q2: Layout
- header: "Layout"
- question: "Choose your HUD layout:"
- multiSelect: false
- options:
  - "Expanded (Recommended)" - Split into semantic lines (identity, project, environment, usage)
  - "Compact" - Everything on one line
  - "Compact + Separators" - One line with separator before activity

### Q3: Preset
- header: "Preset"
- question: "Choose a starting configuration:"
- multiSelect: false
- options:
  - "Full" - Everything enabled (Recommended)
  - "Essential" - Activity + git, minimal info
  - "Minimal" - Core only (model, context bar)

### Q4: Emoji Mode
- header: "Emoji Mode"
- question: "How much emoji decoration?"
- multiSelect: false
- options:
  - "Minimal (Recommended)" - Status indicators only (checkmarks, spinners)
  - "Full" - Rich emoji labels on context, usage, git, duration
  - "None" - No emoji, text-only indicators

---

## Flow B: Update Config (4 Questions)

### Q1: Bar Style
- header: "Bar Style"
- question: "Change bar style? (currently: {current_style})"
- multiSelect: false
- options (with markdown previews):
  - "Keep current" - No change
  - "Block" - `████░░░░░░`
  - "Segment" - `▰▰▰▰▱▱▱▱▱▱`
  - "Dot" - `●●●●○○○○○○`

### Q2: Turn Off
- header: "Turn Off"
- question: "What do you want to DISABLE? (currently enabled)"
- multiSelect: true
- options: **ONLY items currently ON** (max 4)

### Q3: Turn On
- header: "Turn On"
- question: "What do you want to ENABLE? (currently disabled)"
- multiSelect: true
- options: **ONLY items currently OFF** (max 4)

### Q4: Layout/Reset
- header: "Layout/Reset"
- question: "Change layout or reset to preset?"
- multiSelect: false
- options:
  - "Keep current" - No changes
  - "Switch to Expanded" (if not current)
  - "Switch to Compact" (if not current)
  - "Reset to Full" - Enable everything

---

## Bar Style Mapping

| Option | Config |
|--------|--------|
| Block | `barStyle: "block"` |
| Segment | `barStyle: "segment"` |
| Dot | `barStyle: "dot"` |
| ASCII | `barStyle: "ascii"` |

## Emoji Mode Mapping

| Option | Config |
|--------|--------|
| Full | `emojiMode: "full"` |
| Minimal | `emojiMode: "minimal"` |
| None | `emojiMode: "none"` |

## Preset Definitions

**Full** (everything ON):
- Activity: Tools ON, Agents ON, Todos ON
- Info: Counts ON, Tokens ON, Usage ON, Duration ON
- Git: ON (with dirty indicator, no ahead/behind)

**Essential** (activity + git):
- Activity: Tools ON, Agents ON, Todos ON
- Info: Counts OFF, Tokens OFF, Usage OFF, Duration ON
- Git: ON (with dirty indicator)

**Minimal** (core only):
- Activity: Tools OFF, Agents OFF, Todos OFF
- Info: Counts OFF, Tokens OFF, Usage OFF, Duration OFF
- Git: ON (with dirty indicator)

---

## Layout Mapping

| Option | Config |
|--------|--------|
| Expanded | `lineLayout: "expanded", showSeparators: false` |
| Compact | `lineLayout: "compact", showSeparators: false` |
| Compact + Separators | `lineLayout: "compact", showSeparators: true` |

---

## Element Mapping

| Element | Config Key |
|---------|------------|
| Tools activity | `display.showTools` |
| Agents status | `display.showAgents` |
| Todo progress | `display.showTodos` |
| Git status | `gitStatus.enabled` |
| Config counts | `display.showConfigCounts` |
| Token breakdown | `display.showTokenBreakdown` |
| Output speed | `display.showSpeed` |
| Usage limits | `display.showUsage` |
| Usage bar style | `display.usageBarEnabled` |
| Session duration | `display.showDuration` |

**Always true (not configurable):**
- `display.showModel: true`
- `display.showContextBar: true`

---

## Processing Logic

### For New Users (Flow A):
1. Apply bar style selection
2. Apply emoji mode selection
3. Apply chosen preset as base
4. Apply chosen layout

### For Returning Users (Flow B):
1. Start from current config
2. Apply bar style change (if not "Keep current")
3. Apply Turn Off selections
4. Apply Turn On selections
5. If layout/reset selected, apply it

---

## Before Writing - Validate & Preview

**GUARDS - Do NOT write config if:**
- User cancels (Esc) - say "Configuration cancelled."
- No changes from current config - say "No changes needed - config unchanged."

**Show preview before saving:**

1. **Summary of changes**
2. **Preview of HUD output**
3. **Confirm**: "Save these changes?"

---

## Write Configuration

Write to `~/.claude/plugins/hud-craft/config.json`.

Merge with existing config, preserving:
- `pathLevels` (not in configure flow)
- `display.usageThreshold` (advanced config)
- `display.environmentThreshold` (advanced config)

---

## After Writing

Say: "Configuration saved! The HUD will reflect your changes immediately."
