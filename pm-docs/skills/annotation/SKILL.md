---
name: annotation
description: '> 原型标注工具。在页面上标注需求说明（字段说明、业务规则、交互逻辑等）， 开发人员和产品经理都能看到。标注与 UI 库完全解耦，通过注入专属
  class 定位。 触发场景：(1) "标注页面" "生成标注" "添加标注" "原型标注", (2) "给xx页面加标注" "标注xx功能", (3) "注入标注组件"
  "初始化标注"'
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

> **⚠️ `.agents/` 是外部资源包路径，本机已不存在**（`Documents/Claude/Product/.agents/` 已删除）。
> 下文凡引用 `.agents/knowledge/`、`.agents/agents/`、`.agents/agent-memory/` 的地方**读不到文件**，
> 按以下降级处理，**不要因此中止**：
> - `.agents/knowledge/**`（内容规范、质量清单）→ 用本技能 `references/` 下的模板与检查表；两者都缺时按通用工程规范执行并在产出里标注「无内容规范可依」
> - `.agents/agents/*.md`（子 Agent 派发）→ 不派发，由当前会话直接执行该角色的工作
> - `.agents/agent-memory/**`（跨会话记忆）→ 跳过读写，改为在产出里写清本次的决定
> - `.agents/rules/prd-to-srs-gate.md` → **已迁到 `../common/prd-to-srs-gate.md`**（库内权威副本）

## 技能路径解析

`generate-annotations.js` 在技能目录里，而它是**在用户项目根执行**的，相对路径不适用。先解析绝对路径：

```bash
resolve_skill() {
  name="$(printf '%s' "$@")"
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    [ -d "$CLAUDE_PLUGIN_ROOT/skills/$name" ] && { printf '%s' "$CLAUDE_PLUGIN_ROOT/skills/$name"; return 0; }
    for R in "$CLAUDE_PLUGIN_ROOT"/../*/skills; do
      [ -d "$R/$name" ] && { printf '%s' "$R/$name"; return 0; }
    done
  fi
  for R in "$HOME/.claude/skills" "${CODEX_HOME:-$HOME/.codex}/skills" "$HOME/.cursor/skills"; do
    [ -d "$R/$name" ] && { printf '%s' "$R/$name"; return 0; }
  done
  echo "未找到技能：$name" >&2; return 1
}
ANNO="$(resolve_skill annotation)"
```

# 原型标注工具

## 核心设计思路

**标注系统与 UI 库完全无关**。流程：

```
需求文档 → prd-analyzer 提取功能点（不碰代码）
              ↓
页面代码 → code-locator 为每个功能点定位 DOM 节点 + 分配唯一 class
              ↓
主流程 → 把 class 注入到代码里（Edit 工具）+ 生成标注 JSON（selector 用 .annot-xxx）
              ↓
标注组件 → 通过 .annot-xxx 选择器定位，永远精确命中
```

**不管项目用 Ant Design Vue / Element Plus / Vant / TDesign / Naive UI / shadcn-vue**，流程完全一样。

---

## Agent 协作架构

```
annotation skill（主流程）
  ├── Step 0: 确定 PROJECT_PATH、扫描需求文档
  ├── Step 1: 搭建完整运行环境（主流程亲自做，不派 agent）
  │           版本比对 + 组件注入/覆盖 + 依赖安装 + Vite 插件复制与注册 + 目录创建 + 路径适配
  │           → 以「步骤 1 完成验收清单」8 项自检，未全绿不得进入 Step 2
  ├── Step 2: annotation-prd-analyzer agent
  │           输入：需求文档 + 页面路由
  │           输出：功能点清单（title、category、content、location，不含 selector）
  ├── Step 3: annotation-code-locator agent
  │           输入：功能点清单 + 页面代码
  │           输出：注入清单（每个功能点对应的文件、行号、class 名、代码片段）
  ├── Step 4: 主流程执行代码注入 + 生成标注 JSON
  └── Step 5: 写入文件 + JSON 语法验证
```

**多页面并行**：Step 2 和 Step 3 可并行处理多个页面，Step 4 主流程串行注入。

---

## 工作流

### 步骤 0：确定 PROJECT_PATH

检查当前工作目录下是否存在多个含 `package.json` 的子目录：
- 若存在多个子项目（`dev/code/admin/`、`dev/code/mobile/`、`dev/code/web/` 等；存量项目可能在仓库根），根据用户描述判断目标子项目
- 无法判断时询问用户
- 确定后作为后续所有步骤的 **PROJECT_PATH**

