#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Please install Node.js first, then run this script again."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting MUSE Labeling Tool..."
echo "If the browser does not open automatically, use the URL printed by Vite."
npm run dev -- --open
