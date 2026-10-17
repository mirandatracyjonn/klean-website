#!/usr/bin/env python3
"""Local preview that behaves like GitHub Pages: unknown paths get 404.html (which routes /m/<token> and /b/<id>).

    python3 scripts/serve.py [port]     then open http://localhost:8765
"""
import functools
import http.server
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code == 404 and (ROOT / "404.html").exists():
            body = (ROOT / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().send_error(code, message, explain)


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
print(f"klean.ph preview on http://localhost:{port}")
http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(ROOT))).serve_forever()
