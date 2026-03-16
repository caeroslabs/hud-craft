#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# hud-craft installer
# Customizable statusline HUD for Claude Code
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash
#   # or
#   git clone https://github.com/caeroslabs/hud-craft.git && cd hud-craft && bash install.sh
# ──────────────────────────────────────────────────────────────

REPO="https://github.com/caeroslabs/hud-craft.git"
INSTALL_DIR="$HOME/.claude/plugins/marketplaces/hud-craft"
CONFIG_DIR="$HOME/.claude/plugins/hud-craft"
SETTINGS_FILE="$HOME/.claude/settings.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[hud-craft]${NC} $*"; }
ok()    { echo -e "${GREEN}[hud-craft]${NC} $*"; }
warn()  { echo -e "${YELLOW}[hud-craft]${NC} $*"; }
fail()  { echo -e "${RED}[hud-craft]${NC} $*"; }

# ── 1. Clone or update ──────────────────────────────────────

if [ -d "$INSTALL_DIR/.git" ]; then
  info "Updating hud-craft..."
  if ! git -C "$INSTALL_DIR" pull --ff-only 2>/dev/null; then
    warn "Fast-forward pull failed. Resetting to origin/main..."
    git -C "$INSTALL_DIR" fetch origin
    git -C "$INSTALL_DIR" reset --hard origin/main
  fi
else
  info "Installing hud-craft..."
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
fi

# ── 2. Detect runtime ───────────────────────────────────────

RUNTIME=""
SOURCE=""

if command -v bun &>/dev/null; then
  RUNTIME="$(command -v bun)"
  SOURCE="src/index.ts"
  info "Runtime: bun ($RUNTIME)"
elif command -v node &>/dev/null; then
  # Check node version >= 18
  NODE_VERSION=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    fail "Node.js 18+ required (found v$NODE_VERSION)"
    exit 1
  fi
  RUNTIME="$(command -v node)"
  SOURCE="dist/index.js"
  info "Runtime: node v$(node -v | sed 's/^v//') ($RUNTIME)"
else
  fail "Node.js 18+ or Bun is required but neither was found."
  fail "Install Node.js: https://nodejs.org/"
  fail "Install Bun:     https://bun.sh/"
  exit 1
fi

# ── 3. Build if needed (node runtime only) ──────────────────

if [[ "$SOURCE" == "dist/index.js" ]] && [[ ! -f "$INSTALL_DIR/dist/index.js" ]]; then
  info "Building hud-craft (dist/index.js not found)..."
  (cd "$INSTALL_DIR" && npm ci --ignore-scripts 2>/dev/null && npm run build)
  if [[ ! -f "$INSTALL_DIR/dist/index.js" ]]; then
    fail "Build failed: dist/index.js was not created"
    exit 1
  fi
  ok "Build complete."
fi

# ── 4. Generate statusLine command ──────────────────────────

# Use absolute paths to avoid PATH issues in Claude Code's shell
CMD="bash -c '\"$RUNTIME\" \"$INSTALL_DIR/$SOURCE\"'"

# ── 5. Update settings.json (merge statusLine) ──────────────

mkdir -p "$(dirname "$SETTINGS_FILE")"

update_settings_jq() {
  if [ -f "$SETTINGS_FILE" ]; then
    local tmp
    tmp=$(mktemp)
    jq --arg cmd "$CMD" '.statusLine = {"type": "command", "command": $cmd}' "$SETTINGS_FILE" > "$tmp" && mv "$tmp" "$SETTINGS_FILE"
  else
    jq -n --arg cmd "$CMD" '{"statusLine": {"type": "command", "command": $cmd}}' > "$SETTINGS_FILE"
  fi
}

update_settings_python() {
  python3 << 'PYEOF'
import json, os, sys

settings_file = os.path.expanduser(os.environ["_SETTINGS_FILE"])
cmd = os.environ["_CMD"]

data = {}
if os.path.exists(settings_file):
    with open(settings_file, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print("[hud-craft] Warning: settings.json was invalid JSON, creating fresh", file=sys.stderr)
            data = {}

data["statusLine"] = {"type": "command", "command": cmd}

with open(settings_file, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PYEOF
}

SETTINGS_UPDATED=false

if command -v jq &>/dev/null; then
  info "Updating settings.json (using jq)..."
  if update_settings_jq; then
    SETTINGS_UPDATED=true
    ok "settings.json updated."
  else
    warn "jq merge failed, trying python3 fallback..."
  fi
fi

if [ "$SETTINGS_UPDATED" = false ] && command -v python3 &>/dev/null; then
  info "Updating settings.json (using python3)..."
  if _SETTINGS_FILE="$SETTINGS_FILE" _CMD="$CMD" update_settings_python; then
    SETTINGS_UPDATED=true
    ok "settings.json updated."
  else
    warn "python3 merge failed."
  fi
fi

if [ "$SETTINGS_UPDATED" = false ]; then
  warn "Cannot auto-configure settings.json (install jq or python3)."
  warn "Add this to $SETTINGS_FILE manually:"
  echo ""
  echo "  \"statusLine\": {\"type\": \"command\", \"command\": \"$CMD\"}"
  echo ""
fi

# ── 6. Create default config if not exists ───────────────────

mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_DIR/config.json" ]; then
  cat > "$CONFIG_DIR/config.json" << 'CONF'
{
  "lineLayout": "expanded",
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
    "showSpeed": false
  }
}
CONF
  ok "Created default config at $CONFIG_DIR/config.json"
else
  info "Config already exists at $CONFIG_DIR/config.json (keeping)"
fi

# ── 7. Test ──────────────────────────────────────────────────

echo ""
info "Testing hud-craft..."

SAMPLE_JSON='{"model":{"display_name":"Test Model"},"context_window":{"current_usage":{"input_tokens":1000},"context_window_size":200000}}'
TEST_OUTPUT=$(echo "$SAMPLE_JSON" | eval "$CMD" 2>&1 || true)

echo ""
if [ -n "$TEST_OUTPUT" ]; then
  ok "============================================"
  ok "  hud-craft installed successfully!"
  ok "============================================"
  echo ""
  echo "  Runtime:  $RUNTIME"
  echo "  Plugin:   $INSTALL_DIR"
  echo "  Config:   $CONFIG_DIR/config.json"
  echo "  Settings: $SETTINGS_FILE"
  echo ""
  echo "  Restart Claude Code to see the HUD."
  echo "  Run /hud-craft:configure to customize."
  echo ""
  info "Test output preview:"
  echo "$TEST_OUTPUT" | head -5
else
  warn "============================================"
  warn "  Installation complete but test produced"
  warn "  no output. The HUD may still work."
  warn "============================================"
  echo ""
  echo "  Runtime:  $RUNTIME"
  echo "  Command:  $CMD"
  echo ""
  echo "  Try running manually:"
  echo "    echo '$SAMPLE_JSON' | $CMD"
  echo ""
fi
