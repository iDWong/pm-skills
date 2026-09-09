#!/bin/bash
# render.sh — 把 SVG 线框图渲染成可嵌入 Word 的 PNG
# 用法：bash render.sh <svg目录> <png输出目录> [边长px，默认2400]
#
# 为什么这么绕：macOS 上常见的 ImageMagick / rsvg-convert 不一定装，
# 只能用系统自带的 qlmanage。但 qlmanage 会按短边缩放并裁掉超出部分，
# 所以 wireframe.py 把画布强制为正方形、内容锚定左上、其余留白，
# 再用 png_crop.py 精确裁掉留白，最终得到原始比例的紧凑 PNG。
set -e
SVG_DIR="${1:?用法: render.sh <svg目录> <png输出目录> [边长]}"
PNG_DIR="${2:?用法: render.sh <svg目录> <png输出目录> [边长]}"
SIZE="${3:-2400}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$PNG_DIR"
for f in "$SVG_DIR"/*.svg; do
  [ -e "$f" ] || { echo "没有找到 SVG：$SVG_DIR"; exit 1; }
  b="$(basename "$f" .svg)"
  qlmanage -t -s "$SIZE" -o "$PNG_DIR" "$f" >/dev/null 2>&1
  printf "%-32s " "$b"
  python3 "$HERE/png_crop.py" "$PNG_DIR/$b.svg.png" "$PNG_DIR/$b.png"
  rm -f "$PNG_DIR/$b.svg.png"
done
echo
echo "提醒：PNG 文件名必须是纯 ASCII，否则 Word 导出会静默丢图（见 references/wireframe.md）。"
