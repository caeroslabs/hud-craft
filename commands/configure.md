---
description: Configure HUD display options — pick a theme or customize everything
allowed-tools: Read, Write, AskUserQuestion
---

# Configure hud-craft

**FIRST**: Use the Read tool to load `~/.claude/plugins/hud-craft/config.json` if it exists.

Store current values and note whether config exists.

---

## Q1: Theme Selection (Always First)

- header: "Theme"
- question: "Choose a theme for your HUD:"
- multiSelect: false
- options (with markdown previews):

  1. **Default (Recommended)**
     - description: "Segment bars, full emoji, all features ON"
     - markdown preview:
       ```
       [Opus 4 | Max] · my-project git:(main*) · ⏱️ 12m
       ⚡ ▰▰▰▱▱▱ 52% · 🧠 34%
       🔌 context7 · scrapling · 🪝 3 hooks · 📋 2 CLAUDE.md
       ✏️ Edit ×2 · 📖 Read ×5
       ```

  2. **Powerline**
     - description: "Segment bars wide, full emoji, all features ON"
     - markdown preview:
       ```
       [Opus 4 | Max] · my-project git:(main*) · ⏱️ 12m
       ⚡ ▰▰▰▰▰▱▱▱▱▱ 52% · 🧠 34%
       🔌 context7 · scrapling · 🪝 3 hooks · 📋 2 CLAUDE.md
       ✏️ Edit ×2 · 📖 Read ×5
       ```

  3. **Clean**
     - description: "Dot bars, no emoji, essentials only"
     - markdown preview:
       ```
       [Opus 4 | Max] · my-project git:(main*) · 12m
       ●●●●●○○○○○ 52% · 34%
       ```

  4. **Hacker**
     - description: "ASCII bars, compact, minimal display"
     - markdown preview:
       ```
       [Opus 4 | Max] ####---- 52% · my-project git:(main*)
       ────────────────────────────
       Edit ×2 · Read ×5
       ```

  5. **Custom**
     - description: "Configure everything step by step"

---

## Theme → Config Mapping

### Default Theme
```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "barStyle": "segment",
  "barWidth": 6,
  "emojiMode": "full",
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showModel": true,
    "showContextBar": true,
    "contextValue": "percent",
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showDuration": true,
    "showConfigCounts": true,
    "showTokenBreakdown": true,
    "showSpeed": false,
    "autocompactBuffer": "enabled"
  }
}
```

### Powerline Theme
Same as Default, except:
- `barWidth`: `10`

### Clean Theme
Same as Default, except:
- `barStyle`: `"dot"`
- `emojiMode`: `"none"`
- `display.showTools`: `false`
- `display.showAgents`: `false`
- `display.showTodos`: `false`
- `display.showConfigCounts`: `false`

### Hacker Theme
Same as Default, except:
- `lineLayout`: `"compact"`
- `showSeparators`: `true`
- `barStyle`: `"ascii"`
- `barWidth`: `8`
- `emojiMode`: `"none"`
- `display.showAgents`: `false`
- `display.showTodos`: `false`
- `display.showConfigCounts`: `false`
- `display.showDuration`: `false`
- `display.showUsage`: `false`

---

## If Theme is NOT Custom → Apply & Done

1. Build the full config JSON from the theme mapping above
2. If returning user: merge with existing config, preserving advanced settings (`pathLevels`, `usageThreshold`, `sevenDayThreshold`, `environmentThreshold`)
3. Write to `~/.claude/plugins/hud-craft/config.json`
4. Show confirmation:

```
Theme "{name}" applied!

Preview:
{theme preview from Q1}

Settings saved to ~/.claude/plugins/hud-craft/config.json
HUD will reflect changes immediately.
```

5. **Done. Do NOT ask more questions.**

---

## If Custom → Round 1-3 Detail Flow

When user selects "Custom", proceed with detailed configuration.
For returning users, use current config values as defaults.

### Round 1: Visual Style (4 Questions)

#### Q2: Bar Style
- header: "Bar Style"
- question: "Choose bar style:"
- multiSelect: false
- options (with markdown previews):
  - "Block (Default)" — `████░░░░░░ 45%`
  - "Segment" — `▰▰▰▰▱▱▱▱▱▱ 45%`
  - "Dot" — `●●●●○○○○○○ 45%`
  - "ASCII" — `####------ 45%`
- For returning users, add "Keep current ({current})" as first option

#### Q3: Bar Width
- header: "Bar Width"
- question: "Choose bar width:"
- multiSelect: false
- options:
  - "6 (Compact)" — Narrow display
  - "8" — Medium compact
  - "10 (Default)" — Standard width
  - "12 (Wide)" — Wider display
- For returning users, add "Keep current ({current})" as first option

#### Q4: Emoji Mode
- header: "Emoji"
- question: "Choose emoji mode:"
- multiSelect: false
- options:
  - "Minimal (Recommended)" — Status indicators only (✓ ◐ ⏱️ ⚠)
  - "Full" — Rich labels on context, usage, git, duration
  - "None" — Text only, no emoji/symbols
- For returning users, add "Keep current ({current})" as first option

#### Q5: Layout
- header: "Layout"
- question: "Choose layout:"
- multiSelect: false
- options:
  - "Expanded (Recommended)" — Multi-line: project, context+usage, environment, activity on separate lines
  - "Compact" — Single line with all info condensed
  - "Compact + Separators" — Single line with separator before activity
