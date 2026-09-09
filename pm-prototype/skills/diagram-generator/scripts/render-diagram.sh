#!/bin/bash
# render-diagram.sh - 渲染 draw.io XML 图表为 PNG/JPEG/SVG
# 用法: ./render-diagram.sh <源文件.xml> <输出文件.png>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "用法: $0 <源文件.xml> <输出文件>"
  echo "示例: $0 docs/images/src/login-flow.xml docs/images/login-flow.png"
  exit 1
fi

SOURCE_FILE=$1
OUTPUT_FILE=$2

if [ ! -f "$SOURCE_FILE" ]; then
  echo "❌ 错误: 文件不存在: $SOURCE_FILE"
  exit 1
fi

# 读取配置文件获取 API 地址
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE=""
for candidate in "$SCRIPT_DIR/../config.json" "$SCRIPT_DIR/../../config.json"; do
  if [ -f "$candidate" ]; then
    CONFIG_FILE="$candidate"
    break
  fi
done
if [ -n "$CONFIG_FILE" ]; then
  API_URL=$(grep -o '"diagramApiUrl"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"diagramApiUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
fi
if [ -z "$API_URL" ]; then
  API_URL="https://draw.axuremart.com"
fi

# 确保输出目录存在
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"
if [ -n "$OUTPUT_DIR" ] && [ "$OUTPUT_DIR" != "." ]; then
  mkdir -p "$OUTPUT_DIR"
fi

# 根据输出文件扩展名确定格式
OUTPUT_EXT="${OUTPUT_FILE##*.}"
case "$OUTPUT_EXT" in
  svg) FORMAT="svg" ;;
  jpg|jpeg) FORMAT="jpeg" ;;
  *)   FORMAT="png" ;;
esac

# 调用导出 API（优先 Python，跨平台 JSON 编码更可靠）
PYTHON=""
for candidate in python3 python py; do
  if command -v "$candidate" &> /dev/null; then
    PYTHON="$candidate"
    break
  fi
done

if [ -n "$PYTHON" ] && [ -f "$SCRIPT_DIR/render-diagram.py" ]; then
  "$PYTHON" "$SCRIPT_DIR/render-diagram.py" "$SOURCE_FILE" "$OUTPUT_FILE"
  exit $?
fi

# 回退：curl + jq/awk
TEMP_PAYLOAD="/tmp/diagram-payload-$$.json"
if command -v jq &> /dev/null; then
  jq -n --arg xml "$(cat "$SOURCE_FILE")" --arg fmt "$FORMAT" \
    '{xml: $xml, format: $fmt, scale: 2}' > "$TEMP_PAYLOAD"
else
  # jq 不可用时用 awk 转义
  ESCAPED=$(cat "$SOURCE_FILE" | awk '{
    gsub(/\r/, "")
    gsub(/\\/, "\\\\")
    gsub(/"/, "\\\"")
    gsub(/\t/, "\\t")
    if (NR > 1) printf "\\n"
    printf "%s", $0
  }')
  printf '{"xml":"%s","format":"%s","scale":2}' "$ESCAPED" "$FORMAT" > "$TEMP_PAYLOAD"
fi

# 调用导出 API
echo "🎨 正在渲染: $(basename "$OUTPUT_FILE")"
HTTP_CODE=$(curl -s -o "$OUTPUT_FILE" -w "%{http_code}" \
  -X POST "${API_URL}/api/export" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_PAYLOAD")

rm -f "$TEMP_PAYLOAD"

if [ "$HTTP_CODE" = "200" ] && [ -s "$OUTPUT_FILE" ]; then
  FILE_SIZE=$(ls -lh "$OUTPUT_FILE" 2>/dev/null | awk '{print $5}')
  echo "✅ 渲染成功: $OUTPUT_FILE ($FILE_SIZE)"
else
  echo "❌ 渲染失败 (HTTP $HTTP_CODE)"
  rm -f "$OUTPUT_FILE"
  exit 1
fi
