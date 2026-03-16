---
description: Configure HUD display options — bar style, emoji mode, layout, git, and every display toggle
allowed-tools: Read, Write, AskUserQuestion
---

# Configure hud-craft

**FIRST**: Use the Read tool to load `~/.claude/plugins/hud-craft/config.json` if it exists.

Store current values and note whether config exists (determines which flow to use).

## Two Flows

### Flow A: New User (no config file)
Run all 3 rounds sequentially with defaults.

### Flow B: Returning User (config exists)
Run all 3 rounds, showing current values in each question.

---

## Round 1: Visual Style (4 Questions)

### Q1: Bar Style
- header: "Bar Style"
- question: "바 스타일을 선택하세요:" (returning: "바 스타일을 변경하시겠습니까? (현재: {current})")
- multiSelect: false
- options (with markdown previews):
  - "Block (Default)" — `████░░░░░░ 45%`
  - "Segment" — `▰▰▰▰▱▱▱▱▱▱ 45%`
  - "Dot" — `●●●●○○○○○○ 45%`
  - "ASCII" — `####------ 45%`
- For returning users, add "Keep current" as first option

### Q2: Bar Width
- header: "Bar Width"
- question: "바 너비를 선택하세요:" (returning: "바 너비를 변경하시겠습니까? (현재: {current})")
- multiSelect: false
- options:
  - "6칸 (Compact)" — Narrow display
  - "8칸" — Medium compact
  - "10칸 (Default)" — Standard width
  - "12칸 (Wide)" — Wider display
- For returning users, add "Keep current" as first option

### Q3: Emoji Mode
- header: "Emoji"
- question: "이모지 모드를 선택하세요:" (returning: "이모지 모드를 변경하시겠습니까? (현재: {current})")
- multiSelect: false
- options:
  - "Minimal (Recommended)" — Status indicators only (✓ ◐ ⏱️ ⚠)
  - "Full" — Rich labels on context, usage, git, duration
  - "None" — Text only, no emoji/symbols
- For returning users, add "Keep current" as first option

### Q4: Layout
- header: "Layout"
- question: "레이아웃을 선택하세요:" (returning: "레이아웃을 변경하시겠습니까? (현재: {current})")
- multiSelect: false
- options:
  - "Expanded (Recommended)" — Multi-line: project, context+usage, environment, activity on separate lines
  - "Compact" — Single line with all info condensed
  - "Compact + Separators" — Single line with separator before activity
- For returning users, add "Keep current" as first option

---

## Round 2: Display Content (4 Questions)

### Q5: Project Line
- header: "Project"
- question: "프로젝트 라인에 표시할 항목을 선택하세요:"
- multiSelect: true
- options (show current state for returning users):
  - "Model name [Opus | Max]" — `display.showModel` (default: ON)
  - "Context bar" — `display.showContextBar` (default: ON)
  - "Context value: tokens" — `display.contextValue: "tokens"` instead of percent (default: OFF = percent mode)
  - "Path depth: 2-3" — `pathLevels: 2 or 3` (default: OFF = 1 level)

### Q6: Git Status
- header: "Git"
- question: "Git 상태 표시 항목을 선택하세요:"
- multiSelect: true
- options (show current state for returning users):
  - "Branch name + dirty (*)" — `gitStatus.enabled` + `gitStatus.showDirty` (default: ON)
  - "Ahead/Behind (↑2 ↓1)" — `gitStatus.showAheadBehind` (default: OFF)
  - "File stats (+3 ~2 -1)" — `gitStatus.showFileStats` (default: OFF)
- If user selects nothing, git is disabled entirely

### Q7: Activity Lines
- header: "Activity"
- question: "활동 라인에 표시할 항목을 선택하세요:"
- multiSelect: true
- options (show current state for returning users):
  - "Tool activity (✓ Read ×3, ◐ Edit)" — `display.showTools` (default: ON)
  - "Agent status" — `display.showAgents` (default: ON)
  - "Todo progress (▸ 2/5)" — `display.showTodos` (default: ON)
  - "Separators (───)" — `showSeparators` (default: OFF)

