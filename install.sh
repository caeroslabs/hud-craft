#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# hud-craft — Universal Installer
# Customizable statusline HUD for Claude Code
#
# Handles ALL scenarios:
#   - Fresh install (no prior HUD)
#   - Existing claude-hud → migrate config + replace
#   - /install plugin system → detect cache paths + fix
#   - Already has hud-craft → update
#   - Ghost enabledPlugins entries → cleanup
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash
#
# Flags:
#   --uninstall   Remove hud-craft completely
#   --doctor      Diagnose installation issues
#   --force       Skip confirmations, overwrite custom statusLine
#   --verbose     Show detailed debug output
# ──────────────────────────────────────────────────────────────

# ── Constants ─────────────────────────────────────────────────

REPO="https://github.com/caeroslabs/hud-craft.git"
CLAUDE_DIR="$HOME/.claude"
PLUGINS_DIR="$CLAUDE_DIR/plugins"
CACHE_DIR="$PLUGINS_DIR/cache"
MARKET_DIR="$PLUGINS_DIR/marketplaces"
INSTALL_DIR="$MARKET_DIR/hud-craft"
CONFIG_DIR="$PLUGINS_DIR/hud-craft"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
INSTALLED_PLUGINS_FILE="$PLUGINS_DIR/installed_plugins.json"

# claude-hud legacy paths
OLD_CACHE="$CACHE_DIR/claude-hud"
OLD_MARKET="$MARKET_DIR/claude-hud"
OLD_CONFIG_DIR="$PLUGINS_DIR/claude-hud"

# hud-craft alternate paths
HC_CACHE="$CACHE_DIR/hud-craft"

# ── Parse flags ───────────────────────────────────────────────

FLAG_UNINSTALL=false
FLAG_DOCTOR=false
FLAG_FORCE=false
FLAG_VERBOSE=false

for arg in "$@"; do
  case "$arg" in
    --uninstall) FLAG_UNINSTALL=true ;;
    --doctor)    FLAG_DOCTOR=true ;;
    --force)     FLAG_FORCE=true ;;
    --verbose)   FLAG_VERBOSE=true ;;
    --help|-h)
      echo "hud-craft installer — Customizable statusline HUD for Claude Code"
      echo ""
      echo "Usage: curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash"
      echo "       bash install.sh [flags]"
      echo ""
      echo "Flags:"
      echo "  --uninstall   Remove hud-craft completely"
      echo "  --doctor      Diagnose installation issues"
      echo "  --force       Skip confirmations, overwrite existing statusLine"
      echo "  --verbose     Show detailed debug output"
      echo "  --help        Show this help"
      exit 0
      ;;
    *) echo "Unknown flag: $arg (try --help)"; exit 1 ;;
  esac
done

[ "$FLAG_VERBOSE" = true ] && set -x

# ── Colors (auto-detect terminal support) ─────────────────────

