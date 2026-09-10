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
      # common/ 每个 bundle 各带一份（plugin 模式要自足），平铺时只装一次、且不算技能
      if [ "$name" = "common" ]; then
        [ -d "$root/common" ] && continue
        rsync -a --exclude '__pycache__' --exclude '.DS_Store' --exclude '*.pyc' "$sk/" "$root/common/"
        continue
      fi
      rm -rf "$root/$name"
      rsync -a --exclude '__pycache__' --exclude '.DS_Store' --exclude '*.pyc' "$sk/" "$root/$name/"
      n=$((n+1))
    done
  done
  # 共享依赖：config.json 必须落在技能根（不是某个技能目录里）
  # export-word.* 用 <script_dir>/../config.json 找它
  if [ -f "$root/config.json" ]; then
    echo "  ✓ $label → $root（$n 个技能；已有 config.json，保留未覆盖）"
  else
    cp "$HERE/pm-docs/skills/config.example.json" "$root/config.json"
    echo "  ✓ $label → $root（$n 个技能）"
    echo "    ⚠️  已放置 config.json 模板，端点为空 —— 填好 apiBaseUrl / diagramApiUrl"
    echo "        才能用 Word/xlsx 导出与图表渲染。其余 50 个技能不需要它。"
  fi
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
echo "导出功能需要先配端点：编辑 <技能根>/config.json，填 apiBaseUrl 与 diagramApiUrl。"
echo "配好后验一下 Word 导出链："
echo "  cd <任一技能目录> && bash ../common/export-word.sh <某个.md> req-doc"
echo "  然后 unzip -l <生成的.docx> | grep -c 'word/media/'  ← 数字要等于图片张数"
echo
echo "不配也能用剩下 50 个技能（战略/需求/评审/优先级/原型/审计等），只是不能一键导 Word/xlsx。"
