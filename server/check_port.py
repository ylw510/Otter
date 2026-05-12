#!/usr/bin/env python3
"""Exit 0 if TCP port is free to bind on 0.0.0.0; 1 if in use or check failed."""
from __future__ import annotations

import errno
import socket
import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("用法: check_port.py <端口>", file=sys.stderr)
        return 2
    try:
        port = int(sys.argv[1], 10)
    except ValueError:
        print("check_port.py: 无效的端口", file=sys.stderr)
        return 2
    if not (0 < port < 65536):
        print("check_port.py: 端口必须在 1-65535", file=sys.stderr)
        return 2

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("0.0.0.0", port))
    except OSError as e:
        winerr = getattr(e, "winerror", None)
        if e.errno == errno.EADDRINUSE or winerr == 10048:  # WSAEADDRINUSE
            print(
                f"端口 {port} 已被占用。请更换 OTTER_PORT / --port 或结束占用进程后重试。",
                file=sys.stderr,
            )
            return 1
        print(f"check_port.py: 无法检测端口 {port}: {e}", file=sys.stderr)
        return 1
    finally:
        sock.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
