# 标注技能使用指南

## 支持框架

- **Vue 3**（Vue Router + Composition API）
- **React 18+**（React Router DOM v6+）

自动检测：读取 `package.json` 的 `dependencies`，含 `vue` 用 Vue 模板，含 `react` 用 React 模板。

## 快速开始

### 1. 自动生成标注（推荐）

当你需要为某个页面生成标注时，直接告诉 Claude：

```
给 /equipment/vendor 页面生成标注
```

Claude 会：
1. 读取页面组件代码
2. 分析组件中的表单字段、表格列、按钮等元素
3. 注入唯一的 `.annot-xxx` class 到代码中
4. 生成标注 JSON 数据
5. 保存到 `public/annotations/equipment-vendor.json`

### 2. 手动添加标注

在浏览器中：
1. 按 `Ctrl+Shift+U` 进入编辑模式
2. 点击页面任意位置添加标注点
3. 填写标注内容并保存
4. 点击"导出"按钮下载 JSON 文件

## 标注数据示例

```json
{
  "page": "/equipment/vendor",
  "title": "供应商管理",
  "updatedAt": "2026-04-23",
  "annotations": [
    {
      "id": "ann-001",
      "type": "selector",
      "selector": ".filter-card .ant-input[placeholder='供应商名称']",
      "position": { "x": 0, "y": 0 },
      "title": "供应商名称筛选",
      "content": "支持模糊搜索，输入关键词后点击搜索或回车",
      "category": "filter",
      "source": "3.2.1 供应商管理",
      "createdAt": "2026-04-23"
    },
    {
      "id": "ann-002",
      "type": "selector",
      "selector": ".ant-table-thead th:nth-child(1)",
      "position": { "x": 0, "y": 0 },
      "title": "供应商编码列",
      "content": "系统自动生成，格式：SUP + 6位数字",
      "category": "field",
      "source": "3.2.1 供应商管理",
      "createdAt": "2026-04-23"
    },
    {
      "id": "ann-003",
      "type": "position",
      "selector": "",
      "position": { "x": 85.5, "y": 12.3 },
      "title": "新增按钮",
      "content": "点击打开新增供应商表单",
      "category": "action",
      "source": "3.2.1 供应商管理",
      "createdAt": "2026-04-23"
    }
  ]
}
```

## CSS 选择器最佳实践

### ✅ 推荐写法

```css
/* 使用 placeholder 属性 */
.ant-input[placeholder='供应商名称']

/* 使用唯一 class */
.vendor-name-filter

/* 使用 ID */
#vendor-search-btn

/* 组合选择器 */
.filter-card .ant-form-item:first-child .ant-input
```

### ❌ 避免使用

```css
/* nth-child 容易失效 */
.ant-form-item:nth-child(3) .ant-input

/* 过于宽泛 */
.ant-input

/* 依赖动态生成的 class */
.ant-input-affix-wrapper-focused
```

## 定位方式选择

### type: "selector"（推荐）

- 使用 CSS 选择器定位元素
- 自动跟随元素位置变化
- 适合表单字段、表格列、按钮等固定元素

### type: "position"

- 使用百分比坐标定位
- 固定在页面特定位置
- 适合手动标注、无法用选择器定位的元素

## 标注分类

| category | 含义 | 使用场景 |
|----------|------|---------|
| `filter` | 筛选条件 | 搜索框、下拉选择器、日期选择器 |
| `field` | 字段说明 | 表单字段、表格列 |
| `action` | 操作按钮 | 新增、编辑、删除、导出等按钮 |
| `rule` | 业务规则 | 权限控制、数据校验、流程规则 |
| `custom` | 自定义 | 手动添加的标注 |

## 常见问题

### Q: 标注点不显示？

1. 检查 JSON 文件是否存在于 `public/annotations/` 目录
2. 检查文件名是否正确（路由路径转文件名）
3. 刷新页面，清除浏览器缓存
4. 检查浏览器控制台是否有错误

### Q: 选择器定位失效？

1. 在浏览器控制台测试选择器：`document.querySelector('选择器')`
2. 如果返回 `null`，说明选择器无效
3. 改用更精准的选择器，或改用百分比坐标（type: "position"）

### Q: 如何批量生成标注？

目前需要逐个页面生成。未来可以扩展批量生成功能：

```bash
# 遍历所有页面组件
for page in src/views/**/*.vue; do
  # 调用生成脚本
  node .agents/skills/annotation/generate-annotations.js $page
done
```

## 进阶用法

### 结合需求文档生成

```
给 /equipment/vendor 页面生成标注，参考 docs/requirements/设备管理需求说明书.md
```

Claude 会从需求文档中提取功能说明，生成更详细的标注内容。

### 自定义标注样式

**Vue 项目**：修改 `src/components/Annotation/AnnotationDot.vue` 中的 `<style>` 部分。

**React 项目**：修改 `src/components/Annotation/annotation.css` 中的 `.annotation-dot` 样式。

```css
.annotation-dot {
  background: #1677ff; /* 修改标注点颜色 */
  width: 24px;         /* 修改标注点大小 */
}
```

### 导出所有标注

```bash
# 打包所有标注文件
tar -czf annotations.tar.gz public/annotations/
```
