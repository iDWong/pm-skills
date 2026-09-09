#!/bin/bash
# validate-diagram.sh - Validate draw.io XML locally (no API)
# Usage: ./validate-diagram.sh <source.xml> [more.xml ...]
#        ./validate-diagram.sh --dir docs/images/src

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_SCRIPT="$SCRIPT_DIR/validate-diagram.py"

PYTHON=""
for candidate in python3 python py; do
  if command -v "$candidate" &> /dev/null; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "ERROR: Python 3 not found." >&2
  exit 1
fi

exec "$PYTHON" "$PY_SCRIPT" "$@"
