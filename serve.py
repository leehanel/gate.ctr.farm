#!/usr/bin/env python3
"""
Development server with automatic rebuild on file changes.

Serves the docs/ directory on http://localhost:3000 and watches
templates/, static/, locales/, data/, and public/ for changes.

Usage:
    python serve.py
    python serve.py 8080        # custom port
"""

import http.server
import os
import socketserver
import sys
import threading
import time
from pathlib import Path

from build import build

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / "docs"
WATCH_DIRS = ["templates", "static", "locales", "data", "public"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Serves files from OUTPUT_DIR with clean-URL support."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(OUTPUT_DIR), **kwargs)

    def do_GET(self):
        # Serve /foo → /foo/index.html (directory-style clean URLs)
        path = self.path.split("?")[0].split("#")[0]
        file_path = OUTPUT_DIR / path.lstrip("/")

        if not file_path.suffix and not file_path.is_file():
            candidate = file_path / "index.html"
            if candidate.is_file():
                self.path = path.rstrip("/") + "/index.html"

        super().do_GET()

    def log_message(self, fmt, *args):
        # Quieter logging
        sys.stdout.write(f"  {args[0]}\n")


def watch_and_rebuild():
    """Poll source directories for changes and trigger a rebuild."""
    last_mtime: dict[str, float] = {}
    # Seed with current mtimes so we don't rebuild immediately
    for dir_name in WATCH_DIRS:
        dir_path = ROOT / dir_name
        if not dir_path.exists():
            continue
        for f in dir_path.rglob("*"):
            if f.is_file():
                last_mtime[str(f)] = f.stat().st_mtime

    while True:
        time.sleep(1)
        changed = False
        for dir_name in WATCH_DIRS:
            dir_path = ROOT / dir_name
            if not dir_path.exists():
                continue
            for f in dir_path.rglob("*"):
                if f.is_file():
                    mtime = f.stat().st_mtime
                    key = str(f)
                    if key not in last_mtime or last_mtime[key] < mtime:
                        last_mtime[key] = mtime
                        changed = True

        if changed:
            print("\n🔄  Changes detected — rebuilding...")
            try:
                build()
            except Exception as e:
                print(f"  ⚠️  Build error: {e}")


def main():
    # Initial build
    build()

    # Start file-watcher in a daemon thread
    watcher = threading.Thread(target=watch_and_rebuild, daemon=True)
    watcher.start()

    # Allow port reuse for quick restart
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"\n🚀  Dev server running at http://localhost:{PORT}")
        print("    Watching for changes… (Ctrl-C to stop)\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