扫描需求文档（**须 SRS 真源**）：
```
Glob("dev/SRS/*.md")
Glob("docs/SRS/*.md")                 # 兼容旧根
Glob("docs/01-需求与规划/*SRS*.md")   # 兼容更旧的归档路径
Glob("**/*需求*说明书*.md")
```

**门禁**：若未找到 SRS 但存在 `prd/PRD/*.md`（或旧路径 `docs/**/*-PRD.md`） → Read `../common/prd-to-srs-gate.md`，**中止**，路由 **`req-doc` Step F**。

找到合格 SRS 后记录路径。若既无 SRS 也无 PRD，告知 prd-analyzer 由其根据功能名称推断（降级，须在输出中标注）。

**扫描功能模块下的所有页面文件（重要）：**

根据功能名称定位路由目录后，必须列出该目录下的所有 `.vue` / `.tsx` 文件：

```bash
ls {PROJECT_PATH}/src/views/{ModuleDir}/
```

常见模式：
- `index.vue` → 列表页
- `Detail.vue` → 详情页
- `Create.vue` / `Edit.vue` → 新增/编辑页（独立路由时）
- `components/` → 子组件目录

**每个独立路由的页面文件都需要单独标注，生成独立的 JSON 文件。**
例如"工单台账"功能包含 `index.vue`（列表）和 `Detail.vue`（详情），需要分别生成：
- `rectification-workorder.json`
- `rectification-workorder-detail.json`

不要只标注列表页而遗漏详情页、新增页等子页面。

---

### 步骤 1：检查并注入标注组件

1. 读取 `{PROJECT_PATH}/package.json`，识别框架：
  - `dependencies` 含 `"vue"` → Vue 项目 → 使用 `templates/vue/`
  - `dependencies` 含 `"react"` → React 项目 → 使用 `templates/react/`
  - 两者都不含 → 询问用户
2. **版本比对（决定是否覆盖组件，每次都做）**：
  - 读取技能版本：`../annotation/version.json` 的 `version`（全局唯一版本号）
  - 读取项目版本：`{PROJECT_PATH}/src/components/Annotation/version.json` 的 `version`（项目侧副本，记录已装版本）
  - 比对决定动作：

| 项目侧情况 | 动作 |
| --- | --- |
| 组件目录不存在 / 无 version.json | 视为旧版 → **全量覆盖**所有组件 + 插件（+ React 的 annotation.css）+ 写入版本 |
| 项目 version < 技能 version | **全量覆盖** + 更新项目 version.json |
| 项目 version == 技能 version | 跳过覆盖，直接用现有组件 |

> 项目里若有未保存的本地组件改动，覆盖前提醒用户。正常情况下组件是技能统一维护的契约，不应在项目里手改。

1. **全量覆盖时**（首次安装或版本落后）：
  - 从对应框架模板目录复制**全部**组件到 `{PROJECT_PATH}/src/components/Annotation/`（覆盖同名文件）
  - 把技能 `version.json` 的 `version` 写入 `{PROJECT_PATH}/src/components/Annotation/version.json`
  - 首次安装时：在根布局组件中挂载 `<AnnotationOverlay />`、创建 `{PROJECT_PATH}/public/annotations/` 目录
2. 检查并安装依赖，每次都检查（即使组件已存在）
3. **注册标注保存中间件（Vite 项目必做，每次都检查 —— 缺失则标注只能显示、无法保存）**：
  - 将对应框架模板目录下的 `viteAnnotationPlugin.ts`（`templates/vue/` 或 `templates/react/`，两份内容相同、框架无关）复制到 `{PROJECT_PATH}/viteAnnotationPlugin.ts`（版本落后时一并覆盖）
  - 在 `vite.config.ts` 顶部 `import { annotationPlugin } from './viteAnnotationPlugin'`
  - 在 `plugins: [` 数组首项加入 `annotationPlugin()`
  - **校验**：复制组件后立即确认 `vite.config.ts` 已注册插件。只注入组件、不注册插件 = 流程未完成（这是常见遗漏点）。
  - **原因**：编辑模式下新增/修改标注通过 `POST /__annotation_save__` 写回磁盘，由该插件在 dev server 本地拦截并写入 `public/annotations/`。路径专门设计为不与常见的 `/api`、`/admin` 等 proxy 前缀冲突，无需调整项目代理配置。

> 注：非 Vite 构建工具（Webpack/Rspack 等）需自行实现等价的 `POST /__annotation_save__` 开发中间件，逻辑参考 `viteAnnotationPlugin.ts`（净化文件名防路径遍历、写入 `public/annotations/`）。

