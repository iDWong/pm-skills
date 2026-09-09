#!/usr/bin/env python3
"""Validate draw.io XML source files locally (no API, stdlib only)."""

from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


@dataclass
class Issue:
    level: str  # ERROR | WARN
    message: str


@dataclass
class ValidationResult:
    path: Path
    issues: list[Issue] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not any(i.level == "ERROR" for i in self.issues)

    def add(self, level: str, message: str) -> None:
        self.issues.append(Issue(level, message))


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _attr(cell: ET.Element, name: str, default: str = "") -> str:
    return cell.get(name, default) or ""


def _is_truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes"}


def _geometry_elem(cell: ET.Element) -> ET.Element | None:
    for child in cell:
        if _local(child.tag) == "mxGeometry":
            return child
    return None


def _parse_geometry(cell: ET.Element) -> tuple[float, float, float, float] | None:
    geom = _geometry_elem(cell)
    if geom is None:
        return None
    try:
        x = float(geom.get("x", "0") or 0)
        y = float(geom.get("y", "0") or 0)
        width = float(geom.get("width", "0") or 0)
        height = float(geom.get("height", "0") or 0)
        return x, y, width, height
    except ValueError:
        return None


def _has_endpoint_points(cell: ET.Element) -> bool:
    geom = _geometry_elem(cell)
    if geom is None:
        return False
    has_source = has_target = False
    for child in geom:
        if _local(child.tag) != "mxPoint":
            continue
        role = child.get("as", "")
        if role == "sourcePoint":
            has_source = True
        elif role == "targetPoint":
            has_target = True
    return has_source and has_target


def _collect_mxcells(root: ET.Element) -> list[ET.Element]:
    return [el for el in root.iter() if _local(el.tag) == "mxCell"]


def _has_english_filename(path: Path) -> bool:
    name = path.stem
    return bool(re.fullmatch(r"[A-Za-z0-9._-]+", name))


def validate_file(path: Path, *, check_overlap: bool = False) -> ValidationResult:
    result = ValidationResult(path=path)

    if not path.is_file():
        result.add("ERROR", f"File not found: {path}")
        return result

    if path.stat().st_size == 0:
        result.add("ERROR", "File is empty")
        return result

    if path.suffix.lower() not in {".xml", ".drawio"}:
        result.add("WARN", f"Unexpected extension '{path.suffix}' (expected .xml or .drawio)")

    if not _has_english_filename(path):
        result.add("WARN", "Filename should use English kebab-case (no CJK or spaces)")

    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        result.add("ERROR", f"Cannot read file: {exc}")
        return result

    if "<mxfile" not in text:
        result.add("ERROR", "Missing <mxfile> wrapper")

    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        result.add("ERROR", f"Malformed XML: {exc}")
        return result

    if _local(root.tag) != "mxfile":
        result.add("ERROR", f"Root element must be <mxfile>, got <{root.tag}>")

    has_graph_model = any(_local(el.tag) == "mxGraphModel" for el in root.iter())
    if not has_graph_model:
        result.add("ERROR", "Missing <mxGraphModel>")

    has_root = any(_local(el.tag) == "root" for el in root.iter())
    if not has_root:
        result.add("ERROR", "Missing <root> inside mxGraphModel")

    cells = _collect_mxcells(root)
    if not cells:
        result.add("ERROR", "No <mxCell> elements found")
        return result

    ids: dict[str, int] = {}
    cell_by_id: dict[str, ET.Element] = {}
    for cell in cells:
        cell_id = _attr(cell, "id")
        if not cell_id:
            result.add("ERROR", "mxCell missing id attribute")
            continue
        ids[cell_id] = ids.get(cell_id, 0) + 1
        cell_by_id[cell_id] = cell

    for cell_id, count in ids.items():
        if count > 1:
            result.add("ERROR", f"Duplicate mxCell id={cell_id!r} ({count} times)")

    if "0" not in cell_by_id:
        result.add("ERROR", 'Missing required mxCell id="0"')
    if "1" not in cell_by_id:
        result.add("ERROR", 'Missing required mxCell id="1"')

    vertices: list[tuple[str, float, float, float, float]] = []

    for cell in cells:
        cell_id = _attr(cell, "id")
        if not cell_id:
            continue

        is_edge = _is_truthy(_attr(cell, "edge"))
        is_vertex = _is_truthy(_attr(cell, "vertex"))

        if is_edge:
            if _attr(cell, "edge") != "1":
                result.add("ERROR", f'Edge id={cell_id!r} must have edge="1"')
            if _geometry_elem(cell) is None:
                result.add("ERROR", f'Edge id={cell_id!r} missing <mxGeometry>')
                continue

            source = _attr(cell, "source")
            target = _attr(cell, "target")
            point_linked = _has_endpoint_points(cell)

            if source and source not in cell_by_id:
                result.add("ERROR", f'Edge id={cell_id!r} source={source!r} not found')
            if target and target not in cell_by_id:
                result.add("ERROR", f'Edge id={cell_id!r} target={target!r} not found')

            if source and target:
                pass  # standard cell-to-cell edge
            elif point_linked:
                pass  # sequence / floating connector via sourcePoint & targetPoint
            elif source or target:
                result.add(
                    "WARN",
                    f'Edge id={cell_id!r} has partial source/target without endpoint points',
                )
            else:
                result.add(
                    "ERROR",
                    f'Edge id={cell_id!r} missing source/target or sourcePoint/targetPoint',
                )
            continue

        if is_vertex:
            if not _attr(cell, "parent"):
                result.add("ERROR", f'Vertex id={cell_id!r} missing parent')
            geom = _parse_geometry(cell)
            if geom is None:
                result.add("ERROR", f'Vertex id={cell_id!r} missing <mxGeometry>')
            else:
                x, y, w, h = geom
                if w <= 0 or h <= 0:
                    result.add("WARN", f'Vertex id={cell_id!r} has non-positive width/height')
                elif check_overlap and w > 0 and h > 0:
                    vertices.append((cell_id, x, y, w, h))

    if check_overlap:
        _check_overlaps(result, vertices)

    custom_cells = [
        c for c in cells if _attr(c, "id") not in {"0", "1"} and _is_truthy(_attr(c, "vertex"))
    ]
    if not custom_cells:
        result.add("WARN", "No custom vertex cells (diagram may be empty)")

    return result


