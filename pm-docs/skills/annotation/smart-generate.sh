#!/bin/bash
# 智能标注生成器
# 使用 Claude 分析需求文档和页面组件，生成精准的标注数据
#
# 用法：
# bash ../annotation/smart-generate.sh <page-path> [req-doc-path]
#
# 示例：
# bash ../annotation/smart-generate.sh /equipment/vendor docs/requirements/设备管理需求说明书.md

set -e

PAGE_PATH="$1"
REQ_DOC="$2"

if [ -z "$PAGE_PATH" ]; then
  echo "错误：缺少页面路径参数"
  echo "用法: $0 <page-path> [req-doc-path]"
  exit 1
fi

# 路由路径转文件名
FILE_NAME=$(echo "$PAGE_PATH" | sed 's|^/||' | sed 's|/|-|g')
[ -z "$FILE_NAME" ] && FILE_NAME="index"

# 查找组件文件
COMPONENT_PATH="src/views${PAGE_PATH}.vue"
if [ ! -f "$COMPONENT_PATH" ]; then
  echo "错误：组件文件不存在: $COMPONENT_PATH"
  exit 1
fi

echo "📄 正在分析组件: $COMPONENT_PATH"

# 读取组件内容
COMPONENT_CONTENT=$(cat "$COMPONENT_PATH")

# 读取需求文档（如果提供）
REQ_CONTENT=""
if [ -n "$REQ_DOC" ] && [ -f "$REQ_DOC" ]; then
  echo "📋 正在读取需求文档: $REQ_DOC"
  REQ_CONTENT=$(cat "$REQ_DOC")
fi

# 构建提示词
PROMPT="请分析以下 Vue 组件，生成标注数据。

## 组件代码
\`\`\`vue
$COMPONENT_CONTENT
\`\`\`
"

if [ -n "$REQ_CONTENT" ]; then
  PROMPT="$PROMPT

## 需求文档
\`\`\`markdown
$REQ_CONTENT
\`\`\`
"
fi

PROMPT="$PROMPT

## 任务要求
1. 分析组件中的表单字段、表格列、按钮等可标注元素
2. 为每个元素生成 CSS 选择器（优先使用 class、id，避免 nth-child）
3. 从需求文档中提取对应的功能说明作为标注内容
4. 输出 JSON 格式的标注数据

## 输出格式
\`\`\`json
{
  \"page\": \"$PAGE_PATH\",
  \"title\": \"页面标题\",
  \"updatedAt\": \"$(date +%Y-%m-%d)\",
  \"annotations\": [
    {
      \"id\": \"ann-001\",
      \"type\": \"selector\",
      \"selector\": \".filter-card .ant-input:first-child\",
      \"position\": { \"x\": 0, \"y\": 0 },
      \"title\": \"字段名称\",
      \"content\": \"详细说明\",
      \"category\": \"filter|field|action|rule\",
      \"source\": \"需求章节\",
      \"createdAt\": \"$(date +%Y-%m-%d)\"
    }
  ]
}
\`\`\`

请直接输出 JSON，不要有其他说明文字。
"

# 输出提示词到临时文件
TEMP_FILE="/tmp/annotation-prompt-$$.txt"
echo "$PROMPT" > "$TEMP_FILE"

echo "🤖 正在调用 Claude 生成标注..."
echo "提示词已保存到: $TEMP_FILE"
echo ""
echo "请手动执行以下步骤："
echo "1. 复制提示词内容"
echo "2. 在 Claude 对话中粘贴"
echo "3. 将生成的 JSON 保存到: public/annotations/${FILE_NAME}.json"
echo ""
echo "或者使用 Claude Code 直接处理："
echo "cat $TEMP_FILE | pbcopy  # 复制到剪贴板"