if [ -t 1 ] && [ "${TERM:-dumb}" != "dumb" ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' NC=''
fi

info()  { echo -e "${CYAN}[hud-craft]${NC} $*"; }
ok()    { echo -e "${GREEN}[hud-craft]${NC} $*"; }
warn()  { echo -e "${YELLOW}[hud-craft]${NC} $*"; }
fail()  { echo -e "${RED}[hud-craft]${NC} $*"; }
header(){ echo -e "\n${BOLD}${CYAN}── $* ──${NC}"; }

# ── Cleanup trap (remove partial installs on failure) ─────────

CLEANUP_TARGET=""
trap 'rc=$?; if [ $rc -ne 0 ] && [ -n "$CLEANUP_TARGET" ]; then rm -rf "$CLEANUP_TARGET"; warn "Cleaned up partial install"; fi' EXIT

# ── Preflight checks ─────────────────────────────────────────

# Validate HOME
if [ -z "${HOME:-}" ] || [ ! -d "$HOME" ]; then
  fail "\$HOME is not set or not a directory"
  exit 1
fi

# ── Helper: backup settings.json ─────────────────────────────

backup_settings() {
  if [ -f "$SETTINGS_FILE" ]; then
    local bak="${SETTINGS_FILE}.bak"
    cp "$SETTINGS_FILE" "$bak"
    info "Backed up settings.json → settings.json.bak"
  fi
}

# ── Helper: update settings.json with jq ─────────────────────
# Handles enabledPlugins as OBJECT (real format) or array (legacy)

update_settings_jq() {
  local cmd="$1"
  local tmp
  tmp=$(mktemp)

  if [ -f "$SETTINGS_FILE" ]; then
    jq --arg cmd "$cmd" '
      # Set statusLine
      .statusLine = {"type": "command", "command": $cmd}

      # Remove claude-hud/hud-craft from enabledPlugins
      # Handle BOTH object format (real) and array format (legacy)
      | if .enabledPlugins then
          if (.enabledPlugins | type) == "object" then
            .enabledPlugins |= with_entries(
              select(.key | test("claude-hud|hud-craft") | not)
            )
          elif (.enabledPlugins | type) == "array" then
            .enabledPlugins = [
              .enabledPlugins[] | select(tostring | test("claude-hud|hud-craft") | not)
            ]
          else . end
          # Clean up empty enabledPlugins
          | if .enabledPlugins == {} or .enabledPlugins == [] then
              del(.enabledPlugins)
            else . end
        else . end
    ' "$SETTINGS_FILE" > "$tmp" && mv "$tmp" "$SETTINGS_FILE"
  else
    jq -n --arg cmd "$cmd" '{"statusLine": {"type": "command", "command": $cmd}}' > "$SETTINGS_FILE"
  fi
}

# ── Helper: update settings.json with python3 ────────────────

update_settings_python() {
  local cmd="$1"
  _SETTINGS_FILE="$SETTINGS_FILE" _CMD="$cmd" python3 << 'PYEOF'
import json, os, sys, re

settings_file = os.environ["_SETTINGS_FILE"]
cmd = os.environ["_CMD"]

data = {}
if os.path.exists(settings_file):
    with open(settings_file, "r") as f:
        content = f.read().strip()
        if content:
            # Strip single-line comments (// ...) for JSONC compatibility
            lines = []
            for line in content.split("\n"):
                stripped = line.lstrip()
                if not stripped.startswith("//"):
                    # Remove inline // comments (not inside strings — simple heuristic)
                    in_str = False
                    result = []
                    i = 0
                    while i < len(line):
                        c = line[i]
                        if c == '"' and (i == 0 or line[i-1] != '\\'):
                            in_str = not in_str
                        elif c == '/' and i+1 < len(line) and line[i+1] == '/' and not in_str:
                            break
                        result.append(c)
                        i += 1
                    lines.append("".join(result))
                else:
                    lines.append("")
            clean = "\n".join(lines)
            # Remove trailing commas before } or ]
            clean = re.sub(r',\s*([}\]])', r'\1', clean)
            try:
                data = json.loads(clean)
            except json.JSONDecodeError:
                print("[hud-craft] Warning: settings.json parse failed, creating fresh", file=sys.stderr)
                data = {}

# Set statusLine
data["statusLine"] = {"type": "command", "command": cmd}

# Remove claude-hud/hud-craft from enabledPlugins
# Handle BOTH dict (real format) and list (legacy)
ep = data.get("enabledPlugins")
if isinstance(ep, dict):
    data["enabledPlugins"] = {
        k: v for k, v in ep.items()
        if "claude-hud" not in k and "hud-craft" not in k
    }
    if not data["enabledPlugins"]:
        del data["enabledPlugins"]
elif isinstance(ep, list):
    data["enabledPlugins"] = [
        p for p in ep
        if "claude-hud" not in str(p) and "hud-craft" not in str(p)
    ]
    if not data["enabledPlugins"]:
        del data["enabledPlugins"]

with open(settings_file, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PYEOF
}

# ── Helper: remove statusLine from settings.json ─────────────

remove_statusline_jq() {
  local tmp
  tmp=$(mktemp)
  jq 'del(.statusLine)
    | if .enabledPlugins then
        if (.enabledPlugins | type) == "object" then
          .enabledPlugins |= with_entries(
            select(.key | test("hud-craft") | not)
          )
        elif (.enabledPlugins | type) == "array" then
          .enabledPlugins = [
            .enabledPlugins[] | select(tostring | test("hud-craft") | not)
          ]
        else . end
        | if .enabledPlugins == {} or .enabledPlugins == [] then
            del(.enabledPlugins)
          else . end
      else . end
  ' "$SETTINGS_FILE" > "$tmp" && mv "$tmp" "$SETTINGS_FILE"
}

remove_statusline_python() {
  _SETTINGS_FILE="$SETTINGS_FILE" python3 << 'PYEOF'
import json, os

f = os.environ["_SETTINGS_FILE"]
data = {}
if os.path.exists(f):
    with open(f) as fh:
        data = json.load(fh)

data.pop("statusLine", None)

ep = data.get("enabledPlugins")
if isinstance(ep, dict):
    data["enabledPlugins"] = {k: v for k, v in ep.items() if "hud-craft" not in k}
    if not data["enabledPlugins"]:
        del data["enabledPlugins"]
elif isinstance(ep, list):
    data["enabledPlugins"] = [p for p in ep if "hud-craft" not in str(p)]
    if not data["enabledPlugins"]:
        del data["enabledPlugins"]

with open(f, "w") as fh:
    json.dump(data, fh, indent=2)
    fh.write("\n")
PYEOF
}

# ── Helper: clean installed_plugins.json ──────────────────────

clean_installed_plugins() {
  local target="$1"  # "claude-hud" or "hud-craft"
  if [ ! -f "$INSTALLED_PLUGINS_FILE" ]; then return 0; fi

  if command -v jq &>/dev/null; then
    local tmp
    tmp=$(mktemp)
    jq --arg t "$target" '
      if .plugins then
        .plugins |= with_entries(select(.key | test($t) | not))
      else . end
    ' "$INSTALLED_PLUGINS_FILE" > "$tmp" && mv "$tmp" "$INSTALLED_PLUGINS_FILE"
  elif command -v python3 &>/dev/null; then
    _FILE="$INSTALLED_PLUGINS_FILE" _TARGET="$target" python3 << 'PYEOF'
import json, os
f = os.environ["_FILE"]
t = os.environ["_TARGET"]
data = {}
if os.path.exists(f):
    with open(f) as fh:
        data = json.load(fh)
if "plugins" in data and isinstance(data["plugins"], dict):
    data["plugins"] = {k: v for k, v in data["plugins"].items() if t not in k}
with open(f, "w") as fh:
    json.dump(data, fh, indent=2)
    fh.write("\n")
PYEOF
  fi
}

# ══════════════════════════════════════════════════════════════
# ── UNINSTALL MODE ────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════

if [ "$FLAG_UNINSTALL" = true ]; then
  header "Uninstalling hud-craft"

  # Remove install directories
  for dir in "$INSTALL_DIR" "$HC_CACHE"; do
    if [ -d "$dir" ]; then
      rm -rf "$dir"
      ok "Removed $dir"
    fi
  done

  # Remove config
  if [ -d "$CONFIG_DIR" ]; then
    warn "Config directory: $CONFIG_DIR"
    warn "  Remove manually if no longer needed: rm -rf $CONFIG_DIR"
  fi

  # Clean settings.json
  if [ -f "$SETTINGS_FILE" ]; then
    backup_settings
    if command -v jq &>/dev/null; then
      remove_statusline_jq && ok "Removed statusLine from settings.json"
    elif command -v python3 &>/dev/null; then
      remove_statusline_python && ok "Removed statusLine from settings.json"
    else
      warn "Cannot auto-update settings.json — remove statusLine manually"
    fi
  fi

  # Clean installed_plugins.json
  clean_installed_plugins "hud-craft"

  echo ""
  ok "hud-craft uninstalled. Restart Claude Code to apply."
  exit 0
fi

# ══════════════════════════════════════════════════════════════
# ── DOCTOR MODE ───────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════

if [ "$FLAG_DOCTOR" = true ]; then
  header "hud-craft diagnostics"
  ISSUES=0

  # Check install directory
  if [ -d "$INSTALL_DIR" ]; then
    ok "Install dir: $INSTALL_DIR"
  elif [ -d "$HC_CACHE" ]; then
    warn "Installed in cache (non-standard): $HC_CACHE"
  else
    fail "Not installed"; ((ISSUES++)) || true
  fi

  # Check dist/index.js or src/index.ts
  if [ -f "$INSTALL_DIR/dist/index.js" ]; then
    ok "dist/index.js exists"
  elif [ -f "$INSTALL_DIR/src/index.ts" ]; then
    ok "src/index.ts exists (bun mode)"
  else
    fail "No entry point found"; ((ISSUES++)) || true
  fi

  # Check runtime
  if command -v bun &>/dev/null; then
    ok "Runtime: bun $(bun --version 2>/dev/null || echo '?')"
  elif command -v node &>/dev/null; then
    ok "Runtime: node $(node -v 2>/dev/null || echo '?')"
  else
    fail "No runtime (node/bun) found"; ((ISSUES++)) || true
  fi

  # Check settings.json
  if [ -f "$SETTINGS_FILE" ]; then
    if command -v jq &>/dev/null; then
      SL=$(jq -r '.statusLine.command // "not set"' "$SETTINGS_FILE" 2>/dev/null || echo "parse error")
      if echo "$SL" | grep -q "hud-craft"; then
        ok "statusLine points to hud-craft"
      elif echo "$SL" | grep -q "claude-hud"; then
        warn "statusLine still points to claude-hud — run installer to fix"
        ((ISSUES++)) || true
      elif [ "$SL" = "not set" ]; then
        fail "statusLine not configured"; ((ISSUES++)) || true
      else
        warn "statusLine points to: $SL"
      fi

      # Check enabledPlugins for ghost entries
      EP_OLD=$(jq -r '.enabledPlugins // {} | keys[] | select(test("claude-hud"))' "$SETTINGS_FILE" 2>/dev/null || true)
      EP_HC=$(jq -r '.enabledPlugins // {} | keys[] | select(test("hud-craft"))' "$SETTINGS_FILE" 2>/dev/null || true)
      [ -n "$EP_OLD" ] && warn "Ghost enabledPlugins entry: $EP_OLD" && ((ISSUES++)) || true
      [ -n "$EP_HC" ] && warn "Ghost enabledPlugins entry: $EP_HC" && ((ISSUES++)) || true
    else
      info "settings.json exists (install jq for detailed check)"
    fi
  else
    fail "settings.json not found"; ((ISSUES++)) || true
  fi

  # Check config
  if [ -f "$CONFIG_DIR/config.json" ]; then
    ok "Config: $CONFIG_DIR/config.json"
  else
    warn "No config file (defaults will be used)"
  fi

  # Test execution
  if [ -d "$INSTALL_DIR" ]; then
    RUNTIME_CMD=""
    if command -v bun &>/dev/null; then
      RUNTIME_CMD="$(command -v bun) $INSTALL_DIR/src/index.ts"
    elif command -v node &>/dev/null; then
      RUNTIME_CMD="$(command -v node) $INSTALL_DIR/dist/index.js"
    fi
    if [ -n "$RUNTIME_CMD" ]; then
      TEST_JSON='{"model":{"display_name":"Test"},"context_window":{"current_usage":{"input_tokens":1000},"context_window_size":200000}}'
      TEST_OUT=$(echo "$TEST_JSON" | $RUNTIME_CMD 2>&1 || true)
      if [ -n "$TEST_OUT" ]; then
        ok "Execution test passed"
        echo "  $TEST_OUT" | head -3
      else
        fail "Execution test produced no output"; ((ISSUES++)) || true
      fi
    fi
  fi

  # Check old claude-hud remnants
  for dir in "$OLD_CACHE" "$OLD_MARKET" "$OLD_CONFIG_DIR"; do
    [ -d "$dir" ] && warn "Old claude-hud remnant: $dir" && ((ISSUES++)) || true
  done

  echo ""
  if [ "$ISSUES" -eq 0 ]; then
    ok "All checks passed!"
  else
    warn "$ISSUES issue(s) found"
  fi
  exit 0
fi

# ══════════════════════════════════════════════════════════════
# ── INSTALL MODE (default) ────────────────────────────────────
# ══════════════════════════════════════════════════════════════

header "Detecting environment"

# ── Check prerequisites ───────────────────────────────────────

# git is required
if ! command -v git &>/dev/null; then
  fail "git is required but not found"
  fail "  Install: apt install git | brew install git | dnf install git"
  exit 1
fi

# Need jq or python3 for settings.json
if ! command -v jq &>/dev/null && ! command -v python3 &>/dev/null; then
  warn "Neither jq nor python3 found — settings.json must be configured manually"
fi

# ── Detect existing installations ─────────────────────────────

HAS_OLD=false
HAS_HC=false
SCENARIO="fresh"

# Check for claude-hud (any location)
for dir in "$OLD_CACHE" "$OLD_MARKET"; do
  [ -d "$dir" ] && HAS_OLD=true
done

# Check for hud-craft (any location)
for dir in "$HC_CACHE" "$INSTALL_DIR"; do
  [ -d "$dir" ] && HAS_HC=true
done

# Check settings.json for references
STATUSLINE_HAS_OLD=false
STATUSLINE_HAS_HC=false
STATUSLINE_HAS_OTHER=false

if [ -f "$SETTINGS_FILE" ]; then
  SL_CONTENT=$(cat "$SETTINGS_FILE" 2>/dev/null || true)
  echo "$SL_CONTENT" | grep -q "claude-hud" 2>/dev/null && STATUSLINE_HAS_OLD=true || true
  echo "$SL_CONTENT" | grep -q "hud-craft" 2>/dev/null && STATUSLINE_HAS_HC=true || true

  # Check if statusLine points to something entirely different
  if [ "$STATUSLINE_HAS_OLD" = false ] && [ "$STATUSLINE_HAS_HC" = false ]; then
    if echo "$SL_CONTENT" | grep -q '"statusLine"' 2>/dev/null; then
      STATUSLINE_HAS_OTHER=true
    fi
  fi
fi

if [ "$HAS_OLD" = true ] || [ "$STATUSLINE_HAS_OLD" = true ]; then
  SCENARIO="migrate"
  info "Found claude-hud → will migrate to hud-craft"
elif [ "$HAS_HC" = true ]; then
  SCENARIO="update"
  info "Found hud-craft → will update"
else
  info "Fresh install"
fi

# Warn if custom statusLine exists (not claude-hud/hud-craft)
if [ "$STATUSLINE_HAS_OTHER" = true ] && [ "$FLAG_FORCE" = false ]; then
  warn "settings.json has a custom statusLine (not claude-hud/hud-craft)"
  warn "This will be replaced. Use --force to skip this warning."
  # In piped mode (curl | bash) user can't Ctrl+C, so just proceed with warning
  if [ -t 0 ]; then
    warn "Press Enter to continue or Ctrl+C to cancel..."
    read -r < /dev/tty 2>/dev/null || true
  else
    warn "Proceeding (non-interactive mode)..."
  fi
fi

# ── Detect runtime ────────────────────────────────────────────

header "Detecting runtime"

# Source common version managers for non-interactive shells (curl | bash)
for nvm_path in "${NVM_DIR:-$HOME/.nvm}/nvm.sh" "$HOME/.nvm/nvm.sh"; do
  [ -s "$nvm_path" ] && . "$nvm_path" 2>/dev/null && break || true
done
[ -s "$HOME/.bun/_bun" ] && . "$HOME/.bun/_bun" 2>/dev/null || true
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"

RUNTIME=""
SOURCE=""

if command -v bun &>/dev/null; then
  BUN_VER=$(bun --version 2>/dev/null || echo "0")
  BUN_MAJOR=$(echo "$BUN_VER" | cut -d. -f1)
  if [ "$BUN_MAJOR" -ge 1 ] 2>/dev/null; then
    RUNTIME="$(command -v bun)"
    SOURCE="src/index.ts"
    ok "Runtime: bun v$BUN_VER ($RUNTIME)"
  else
    warn "Bun v$BUN_VER too old (need 1.0+), checking node..."
  fi
fi

if [ -z "$RUNTIME" ] && command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -ge 18 ] 2>/dev/null; then
    RUNTIME="$(command -v node)"
    SOURCE="dist/index.js"
    ok "Runtime: node v$(node -v | sed 's/^v//') ($RUNTIME)"
  else
    fail "Node.js 18+ required (found v$NODE_VERSION)"
    exit 1
  fi
fi

if [ -z "$RUNTIME" ]; then
  fail "No compatible runtime found"
  fail "  Node.js 18+: https://nodejs.org/"
  fail "  Bun 1.0+:    https://bun.sh/"
  exit 1
fi

# ── Migrate from claude-hud ──────────────────────────────────

if [ "$SCENARIO" = "migrate" ]; then
  header "Migrating from claude-hud"

  # Migrate config (preserve user preferences)
  if [ -d "$OLD_CONFIG_DIR" ] && [ -f "$OLD_CONFIG_DIR/config.json" ]; then
    mkdir -p "$CONFIG_DIR"
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
      cp "$OLD_CONFIG_DIR/config.json" "$CONFIG_DIR/config.json"
      ok "Migrated config.json"
    else
      info "hud-craft config already exists — keeping"
    fi
  fi

  # Clean installed_plugins.json
  clean_installed_plugins "claude-hud"

  ok "Migration prep complete"
fi

# ── Install or update hud-craft ───────────────────────────────

header "Installing hud-craft"

# If installed in cache but not marketplace, move it
if [ -d "$HC_CACHE" ] && [ ! -d "$INSTALL_DIR" ]; then
  info "Moving from cache/ to marketplaces/..."
  mkdir -p "$MARKET_DIR"
  # Use cp+rm instead of mv to handle cross-device
  cp -a "$HC_CACHE" "$INSTALL_DIR" && rm -rf "$HC_CACHE"
  ok "Moved to marketplaces/"
fi

# Detect running from inside the repo
LOCAL_REPO=false
if [ -f "./.claude-plugin/plugin.json" ] && grep -q '"hud-craft"' "./.claude-plugin/plugin.json" 2>/dev/null; then
  LOCAL_REPO=true
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  info "Updating from git..."
  if ! git -C "$INSTALL_DIR" pull --ff-only 2>/dev/null; then
    warn "Fast-forward failed. Stashing local changes..."
    git -C "$INSTALL_DIR" stash 2>/dev/null || true
    git -C "$INSTALL_DIR" fetch origin
    if ! git -C "$INSTALL_DIR" rebase origin/main 2>/dev/null; then
      git -C "$INSTALL_DIR" rebase --abort 2>/dev/null || true
      warn "Rebase failed — re-cloning..."
      rm -rf "$INSTALL_DIR"
      git clone --depth 1 "$REPO" "$INSTALL_DIR"
    fi
  fi
  ok "Updated to latest"
elif [ "$LOCAL_REPO" = true ]; then
  info "Running from inside hud-craft repo — copying to install dir..."
  mkdir -p "$MARKET_DIR"
  [ -d "$INSTALL_DIR" ] && rm -rf "$INSTALL_DIR"
  cp -a "$(pwd)" "$INSTALL_DIR"
  # Remove .git from copy to keep it lightweight
  rm -rf "$INSTALL_DIR/.git"
  ok "Copied local source to $INSTALL_DIR"
else
  # Clean any non-git remnant
  [ -d "$INSTALL_DIR" ] && rm -rf "$INSTALL_DIR"
  info "Cloning hud-craft..."
  mkdir -p "$MARKET_DIR"
  CLEANUP_TARGET="$INSTALL_DIR"
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
  CLEANUP_TARGET=""
  ok "Cloned"
fi

# ── Build if needed ───────────────────────────────────────────

if [[ "$SOURCE" == "dist/index.js" ]] && [[ ! -f "$INSTALL_DIR/dist/index.js" ]]; then
  header "Building"

  # Check npm is available
  if ! command -v npm &>/dev/null; then
    fail "npm is required to build (node runtime) but not found"
    fail "  If using nvm: nvm install --lts"
    exit 1
  fi

  info "Building from source..."
  if (cd "$INSTALL_DIR" && npm ci --ignore-scripts 2>/dev/null && npm run build); then
    if [ -f "$INSTALL_DIR/dist/index.js" ]; then
      ok "Build complete"
    else
      fail "Build succeeded but dist/index.js not created"
      exit 1
    fi
  else
    fail "Build failed"
    fail "  Try manually: cd $INSTALL_DIR && npm ci && npm run build"
    exit 1
  fi
fi

# ── Generate statusLine command ───────────────────────────────

CMD="bash -c '\"$RUNTIME\" \"$INSTALL_DIR/$SOURCE\"'"

# ── Update settings.json ──────────────────────────────────────

header "Configuring"

mkdir -p "$CLAUDE_DIR"
backup_settings

SETTINGS_UPDATED=false

if command -v jq &>/dev/null; then
  info "Updating settings.json (jq)..."
  if update_settings_jq "$CMD"; then
    SETTINGS_UPDATED=true
    ok "settings.json updated"
  else
    warn "jq failed, trying python3..."
  fi
fi

if [ "$SETTINGS_UPDATED" = false ] && command -v python3 &>/dev/null; then
  info "Updating settings.json (python3)..."
  if update_settings_python "$CMD"; then
    SETTINGS_UPDATED=true
    ok "settings.json updated"
  else
    warn "python3 failed"
  fi
fi

if [ "$SETTINGS_UPDATED" = false ]; then
  warn "Cannot auto-configure settings.json"
  warn "Add to $SETTINGS_FILE:"
  echo ""
  echo "  \"statusLine\": {\"type\": \"command\", \"command\": \"$CMD\"}"
  echo ""
fi

# ── Create default config ────────────────────────────────────

mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_DIR/config.json" ]; then
  cat > "$CONFIG_DIR/config.json" << 'CONF'
{
  "lineLayout": "expanded",
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
    "showThinking": true
  }
}
CONF
  ok "Created default config"