### Q8: Info & Stats
- header: "Stats"
- question: "정보/통계 항목을 선택하세요:"
- multiSelect: true
- options (show current state for returning users):
  - "Usage bar (API 사용량 %)" — `display.showUsage` + `display.usageBarEnabled` (default: ON)
  - "Session duration (⏱️ 5m)" — `display.showDuration` (default: ON)
  - "Config counts (CLAUDE.md, MCPs)" — `display.showConfigCounts` (default: ON)
  - "Token breakdown (>85%)" — `display.showTokenBreakdown` (default: ON)

---

## Round 3: Advanced (Optional — 1 Question)

### Q9: Advanced Options
- header: "Advanced"
- question: "고급 옵션을 변경하시겠습니까?"
- multiSelect: false
- options:
  - "Skip (Recommended)" — Keep current advanced settings
  - "Output speed (tok/s)" — Enable `display.showSpeed`
  - "Usage as text only" — Disable `display.usageBarEnabled` (show percentage text without bar)
  - "Autocompact buffer OFF" — Disable `display.autocompactBuffer` (show raw context %)

---

## Bar Style Mapping

| Option | Config |
|--------|--------|
| Block | `barStyle: "block"` |
| Segment | `barStyle: "segment"` |
| Dot | `barStyle: "dot"` |
| ASCII | `barStyle: "ascii"` |

## Bar Width Mapping

| Option | Config |
|--------|--------|
| 6 | `barWidth: 6` |
| 8 | `barWidth: 8` |
| 10 | `barWidth: 10` |
| 12 | `barWidth: 12` |

## Emoji Mode Mapping

| Option | Config |
|--------|--------|
| Full | `emojiMode: "full"` |
| Minimal | `emojiMode: "minimal"` |
| None | `emojiMode: "none"` |

## Layout Mapping

| Option | Config |
|--------|--------|
| Expanded | `lineLayout: "expanded", showSeparators: false` |
| Compact | `lineLayout: "compact", showSeparators: false` |
| Compact + Separators | `lineLayout: "compact", showSeparators: true` |

---

## Preset Definitions (for Flow A Q3 or manual reset)

**Full** (everything ON):
- Activity: Tools ON, Agents ON, Todos ON
- Info: Counts ON, Tokens ON, Usage ON (bar), Duration ON
- Git: ON (branch + dirty, no ahead/behind)
- Speed: OFF

**Essential** (activity + git):
- Activity: Tools ON, Agents ON, Todos ON
- Info: Counts OFF, Tokens OFF, Usage OFF, Duration ON
- Git: ON (branch + dirty)
- Speed: OFF

**Minimal** (core only):
- Activity: Tools OFF, Agents OFF, Todos OFF
- Info: Counts OFF, Tokens OFF, Usage OFF, Duration OFF
- Git: ON (branch + dirty)
- Speed: OFF

---

## Processing Logic

### New Users (Flow A):
1. Apply Round 1 visual selections
2. Apply Round 2 content selections
3. Apply Round 3 advanced selection
4. Generate complete config

### Returning Users (Flow B):
1. Start from current config
2. Apply changes from each Round (skip "Keep current" selections)
3. Preserve advanced settings not shown in the flow (`usageThreshold`, `sevenDayThreshold`, `environmentThreshold`)

---

## Before Writing — Validate & Preview

**GUARDS — Do NOT write config if:**
- User cancels (Esc) — say "설정이 취소되었습니다."
- No changes from current config — say "변경 사항이 없습니다."

**Show preview before saving:**

1. **변경 사항 요약** (list only changed items)
2. **HUD 미리보기** (ASCII preview of expected output)
3. **확인**: "이 설정을 저장하시겠습니까?"

---

## Write Configuration

Write to `~/.claude/plugins/hud-craft/config.json`.

Complete config structure:

```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "pathLevels": 1,
  "barStyle": "block",
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

---

## After Writing

Say: "설정이 저장되었습니다! HUD에 바로 반영됩니다."

If bar style or emoji mode changed, show a brief preview:
```
변경된 바 스타일: ▰▰▰▰▱▱▱▱▱▱ 45%
이모지 모드: minimal (✓ ◐ ⏱️ ⚠)
```
