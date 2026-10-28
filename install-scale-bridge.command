#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
# Finder launches with a minimal PATH; include common Node installations.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js LTS from https://nodejs.org, then run this setup again."
  read -r -p "Press Return to close."
  exit 1
fi
node scripts/install-scale-bridge.mjs
echo
read -r -p "Press Return to close."