def _rects_overlap(
    a: tuple[float, float, float, float],
    b: tuple[float, float, float, float],
) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    if aw <= 0 or ah <= 0 or bw <= 0 or bh <= 0:
        return False
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


def _check_overlaps(result: ValidationResult, vertices: list[tuple[str, float, float, float, float]]) -> None:
    for i, (id_a, x_a, y_a, w_a, h_a) in enumerate(vertices):
        rect_a = (x_a, y_a, w_a, h_a)
        for id_b, x_b, y_b, w_b, h_b in vertices[i + 1 :]:
            if _rects_overlap(rect_a, (x_b, y_b, w_b, h_b)):
                result.add("WARN", f"Possible overlap between vertex id={id_a!r} and id={id_b!r}")


def _expand_inputs(paths: Iterable[str], directory: str | None) -> list[Path]:
    files: list[Path] = []
    if directory:
        dir_path = Path(directory)
        if not dir_path.is_dir():
            print(f"ERROR: Not a directory: {dir_path}", file=sys.stderr)
            raise SystemExit(1)
        files.extend(sorted(dir_path.glob("*.xml")))
        files.extend(sorted(dir_path.glob("*.drawio")))
    for raw in paths:
        p = Path(raw)
        if p.is_dir():
            files.extend(sorted(p.glob("*.xml")))
            files.extend(sorted(p.glob("*.drawio")))
        else:
            files.append(p)
    return files


def _print_result(result: ValidationResult, *, verbose: bool) -> None:
    rel = result.path
    if result.ok and not result.issues:
        print(f"OK  {rel}")
        return

    if result.ok:
        print(f"OK  {rel} ({sum(1 for i in result.issues if i.level == 'WARN')} warning(s))")
    else:
        print(f"FAIL  {rel}")

    if verbose or not result.ok:
        for issue in result.issues:
            prefix = issue.level
            print(f"  [{prefix}] {issue.message}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate draw.io XML source files (local, no API).",
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="One or more .xml / .drawio files or directories",
    )
    parser.add_argument(
        "--dir",
        dest="directory",
        help="Validate all .xml and .drawio files in a directory",
    )
    parser.add_argument(
        "--check-overlap",
        action="store_true",
        help="Warn when vertex bounding boxes overlap (heuristic)",
    )
    parser.add_argument(
        "-q",
        "--quiet",
        action="store_true",
        help="Only print summary line per file unless failed",
    )
    args = parser.parse_args()

    try:
        files = _expand_inputs(args.files, args.directory)
    except SystemExit as exc:
        return int(exc.code)

    if not files:
        parser.print_help()
        print("\nERROR: No input files.", file=sys.stderr)
        return 1

    verbose = not args.quiet
    results = [validate_file(p, check_overlap=args.check_overlap) for p in files]
    failed = sum(1 for r in results if not r.ok)

    for result in results:
        _print_result(result, verbose=verbose)

    total = len(results)
    passed = total - failed
    print(f"\nValidated {total} file(s): {passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
