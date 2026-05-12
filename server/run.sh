#!/usr/bin/env bash
# Start FastAPI with uvicorn (default --host 0.0.0.0 --port 8000 --reload).
# Override with OTTER_HOST / OTTER_PORT, or ./run.sh --host … --port …
# Remaining args are passed to uvicorn (after custom host/port), e.g. ./run.sh --log-level debug
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .venv/bin/activate ]]; then
  echo "Create a virtual environment and install dependencies first:" >&2
  echo "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

HOST="${OTTER_HOST:-0.0.0.0}"
PORT="${OTTER_PORT:-8000}"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      [[ -n "${2-}" ]] || { echo "run.sh: --host requires a value" >&2; exit 1; }
      HOST="$2"
      shift 2
      ;;
    --port)
      [[ -n "${2-}" ]] || { echo "run.sh: --port requires a value" >&2; exit 1; }
      PORT="$2"
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

if ! .venv/bin/python check_port.py "$PORT"; then
  exit 1
fi

# shellcheck source=/dev/null
source .venv/bin/activate
exec uvicorn main:app --host "$HOST" --port "$PORT" --reload "${ARGS[@]}"
