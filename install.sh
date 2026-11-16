#!/usr/bin/env bash
# macOS/Linux/Git Bash wrapper: ./install.sh [--all | --glow-up | --only a,b | --list | --dry-run ...]
command -v node >/dev/null || { echo "Node 18+ is required: https://nodejs.org" >&2; exit 1; }
exec node "$(dirname "$0")/install.mjs" "$@"
