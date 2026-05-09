#!/usr/bin/env bash
# Otter Chrome 扩展：一键 install / build / pack（默认产物见 scripts/otter-extension-cli.mjs）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$ROOT/scripts/otter-extension-cli.mjs" "$@"
