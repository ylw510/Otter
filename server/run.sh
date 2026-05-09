#!/usr/bin/env bash
# 启动 FastAPI（默认 --host 0.0.0.0 --port 8000 --reload）。
# 覆盖方式：环境变量 OTTER_HOST / OTTER_PORT，或参数 ./run.sh --host … --port …
# 其余参数原样传给 uvicorn（须写在自定义 host/port 之后），例如 ./run.sh --log-level debug
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .venv/bin/activate ]]; then
  echo "请先创建虚拟环境并安装依赖：" >&2
  echo "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

HOST="${OTTER_HOST:-0.0.0.0}"
PORT="${OTTER_PORT:-8000}"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      [[ -n "${2-}" ]] || { echo "run.sh: --host 需要参数" >&2; exit 1; }
      HOST="$2"
      shift 2
      ;;
    --port)
      [[ -n "${2-}" ]] || { echo "run.sh: --port 需要参数" >&2; exit 1; }
      PORT="$2"
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

# shellcheck source=/dev/null
source .venv/bin/activate
exec uvicorn main:app --host "$HOST" --port "$PORT" --reload "${ARGS[@]}"
