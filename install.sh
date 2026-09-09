#!/bin/bash
# pm-skills 平铺安装（Codex / Cursor / Claude 非 plugin 模式）
# 用法: bash install.sh [claude|codex|cursor|all]
set -e
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"

install_to() {
  local root="$1" label="$2"
  mkdir -p "$root"
  local n=0
  for plug in "$HERE"/pm-*/skills; do
    [ -d "$plug" ] || continue
    for sk in "$plug"/*; do
      [ -d "$sk" ] || continue
      local name; name="$(basename "$sk")"
      rm -rf "$root/$name"
      rsync -a --exclude '__pycache__' --exclude '.DS_Store' --exclude '*.pyc' "$sk/" "$root/$name/"
      n=$((n+1))
    done
    # 共享依赖：config.json 要落在技能根，不是技能目录里
    [ -f "$plug/config.json" ] && cp "$plug/config.json" "$root/config.json"
  done
  echo "  ✓ $label → $root（$n 个技能 + common/ + config.json）"
}

case "$TARGET" in
  claude) install_to "$HOME/.claude/skills" "Claude Code" ;;
  codex)  install_to "${CODEX_HOME:-$HOME/.codex}/skills" "Codex" ;;
  cursor) install_to "$HOME/.cursor/skills" "Cursor" ;;
  all)
    install_to "$HOME/.claude/skills" "Claude Code"
    install_to "${CODEX_HOME:-$HOME/.codex}/skills" "Codex"
    install_to "$HOME/.cursor/skills" "Cursor"
    ;;
  *) echo "用法: bash install.sh [claude|codex|cursor|all]"; exit 1 ;;
esac

echo
echo "装完后验一下 Word 导出链（需要网络）："
echo "  cd <任一技能目录> && bash ../common/export-word.sh <某个.md> req-doc"
echo "  然后 unzip -l <生成的.docx> | grep -c 'word/media/'  ← 数字要等于图片张数"
