---
description: Configure hud-craft as your statusline
allowed-tools: Bash, Read, Edit, AskUserQuestion
---

**Note**: Placeholders like `{RUNTIME_PATH}`, `{SOURCE}`, and `{GENERATED_COMMAND}` should be substituted with actual detected values.

## Step 0: Detect Ghost Installation (Run First)

Check for inconsistent plugin state that can occur after failed installations:

**macOS/Linux**:
```bash
# Check 1: Cache exists?
CACHE_EXISTS=$(ls -d ~/.claude/plugins/cache/hud-craft/hud-craft 2>/dev/null && echo "YES" || echo "NO")

# Check 2: Registry entry exists?
REGISTRY_EXISTS=$(grep -q "hud-craft" ~/.claude/plugins/installed_plugins.json 2>/dev/null && echo "YES" || echo "NO")

# Check 3: Temp files left behind?
TEMP_FILES=$(ls -d ~/.claude/plugins/cache/temp_local_* 2>/dev/null | head -1)

echo "Cache: $CACHE_EXISTS | Registry: $REGISTRY_EXISTS | Temp: ${TEMP_FILES:-none}"
```

**Windows (PowerShell)**:
```powershell
$cache = Test-Path "$env:USERPROFILE\.claude\plugins\cache\hud-craft\hud-craft"
$registry = (Get-Content "$env:USERPROFILE\.claude\plugins\installed_plugins.json" -ErrorAction SilentlyContinue) -match "hud-craft"
$temp = Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\temp_local_*" -ErrorAction SilentlyContinue
Write-Host "Cache: $cache | Registry: $registry | Temp: $($temp.Count) files"
```

### Interpreting Results

| Cache | Registry | Meaning | Action |
|-------|----------|---------|--------|
| YES | YES | Normal install (may still be broken) | Continue to Step 1 |
| YES | NO | Ghost install - cache orphaned | Clean up cache |
| NO | YES | Ghost install - registry stale | Clean up registry |
| NO | NO | Not installed | Continue to Step 1 |

If **temp files exist**, a previous install was interrupted. Clean them up.

### Cleanup Commands

If ghost installation detected, ask user if they want to reset. If yes:

**macOS/Linux**:
```bash
# Remove orphaned cache
rm -rf ~/.claude/plugins/cache/hud-craft

# Remove temp files from failed installs
rm -rf ~/.claude/plugins/cache/temp_local_*

# Reset registry (removes ALL plugins - warn user first!)
# Only run if user confirms they have no other plugins they want to keep:
echo '{"version": 2, "plugins": {}}' > ~/.claude/plugins/installed_plugins.json
```

**Windows (PowerShell)**:
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\cache\hud-craft" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\cache\temp_local_*" -ErrorAction SilentlyContinue
'{"version": 2, "plugins": {}}' | Set-Content "$env:USERPROFILE\.claude\plugins\installed_plugins.json"
```

After cleanup, tell user to **restart Claude Code** and run `/plugin install hud-craft` again.

### Linux: Cross-Device Filesystem Check

**On Linux only**, if install keeps failing, check for EXDEV issue:
```bash
[ "$(df --output=source ~ /tmp 2>/dev/null | tail -2 | uniq | wc -l)" = "2" ] && echo "CROSS_DEVICE"
```

If this outputs `CROSS_DEVICE`, `/tmp` and home are on different filesystems. Workaround:
```bash
mkdir -p ~/.cache/tmp && TMPDIR=~/.cache/tmp claude /plugin install hud-craft
```

---

## Step 1: Detect Platform & Runtime

**IMPORTANT**: Determine the platform from your environment context (`Platform:` value), NOT from `uname -s`.

| Platform | Command Format |
|----------|---------------|
| `darwin` | bash (macOS) |
| `linux` | bash (all Linux distros) |
| `win32` | PowerShell |

---

**macOS/Linux** (Platform: `darwin` or `linux`):

1. Get plugin path:
   ```bash
   ls -td ~/.claude/plugins/cache/hud-craft/hud-craft/*/ 2>/dev/null | head -1
   ```
   If empty, the plugin is not installed. Go back to Step 0.

2. Get runtime absolute path (prefer bun for performance, fallback to node):
   ```bash
   command -v bun 2>/dev/null || command -v node 2>/dev/null
   ```

3. Verify the runtime exists:
   ```bash
   ls -la {RUNTIME_PATH}
   ```

4. Determine source file based on runtime:
   ```bash
   basename {RUNTIME_PATH}
   ```
   If result is "bun", use `src/index.ts`. Otherwise use `dist/index.js`.

5. Generate command:
   ```
   bash -c '"{RUNTIME_PATH}" "$(ls -td ~/.claude/plugins/cache/hud-craft/hud-craft/*/ 2>/dev/null | head -1){SOURCE}"'
   ```

**Windows** (Platform: `win32`):

1. Get plugin path:
   ```powershell
   (Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\hud-craft\hud-craft" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
   ```

2. Get runtime absolute path:
   ```powershell
   if (Get-Command bun -ErrorAction SilentlyContinue) { (Get-Command bun).Source } elseif (Get-Command node -ErrorAction SilentlyContinue) { (Get-Command node).Source } else { Write-Error "Neither bun nor node found" }
   ```

3. Check if runtime is bun. If bun, use `src\index.ts`. Otherwise `dist\index.js`.

4. Generate command:
   ```
   powershell -Command "& {$p=(Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\hud-craft\hud-craft | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; & '{RUNTIME_PATH}' (Join-Path $p '{SOURCE}')}"
   ```

## Step 2: Test Command

Run the generated command. It should produce output within a few seconds.

## Step 3: Apply Configuration

Read settings file and merge in the statusLine config:
- **macOS/Linux**: `~/.claude/settings.json`
- **Windows**: `$env:USERPROFILE\.claude\settings.json`

```json
{
  "statusLine": {
    "type": "command",
    "command": "{GENERATED_COMMAND}"
  }
}
```

## Step 4: Optional Features

After statusLine is applied, ask user about optional HUD features:

Use AskUserQuestion:
- header: "Extras"
- question: "Enable any optional HUD features? (all hidden by default)"
- multiSelect: true
- options:
  - "Tools activity" - Shows running/completed tools
  - "Agents & Todos" - Shows subagent status and todo progress
  - "Session info" - Shows session duration and config counts

If user selects options, write `~/.claude/plugins/hud-craft/config.json`:

| Selection | Config keys |
|-----------|------------|
| Tools activity | `display.showTools: true` |
| Agents & Todos | `display.showAgents: true, display.showTodos: true` |
| Session info | `display.showDuration: true, display.showConfigCounts: true` |

## Step 5: Verify & Finish

Use AskUserQuestion:
- Question: "Setup complete! The HUD should appear below your input field. Is it working?"
- Options: "Yes, it's working" / "No, something's wrong"

**If yes**: Done!

**If no**: Debug systematically:
1. Verify config was applied (check settings.json)
2. Test command manually with error output
3. Check common issues (command not found, plugin not installed, permission denied)
