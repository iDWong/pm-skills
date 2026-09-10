#!/bin/bash
# export-word.sh - 统一文档导出工具
# 用法：
#   1. 直接执行：bash export-word.sh <markdown文件> <模板>
#   2. 作为函数：source export-word.sh && export_word <markdown文件> <模板>
# Windows 推荐：export-word.ps1 或 python export-word.py

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

_run_python_export() {
  local PYTHON=""
  for candidate in python3 python py; do
    if command -v "$candidate" &> /dev/null; then
      PYTHON="$candidate"
      break
    fi
  done
  if [ -n "$PYTHON" ] && [ -f "$SCRIPT_DIR/export-word.py" ]; then
    "$PYTHON" "$SCRIPT_DIR/export-word.py" "$@"
    return $?
  fi
  return 127
}

# URL 解码函数（纯 Bash 实现，无需 Python）
url_decode() {
  local url_encoded="${1//+/ }"
  printf '%b' "${url_encoded//%/\\x}"
}

# 导出带图片的 Word 文档
# 参数：
#   $1: Markdown 文件路径（支持相对路径和绝对路径）
#   $2: 模板名称（req-doc, test-cases, operation-manual, default, formal, simple）
export_word() {
  if _run_python_export "$@"; then
    return 0
  fi

  local MD_FILE=$1
  local TEMPLATE=$2
  # 从 config.json 读取 apiBaseUrl
  local SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  local CONFIG_FILE="$SKILL_DIR/config.json"
  # 用 grep + sed 解析 JSON，无需 python3
  local API_URL=$(grep -o '"apiBaseUrl"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"apiBaseUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
  if [ -z "$API_URL" ]; then
    echo "❌ 错误: 无法从 config.json 读取 apiBaseUrl"
    return 1
  fi

  # 参数校验
  if [ -z "$MD_FILE" ] || [ -z "$TEMPLATE" ]; then
    echo "❌ 错误: 缺少必要参数"
    echo ""
    echo "用法: $0 <markdown文件> <模板>"
    echo ""
    echo "模板选项:"
    echo "  req-doc           - 需求说明书"
    echo "  test-cases        - 测试用例"
    echo "  operation-manual  - 操作手册"
    echo "  feasibility-report - 可行性研究报告"
    echo "  feature-list      - 功能清单"
    echo "  default           - 默认模板"
    echo "  formal            - 正式模板"
    echo "  simple            - 简洁模板"
    echo ""
    echo "示例: $0 docs/需求说明书.md req-doc"
    return 1
  fi

  # 检查 Markdown 文件是否存在
  if [ ! -f "$MD_FILE" ]; then
    echo "❌ 错误: 文件不存在: $MD_FILE"
    return 1
  fi

  # 获取 Markdown 文件的绝对路径和所在目录
  local MD_FILE_ABS=$(cd "$(dirname "$MD_FILE")" && pwd)/$(basename "$MD_FILE")
  local MD_DIR=$(dirname "$MD_FILE_ABS")
  local ORIGINAL_DIR=$(pwd)

  echo "📂 Markdown 文件: $MD_FILE_ABS"
  echo "📂 工作目录: $MD_DIR"

  # 切换到 Markdown 文件所在目录（这样相对路径的图片才能正确找到）
  cd "$MD_DIR"

  # 提取图片路径
  echo "📝 正在提取图片路径..."
  local IMAGES_LIST="/tmp/export-images-$$.txt"
  grep -o '!\[.*\]([^)]*)' "$MD_FILE_ABS" | \
    sed 's/!\[.*\](\(.*\))/\1/' | \
    grep -v '^http' | \
    grep -v '^https' | \
    grep -v '^data:' > "$IMAGES_LIST"

  local IMAGE_COUNT=$(wc -l < "$IMAGES_LIST" | tr -d ' ')
  echo "✅ 找到 $IMAGE_COUNT 张本地图片"

  # 用数组构建 curl 参数，避免 eval + 路径含空格的问题
  echo "📤 正在上传文档和图片..."
  local CURL_ARGS=(-X POST "${API_URL}/api/document/export/word-with-images")
  CURL_ARGS+=(-F "content=<$MD_FILE_ABS")
  CURL_ARGS+=(-F "template=$TEMPLATE")

  while IFS= read -r image_path; do
    if [ -f "$image_path" ]; then
      CURL_ARGS+=(-F "files=@$image_path;filename=$image_path")
      echo "  ✓ $image_path"
    else
      echo "  ⚠️  图片不存在: $image_path"
    fi
  done < "$IMAGES_LIST"

  # 用 Markdown 文件名推导输出文件名（.md → .docx），兼容所有 curl 版本
  local OUTPUT_FILE="${MD_DIR}/$(basename "$MD_FILE_ABS" .md).docx"
  CURL_ARGS+=(--progress-bar -o "$OUTPUT_FILE")

  # 执行导出
  echo ""
  echo "🚀 开始导出..."
  curl "${CURL_ARGS[@]}"

  # 检查结果
  if [ -f "$OUTPUT_FILE" ]; then
    # 检查文件名是否包含 URL 编码字符（%），如果有则解码（兼容旧版服务端）
    if [[ "$OUTPUT_FILE" == *%* ]]; then
      echo "🔄 检测到 URL 编码的文件名，正在解码..."
      local DECODED_FILE=$(url_decode "$OUTPUT_FILE")
      if [ "$OUTPUT_FILE" != "$DECODED_FILE" ]; then
        mv "$OUTPUT_FILE" "$DECODED_FILE"
        OUTPUT_FILE="$DECODED_FILE"
        echo "✓ 文件名已解码"
      fi
    fi

    # 获取文件大小（跨平台兼容）
    local FILE_SIZE
    if command -v du &> /dev/null; then
      FILE_SIZE=$(du -h "$OUTPUT_FILE" 2>/dev/null | cut -f1)
    else
      FILE_SIZE=$(ls -lh "$OUTPUT_FILE" 2>/dev/null | awk '{print $5}')
    fi

    echo ""
    echo "✅ 导出成功!"
    echo "📄 文件: $OUTPUT_FILE"
    echo "📊 大小: $FILE_SIZE"

    # 清理临时文件
    rm -f "$IMAGES_LIST"

    # 切回原目录
    cd "$ORIGINAL_DIR"
    return 0
  else
    echo ""
    echo "❌ 导出失败，请检查日志"
    rm -f "$IMAGES_LIST"

    # 切回原目录
    cd "$ORIGINAL_DIR"
    return 1
  fi
}

# 如果直接执行脚本（不是被 source），则调用导出函数
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  if _run_python_export "$@"; then
    exit 0
  fi
  export_word "$@"
fi
