# Axure HTML 导出包解析指南

> 目标：建立 **页面清单、导航关系、控件与交互线索**，供 `-原型盘点.md` 使用。不追求复现 Axure 运行时，只提取写 PRD 所需的结构信息。

## 1. 识别合法 Axure 导出包

典型目录特征（版本间略有差异，命中多项即可判定）：

| 路径/文件 | 作用 |
| --- | --- |
| `index.html` | 默认入口，内嵌或引用站点图 |
| `start.html` / `start_c_1.html` | 部分版本的启动页 |
| `data/document.js` 或 `document.js` | 项目元数据、页面树、sitemap |
| `files/<页面名>/` | 单页 HTML 与资源 |
| `files/<页面名>/data.js` | 该页控件数据、部分交互定义 |
| `resources/scripts/axure/` | Axure 运行时脚本 |
| `resources/css/` | 样式 |

用户只给 zip 内某一页 HTML → 按「本地页」处理，并向用户索要完整导出包或页面列表。

## 2. 推荐读取顺序

```text
1. data/document.js（或 document.js）
   → projectName、页面树、sitemap、默认首页
2. index.html / start.html
   → 左侧站点图链接、iframe 加载规则
3. 对每个业务页面（按 sitemap 顺序，跳过纯说明/废弃页若用户指明）：
   → files/<page>/<page>.html
   → 同目录 data.js（若存在）
4. plugins/、notes 注释块、axp 注解（若 HTML 内可见）
```

大项目（>30 页）：先完整列站点图，与用户确认 **本期盘点范围**（全量 / 某模块 / MVP 页面集），再深入读页。

## 3. document.js / sitemap 提取

关注字段（名称因版本略有不同）：

- `projectName`、`projectId`
- `sitemap` / `rootNodes`：页面 `pageName`、`url`、子节点
- `defaultAdaptiveView`（判断是否有移动端视图）

输出为 **页面树表格**（写入盘点稿 §2）：

| 序号 | 页面名称 | 文件路径 | 父级/模块 | 备注 |
| --- | --- | --- | --- | --- |

## 4. 单页 HTML 提取

### 4.1 布局与文案

从 DOM 中提取（忽略纯装饰图 unless 承载状态）：

- 顶部/侧边导航文案与当前高亮
- 标题、面包屑、Tab 标签
- 按钮、链接文案（含禁用态 class）
- 表单：label、placeholder、必填标识（*）
- 表格列头、列表项字段、空状态文案
- 弹窗/抽屉：标题、主副按钮文案

### 4.2 动态面板与多状态

Axure 常见 class/id 模式：`u<div>`、`ax_default`、`dynamic_panel`、`panel_state`。

- 同一面板下多个 `panel_state` → 记为 **状态列表**（如：默认 / 编辑 / 加载中）
- 若 HTML 只渲染默认态，在盘点中标 `[仅见默认态，其余状态见原型备注或待确认]`

### 4.3 交互与跳转（能读则读）

来源优先级：

1. 页面内 `<!-- 说明 -->` 或 Axure 注解文本
2. `data.js` 中 `interactionMap`、`cases`、`actions`（ONCLICK → OpenLink、ShowPanel、SetText 等）
3. HTML `onclick` 或内联脚本中的 `$axure.navigate` / `url`

整理为：

| 触发控件 | 事件 | 动作 | 目标页面/面板 | 条件（若有） | 来源 |
| --- | --- | --- | --- | --- | --- |
| 提交按钮 | click | 跳转 | 成功页 | — | data.js |
| 删除 | click | 确认弹窗 | — | — | 注解 |

解析失败 → 该行写 `[原型未标明]`，不猜业务规则。

### 4.4 母版与重复

多页相同顶栏/侧栏 → 盘点稿 **公共模块** 只写一次，各页引用「见 §3.1 全局导航」。

## 5. 常见陷阱

| 现象 | 处理 |
| --- | --- |
| 页面依赖 Axure 演示框架 iframe | 必须读 `files/` 下子页，不要只读外壳 index |
| 中文路径/空格 | 用工具 Read 时注意完整路径 |
| 图片按钮无文案 | 用附近注解或 `alt`/`title`；无则标 `[图标按钮-含义待确认]` |
| 变量与中继器 | 记录列结构与示例行；不写死后端 API |
| 自适应视图多套 HTML | 注明 Web/移动是否两套盘点，或请用户指定主视图 |

## 6. 最小示例（结构示意）

```text
export/
├── index.html
├── data/document.js          ← 先读：页面树
├── files/
│   ├── 登录/
│   │   ├── 登录.html
│   │   └── data.js           ← 按钮跳转、校验提示
│   └── 首页/
│       ├── 首页.html
│       └── data.js
└── resources/scripts/axure/
```

盘点时 **登录页** 至少产出：字段列表、按钮、错误提示文案、成功后跳转目标（来自 data.js 或注解）。
