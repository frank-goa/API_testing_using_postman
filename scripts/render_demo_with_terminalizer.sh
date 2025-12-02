#!/usr/bin/env bash
set -euo pipefail

# Render a previously-recorded Terminalizer session into a GIF under docs/
# Usage:
# 1. Install terminalizer: `npm install -g terminalizer`
# 2. Record: `terminalizer record demo` then run the commands to demo (e.g. `npm run test:newman`).
#    Press Ctrl+D when finished.
# 3. Run this script: `./scripts/render_demo_with_terminalizer.sh demo docs/demo.gif`

CAST_NAME=${1:-demo}
OUT_PATH=${2:-docs/demo.gif}

if ! command -v terminalizer >/dev/null 2>&1; then
  echo "terminalizer not found. Install it with: npm install -g terminalizer"
  exit 1
fi

mkdir -p "$(dirname "$OUT_PATH")"

echo "Rendering terminalizer recording '$CAST_NAME' to GIF at $OUT_PATH"
terminalizer render "$CAST_NAME" --format gif -o "$OUT_PATH"

echo "Done. GIF saved to $OUT_PATH"