**加载/保存路径说明（通用性要点）：**
- 加载：`{import.meta.env.BASE_URL}annotations/{fileName}.json` —— 自动适配项目配置的 vite `base`（如 `/sub-path/`），不要写死 `/annotations/`
- 保存：`POST /__annotation_save__` —— 独立路径，不走 `/api` 等可能被代理的前缀



**Vue 项目依赖清单：**

| 包名 | 用途 |
| --- | --- |
| `marked` | Markdown 渲染 |
| `dompurify` | HTML 消毒（防 XSS） |
| `@tiptap/vue-3` | 富文本编辑器核心 |
| `@tiptap/starter-kit` | 富文本基础扩展 |
| `@tiptap/extension-table` | 富文本表格 |
| `@tiptap/extension-image` | 富文本图片 |
| `@tiptap/extension-text-style` | 富文本文字样式 |
| `@tiptap/extension-highlight` | 富文本高亮 |

**React 项目依赖清单：**

| 包名 | 用途 |
| --- | --- |
| `marked` | Markdown 渲染 |
| `dompurify` | HTML 消毒（防 XSS） |
| `@tiptap/react` | 富文本编辑器 React 绑定 |
| `@tiptap/starter-kit` | 富文本基础扩展 |
| `@tiptap/extension-table` | 富文本表格 |
| `@tiptap/extension-table-row` | 表格行 |
| `@tiptap/extension-table-header` | 表格表头 |
| `@tiptap/extension-table-cell` | 表格单元格 |
| `@tiptap/extension-image` | 富文本图片 |
| `@tiptap/extension-text-style` | 富文本文字样式 |
| `@tiptap/extension-highlight` | 富文本高亮 |
| `@tiptap/extension-color` | 文字颜色 |
| `@tiptap/extension-font-size` | 字号 |

---

#### 步骤 1 完成验收清单（环境未搭完不得进入步骤 2）

<EXTREMELY-IMPORTANT>
标注的运行环境由主流程在步骤 1 一次性搭建完整。只复制组件、不装依赖/不注册插件，等于环境没搭好——装上去也是"能显示不能保存"的半成品。
进入步骤 2 前，逐项确认下表全部为「是」，任何一项为「否」立即补齐。
</EXTREMELY-IMPORTANT>

| 检查项 | 验证方式 | 缺失后果 |
| --- | --- | --- |
| ① 组件已复制 | `src/components/Annotation/` 下组件齐全（Vue 8 个 / React 9 个含 css） | 页面无标注层 |
| ② 根布局已挂载 | 根组件含 `<AnnotationOverlay />` | 标注层不渲染 |
| ③ 标注目录已建 | `public/annotations/` 存在 | 保存无落点 |
| ④ 依赖已装 | `package.json` 含 marked + dompurify + tiptap 全套 | 富文本编辑器/渲染报错 |
| ⑤ 插件已复制 | 项目根目录有 `viteAnnotationPlugin.ts` | 保存中间件不存在 |
| ⑥ 插件已注册 | `vite.config.ts` 的 `plugins` 数组含 `annotationPlugin()` | 保存请求 404/被代理 |
| ⑦ 路径已适配 | `useAnnotation` 加载用 `BASE_URL`、保存用 `/__annotation_save__` | base 非根或有 proxy 时失效 |
| ⑧ 版本已同步 | `src/components/Annotation/version.json` 的 version == 技能 version.json | 项目用旧版组件，已修的 bug 复现 |

⑤⑥⑦ 是最容易漏的三项，也正是"标注能显示但编辑后存不进 JSON"的根因。⑧ 保证项目组件不落后于技能修复。

---

### 步骤 2：分析需求（PRD Analyzer）

使用 `Agent` 工具，`subagent_type: "annotation-prd-analyzer"`，传入：

```
PAGE_PATH: {目标页面路由}
REQ_DOC_PATH: {步骤 0 找到的需求文档路径，找不到传空}
FEATURE_NAME: {功能名称}
PROJECT_PATH: {子项目根目录}
```

**产出**：功能点清单（JSON 数组），每个元素包含 `title / category / content / source / location / container`。

> agent 只读需求文档，不碰代码、不写选择器。

---

### 步骤 3：代码定位（Code Locator）

使用 `Agent` 工具，`subagent_type: "annotation-code-locator"`，传入：

```
PAGE_PATH: {页面路由}
PROJECT_PATH: {子项目根目录}
功能点清单: {步骤 2 的 JSON 数组}
```

**产出**：注入清单（JSON），包含：
- `pageFile`：页面组件绝对路径
- `injections[]`：每个功能点对应的 `className / file / line / operation / targetSnippet / newSnippet`

> agent 读代码、识别 DOM 区域、分配唯一 class、输出精确的 Edit 指令。

