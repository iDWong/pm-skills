# 标注数据规范

## JSON 文件结构

每个页面一个 JSON 文件，存放在 `public/annotations/` 目录下。

文件命名：路由路径转文件名，`/` 替换为 `-`，去掉开头的 `-`。
- `/equipment/archive` → `equipment-archive.json`
- `/dashboard` → `dashboard.json`

```json
{
  "page": "/equipment/archive",
  "title": "设备档案",
  "updatedAt": "2026-04-22",
  "annotations": [
    {
      "id": "ann-001",
      "type": "selector",
      "selector": ".filter-card .ant-input:first-child",
      "position": { "x": 0, "y": 0 },
      "title": "设备名称筛选",
      "content": "支持模糊搜索，输入关键词后点击搜索或回车",
      "category": "filter",
      "source": "3.5.3.1 设备档案",
      "createdAt": "2026-04-22"
    },
    {
      "id": "ann-002",
      "type": "position",
      "selector": "",
      "position": { "x": 45.2, "y": 30.8 },
      "title": "手动标注示例",
      "content": "这是一个手动添加的标注",
      "category": "custom",
      "source": "",
      "createdAt": "2026-04-22"
    }
  ]
}
```

## 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识，格式 `ann-{序号}` |
| `type` | `'selector' \| 'position'` | 定位方式：CSS 选择器 或 百分比坐标 |
| `selector` | string | CSS 选择器（type=selector 时必填） |
| `position` | `{ x: number, y: number }` | 百分比坐标（type=position 时使用，相对于内容区） |
| `title` | string | 标注标题（简短） |
| `content` | string | 标注内容（支持 Markdown） |
| `category` | string | 分类：`filter` / `field` / `action` / `rule` / `custom` |
| `source` | string | 来源章节（如 "3.5.3.1 设备档案"） |
| `createdAt` | string | 创建日期 |

## 分类说明

| category | 含义 | 自动标注时的来源 |
|----------|------|----------------|
| `filter` | 筛选条件 | 查询/筛选功能表格 |
| `field` | 字段说明 | 列表功能表格、表单字段表格 |
| `action` | 操作按钮 | 操作列、工具栏按钮 |
| `rule` | 业务规则 | 业务规则章节 |
| `custom` | 手动标注 | 用户手动添加 |