- For returning users, add "Keep current ({current})" as first option

---

### Round 2: Display Content (4 Questions)

#### Q6: Project Line
- header: "Project"
- question: "Select project line items:"
- multiSelect: true
- options (show current state for returning users):
  - "Model name [Opus | Max]" — `display.showModel` (default: ON)
  - "Context bar" — `display.showContextBar` (default: ON)
  - "Context value: tokens" — `display.contextValue: "tokens"` instead of percent (default: OFF = percent mode)
  - "Path depth: 2-3" — `pathLevels: 2 or 3` (default: OFF = 1 level)

#### Q7: Git Status
- header: "Git"
- question: "Select git status items:"
- multiSelect: true
- options (show current state for returning users):
  - "Branch name + dirty (*)" — `gitStatus.enabled` + `gitStatus.showDirty` (default: ON)
  - "Ahead/Behind (↑2 ↓1)" — `gitStatus.showAheadBehind` (default: OFF)
  - "File stats (+3 ~2 -1)" — `gitStatus.showFileStats` (default: OFF)
- If user selects nothing, git is disabled entirely

#### Q8: Activity Lines
- header: "Activity"
- question: "Select activity line items:"
- multiSelect: true
- options (show current state for returning users):
  - "Tool activity (✓ Read ×3, ◐ Edit)" — `display.showTools` (default: ON)
  - "Agent status" — `display.showAgents` (default: ON)
  - "Todo progress (▸ 2/5)" — `display.showTodos` (default: ON)
  - "Separators (───)" — `showSeparators` (default: OFF)

#### Q9: Info & Stats
- header: "Stats"
- question: "Select info/stats items:"
- multiSelect: true
- options (show current state for returning users):
  - "Usage bar (API usage %)" — `display.showUsage` + `display.usageBarEnabled` (default: ON)
  - "Session duration (⏱️ 5m)" — `display.showDuration` (default: ON)
  - "Config counts (CLAUDE.md, MCPs)" — `display.showConfigCounts` (default: ON)
  - "Token breakdown (>85%)" — `display.showTokenBreakdown` (default: ON)

---

### Round 3: Advanced (1 Question)

#### Q10: Advanced Options
- header: "Advanced"
- question: "Change advanced options?"
- multiSelect: false
- options:
  - "Skip (Recommended)" — Keep current advanced settings
  - "Output speed (tok/s)" — Enable `display.showSpeed`
  - "Usage as text only" — Disable `display.usageBarEnabled` (show percentage text without bar)
  - "Autocompact buffer OFF" — Disable `display.autocompactBuffer` (show raw context %)

---

## Config Key Mappings

### Bar Style
| Option | Config |
|--------|--------|
| Block | `barStyle: "block"` |
| Segment | `barStyle: "segment"` |
| Dot | `barStyle: "dot"` |
| ASCII | `barStyle: "ascii"` |

### Bar Width
| Option | Config |
|--------|--------|
| 6 | `barWidth: 6` |
| 8 | `barWidth: 8` |
| 10 | `barWidth: 10` |
| 12 | `barWidth: 12` |

### Emoji Mode
| Option | Config |
|--------|--------|
| Full | `emojiMode: "full"` |
| Minimal | `emojiMode: "minimal"` |
| None | `emojiMode: "none"` |

### Layout
| Option | Config |
|--------|--------|
| Expanded | `lineLayout: "expanded", showSeparators: false` |
| Compact | `lineLayout: "compact", showSeparators: false` |
| Compact + Separators | `lineLayout: "compact", showSeparators: true` |

### Display Elements
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

### Theme Selection (Default/Powerline/Clean/Hacker):
1. Build config from theme mapping
2. Merge with existing config (preserve advanced thresholds)
3. Write config
4. Show confirmation + preview
5. **Stop — no more questions**

### Custom Flow:
1. Apply Round 1 visual selections (or keep current for returning users)
2. Apply Round 2 content selections
3. Apply Round 3 advanced selection
4. Generate complete config
5. For returning users: preserve `usageThreshold`, `sevenDayThreshold`, `environmentThreshold`

---

## Before Writing (Custom flow only) — Validate & Preview

**GUARDS — Do NOT write config if:**
- User cancels (Esc) — say "Configuration cancelled."
- No changes from current config — say "No changes needed."

**Show preview before saving:**

1. **Changes summary** (list only changed items)
2. **HUD preview** (ASCII preview of expected output with chosen bar style)
3. **Confirm**: "Save these settings?"

---

## Write Configuration

Write to `~/.claude/plugins/hud-craft/config.json`.

Complete config structure:

```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "barStyle": "segment",
  "barWidth": 6,
  "emojiMode": "full",
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showModel": true,
    "showContextBar": true,
    "contextValue": "percent",
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showDuration": true,
    "showConfigCounts": true,
    "showTokenBreakdown": true,
    "showSpeed": false,
    "showCost": false,
    "showThinking": true,
    "autocompactBuffer": "enabled"
  }
}
```

---

## After Writing

Say: "Settings saved! HUD will reflect changes immediately."

If bar style or emoji mode changed, show a brief preview:
```
Bar style: ▰▰▰▰▱▱▱▱▱▱ 45%
Emoji mode: minimal (✓ ◐ ⏱️ ⚠)
```
