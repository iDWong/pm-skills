#!/usr/bin/env python3
"""Render draw.io XML to PNG/JPEG/SVG via diagram export API."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


def load_api_url(script_dir: Path) -> str:
    candidates = [
        script_dir.parent / "config.json",
        script_dir.parent.parent / "config.json",
    ]
    for path in candidates:
        if not path.is_file():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            url = data.get("diagramApiUrl", "").strip().rstrip("/")
            if url:
                return url
        except (json.JSONDecodeError, OSError):
            continue
    return "https://draw.axuremart.com"


def detect_format(output_file: Path) -> str:
    ext = output_file.suffix.lower().lstrip(".")
    if ext == "svg":
        return "svg"
    if ext in {"jpg", "jpeg"}:
        return "jpeg"
    return "png"


def render(source_file: Path, output_file: Path) -> None:
    if not source_file.is_file():
        raise FileNotFoundError(f"Source file not found: {source_file}")

    script_dir = Path(__file__).resolve().parent
    api_url = load_api_url(script_dir)
    xml = source_file.read_text(encoding="utf-8")
    payload = {
        "xml": xml,
        "format": detect_format(output_file),
        "scale": 2,
    }

    output_file.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        f"{api_url}/api/export",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc

    if not data:
        raise RuntimeError("Empty response from diagram export API")

    output_file.write_bytes(data)


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "Usage: render-diagram.py <source.xml> <output.png|svg|jpg>",
            file=sys.stderr,
        )
        return 1

    source_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    print(f"Rendering: {output_file.name}")
    try:
        render(source_file, output_file)
    except Exception as exc:  # noqa: BLE001 - CLI entrypoint
        print(f"Render failed: {exc}", file=sys.stderr)
        if output_file.exists():
            output_file.unlink()
        return 1

    size = output_file.stat().st_size
    print(f"Render succeeded: {output_file} ({size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
