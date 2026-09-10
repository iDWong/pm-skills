#!/usr/bin/env python3
"""Export Markdown documents to Word (.docx) via document export API."""

from __future__ import annotations

import json
import re
import sys
import uuid
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

TEMPLATES = (
    "req-doc",
    "test-cases",
    "operation-manual",
    "feasibility-report",
    "feature-list",
    "default",
    "formal",
    "simple",
)

IMAGE_PATTERN = re.compile(r"!\[.*?\]\(([^)]+)\)")


def load_api_url(script_dir: Path) -> str:
    config_path = script_dir.parent / "config.json"
    if not config_path.is_file():
        raise FileNotFoundError(f"config.json not found: {config_path}")
    data = json.loads(config_path.read_text(encoding="utf-8"))
    url = str(data.get("apiBaseUrl", "")).strip().rstrip("/")
    if not url:
        raise ValueError("apiBaseUrl is missing in config.json")
    return url


def extract_local_images(markdown_text: str) -> list[str]:
    paths: list[str] = []
    seen: set[str] = set()
    for match in IMAGE_PATTERN.finditer(markdown_text):
        path = match.group(1).strip()
        if path.startswith(("http://", "https://", "data:")):
            continue
        if path not in seen:
            seen.add(path)
            paths.append(path)
    return paths


def build_multipart(
    fields: dict[str, str],
    files: list[tuple[str, str, bytes]],
) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    buffer = BytesIO()

    def write(data: str | bytes) -> None:
        if isinstance(data, str):
            buffer.write(data.encode("utf-8"))
        else:
            buffer.write(data)

    for name, value in fields.items():
        write(f"--{boundary}\r\n")
        write(f'Content-Disposition: form-data; name="{name}"\r\n\r\n')
        write(f"{value}\r\n")

    for name, filename, content in files:
        write(f"--{boundary}\r\n")
        write(
            f'Content-Disposition: form-data; name="{name}"; '
            f'filename="{filename}"\r\n'
        )
        write("Content-Type: application/octet-stream\r\n\r\n")
        write(content)
        write("\r\n")

    write(f"--{boundary}--\r\n")
    return buffer.getvalue(), boundary


def maybe_decode_output_path(path: Path) -> Path:
    decoded_name = urllib.parse.unquote(path.name)
    if decoded_name != path.name:
        decoded_path = path.with_name(decoded_name)
        path.rename(decoded_path)
        return decoded_path
    return path


def export_word(md_file: Path, template: str) -> Path:
    if template not in TEMPLATES:
        allowed = ", ".join(TEMPLATES)
        raise ValueError(f"Unknown template '{template}'. Allowed: {allowed}")

    md_file = md_file.resolve()
    if not md_file.is_file():
        raise FileNotFoundError(f"Markdown file not found: {md_file}")

    script_dir = Path(__file__).resolve().parent
    api_url = load_api_url(script_dir)
    md_dir = md_file.parent
    markdown_text = md_file.read_text(encoding="utf-8")
    image_paths = extract_local_images(markdown_text)

    print(f"Markdown file: {md_file}")
    print(f"Working directory: {md_dir}")
    print(f"Found {len(image_paths)} local image(s)")

    fields = {
        "content": markdown_text,
        "template": template,
    }

    files: list[tuple[str, str, bytes]] = []
    for image_path in image_paths:
        resolved = (md_dir / image_path).resolve()
        if resolved.is_file():
            files.append(("files", image_path, resolved.read_bytes()))
            print(f"  + {image_path}")
        else:
            print(f"  ! missing image: {image_path}")

    body, boundary = build_multipart(fields, files)
    output_file = md_dir / f"{md_file.stem}.docx"

    request = urllib.request.Request(
        f"{api_url}/api/document/export/word-with-images",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    print("Exporting...")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc

    if not data:
        raise RuntimeError("Empty response from export API")

    output_file.write_bytes(data)
    output_file = maybe_decode_output_path(output_file)
    return output_file


def print_usage() -> None:
    print(
        "Usage: export-word.py <markdown-file> <template>\n\n"
        "Templates:\n"
        "  req-doc            Requirements specification\n"
        "  test-cases         Test cases\n"
        "  operation-manual   Operation manual\n"
        "  feasibility-report Feasibility report\n"
        "  feature-list       Feature list\n"
        "  default            Default template\n"
        "  formal             Formal template\n"
        "  simple             Simple template\n\n"
        "Example:\n"
        "  python export-word.py docs/spec.md req-doc",
        file=sys.stderr,
    )


def main() -> int:
    if len(sys.argv) != 3:
        print_usage()
        return 1

    md_file = Path(sys.argv[1])
    template = sys.argv[2]

    try:
        output_file = export_word(md_file, template)
    except Exception as exc:  # noqa: BLE001 - CLI entrypoint
        print(f"Export failed: {exc}", file=sys.stderr)
        return 1

    size = output_file.stat().st_size
    print(f"Export succeeded: {output_file} ({size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