else
  info "Config exists — keeping current settings"
fi

# ── Cleanup old installations ─────────────────────────────────

if [ "$SCENARIO" = "migrate" ]; then
  header "Cleaning up claude-hud"

  for dir in "$OLD_CACHE" "$OLD_MARKET"; do
    if [ -d "$dir" ]; then
      rm -rf "$dir"
      ok "Removed $dir"
    fi
  done

  [ -d "$OLD_CONFIG_DIR" ] && info "Old config preserved at $OLD_CONFIG_DIR (safe to delete)"
fi

# Remove stale hud-craft cache if marketplace version exists
if [ -d "$HC_CACHE" ] && [ -d "$INSTALL_DIR" ] && [ "$HC_CACHE" != "$INSTALL_DIR" ]; then
  rm -rf "$HC_CACHE"
  info "Removed stale cache copy"
fi

# ── Test ──────────────────────────────────────────────────────

header "Testing"

SAMPLE_JSON='{"model":{"display_name":"Test Model"},"context_window":{"current_usage":{"input_tokens":1000},"context_window_size":200000}}'
TEST_OUTPUT=$(echo "$SAMPLE_JSON" | "$RUNTIME" "$INSTALL_DIR/$SOURCE" 2>&1 || true)

echo ""
if [ -n "$TEST_OUTPUT" ]; then
  echo -e "${GREEN}${BOLD}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║     hud-craft installed successfully!    ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
  echo "  Runtime:  $RUNTIME"
  echo "  Plugin:   $INSTALL_DIR"
  echo "  Config:   $CONFIG_DIR/config.json"
  [ "$SCENARIO" = "migrate" ] && echo -e "  ${YELLOW}Migrated from claude-hud${NC}"
  echo ""
  echo "  Restart Claude Code to activate."
  echo "  Run /hud-craft:configure to customize."
  echo ""
  info "Preview:"
  echo "$TEST_OUTPUT" | head -5
else
  echo -e "${YELLOW}${BOLD}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║  Installed — test produced no output     ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
  echo "  Runtime:  $RUNTIME"
  echo "  Command:  $CMD"
  echo ""
  echo "  Run: bash install.sh --doctor"
  echo "  Try: echo '$SAMPLE_JSON' | $CMD"
fi

echo ""