---

### 步骤 4：执行注入 + 生成标注 JSON

#### 4.1 注入 class 到代码

遍历注入清单，用 Edit 工具按 `targetSnippet → newSnippet` 做精确替换。

- `append-class`：已有 class 属性 → 追加
- `new-class`：没有 class 属性 → 新增
- `wrap-with-span`：元素外包一层 `<span class="annot-xxx">`

每个注入都必须验证 Edit 成功（Edit 工具会自动报错）。

#### 4.2 生成标注 JSON

将功能点清单和注入清单合并，生成最终的标注 JSON：

```json
{
  "page": "{PAGE_PATH}",
  "title": "{FEATURE_NAME}",
  "updatedAt": "YYYY-MM-DD",
  "annotations": [
    {
      "id": "{className}",
      "type": "selector",
      "selector": ".{className}",
      "position": { "x": 0, "y": 0 },
      "title": "{title}",
      "content": "{content}",
      "category": "{category}",
      "source": "{source}",
      "container": "{container}",
      "createdAt": "YYYY-MM-DD"
    }
  ]
}
```

**关键规则**：
- `selector` 永远是 `.{className}` 格式（注入的唯一 class）
- `container` 仅在 `modal` / `drawer` 时设置，`page` 可省略
- `content` 字段里的双引号转义为 `\"`

---

### 步骤 5：写入文件并验证

1. 将 JSON 写入 `{PROJECT_PATH}/public/annotations/{fileName}.json`
  - fileName：路由去斜杠（`/inspection/task` → `inspection-task.json`）

1. **必须验证 JSON 语法**：
```bash
python3 -c "import json; json.load(open('{文件路径}')); print('JSON 语法正确')"
```

1. 告知用户：
  - 标注文件路径
  - 已注入的 class 列表（让用户知道代码做了哪些修改）
  - 刷新页面即可看到标注点

---

## 关键原则

1. **selector 永远是 **`.annot-xxx`：不依赖任何 UI 库 class、不依赖原有 class
2. **class 全局唯一**：`annot-{pageKey}-{category}-{slug}` 命名规范
3. **最小侵入**：只加 class，不改其他属性、不改结构
4. **class 永久保留**：标注 class 跟业务代码一起维护，作为约定保留

---

## 标注数据规范参考

- Read(".agents/knowledge/phase2-design/strategy.md") — 区域划分、什么该标
- Read(".agents/knowledge/phase2-design/content-format.md") — 内容格式、文案要求
- Read(".agents/knowledge/phase2-design/selector-patterns.md") — class 命名规范、注入策略

---

## 组件模板

- Vue 模板：`templates/vue/`（含 AnnotationOverlay、AnnotationDot、AnnotationPanel、AnnotationEditor、useAnnotation、annotationTracker、annotationRegistry、types、**viteAnnotationPlugin**）
- React 模板：`templates/react/`（含 AnnotationOverlay、AnnotationDot、AnnotationPanel、AnnotationEditor、useAnnotation、annotationTracker、annotationRegistry、types、annotation.css、**viteAnnotationPlugin**）

### 版本维护约定（改组件必读）

<EXTREMELY-IMPORTANT>
标注组件用 `../annotation/version.json` 的单一全局版本号管理（Vue/React 共用）。
**改动 **`templates/vue/`** 或 **`templates/react/`** 下任何组件（含 css、插件）后，必须把 version +1。**
不升版本 = 已装项目无法感知更新，下次标注仍用旧组件，已修的 bug 会复现。
version 是「组件契约版本」，不是 npm 包版本，只用于判断新旧、触发覆盖。
</EXTREMELY-IMPORTANT>

标注前（步骤 1）主流程比对技能 version 与项目 `src/components/Annotation/version.json`，项目落后或缺失则全量覆盖组件并写入新版本（详见步骤 1 第 2-3 点）。

### React 项目挂载方式

在根布局组件（如 `App.tsx` 或 `Layout.tsx`）中：

```tsx
import { AnnotationOverlay } from '@/components/Annotation/AnnotationOverlay'

function App() {
  return (
    <>
      {/* 路由内容 */}
      <AnnotationOverlay />
    </>
  )
}
```

React 版使用 `react-router-dom` 的 `useLocation()` 和 `useMatches()` 获取路由信息，项目需已安装 `react-router-dom`。

**同样需注册保存中间件**：将 `templates/react/viteAnnotationPlugin.ts` 复制到项目根目录，在 `vite.config.ts` 的 `plugins` 数组首项加入 `annotationPlugin()`（详见步骤 1 第 5 点）。缺失则编辑模式无法保存标注。
