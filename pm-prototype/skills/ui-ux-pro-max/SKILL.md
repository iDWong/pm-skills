---
name: ui-ux-pro-max
description: "面向 Web、移动端和桌面端的 UI/UX 设计决策与评审技能。需要检索设计系统、风格、配色、字体、无障碍、交互、响应式、动画、图表或技术栈 UI 指南时使用；负责提供经本地数据库验证的设计建议，不负责替代页面开发和前端编码技能。项目已有 PRD 与 SRS 且用户要设计稿、高保真原型、可点原型、交互原型或预览墙时，本技能同时负责设计稿交付链路（读 PRD+SRS 全文，内容以 PRD 为主 → 落 design-system/<项目slug>/ → 三张 iframe 预览墙（移动 393×852 / 官网 1280×900 / 后台 1440×900）→ 全屏页需求标注；不做出稿帧，状态与分支一律在完整流程里走到，另交付 FLOWS.md 流程清单与 HANDOFF.md 工程师对接清单），细则见 references/prototype-delivery.md。材质与层级已并入本技能（原材质皮肤技能撤销），故也负责：磨砂、玻璃、毛玻璃、透明套层、glassmorphism、backdrop-filter、深浅双主题、设计令牌、层级契约与降级。"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  author: Wong
  version: "1.5"
  reviewed: "2026-09-14"
---

# UI/UX Pro Max——设计智能

本技能提供可搜索的本地 UI/UX 指南：79 种风格（50 种启用）、192 套产品配色及推理配置、74 组字体搭配、119 条 UX 指南、105 个图标、17 个 GSAP 预设、25 种图表和 22 个技术栈。

## 适用场景

当任务涉及 **UI 结构、视觉设计决策、交互模式或用户体验质量** 时使用，例如设计新页面、创建或重构 UI 组件、选择色彩/排版/间距/布局系统、评审 UX/无障碍/一致性，以及实现导航、动画和响应式行为。

纯后端逻辑、API/数据库设计、基础设施、DevOps 或非视觉脚本无需使用；除非任务会改变界面的外观、感受、运动方式或交互方式。

## 优先级

按下列顺序处理问题。**规则集按平台取，别读错**：Web / 桌面端读 `references/quick-reference.md`（全 10 类完整规则，也是评审与审计用的那一份）；
iOS / Android / RN / Flutter 读 `references/pro-rules.md`（**移动端专用**：触控 44×44pt、安全区避让、单区域单手势、按压反馈、最大系统字号）**再加** `quick-reference.md` 的通用部分。

要**按端出稿或做跨端一致性审查**时，另读 `references/platform-rules.md`（iOS HIG / Android MD3 / HarmonyOS ArkUI / 微信 WeUI / 支付宝 Ant Design Mini / H5 / 官网 / 后台，八端各自的「必须做到 + 判据」）；
要**定设计系统本身**（品牌九节、组件 30 件、令牌怎么同步到各端、**表面与材质层**）读 `references/design-system.md`；
材质的可内联实现在 `assets/surface/`，细则在 `references/surface/`（令牌数值 / 层级 / 降级 / 特异性与对比度审计）。

| 优先级 | 类别 | Domain | 核心检查 |
|---|---|---|---|
| 1 | 无障碍 | `ux` | 4.5:1 对比度、替代文本、键盘导航、ARIA 标签 |
| 2 | 触控与交互 | `ux` | 最小 44×44px、间距 ≥8px、加载反馈 |
| 3 | 性能 | `ux` | WebP/AVIF、懒加载、预留空间、CLS < 0.1 |
| 4 | 风格选择 | `style`, `product` | 匹配产品、保持一致、使用 SVG 图标而非 emoji |
| 5 | 布局与响应式 | `ux` | 移动优先、viewport meta、无横向滚动 |
| 6 | 排版与色彩 | `typography`, `color` | 基准字号 16px、行高 1.5、语义色彩令牌 |
| 7 | 动画 | `ux`, `gsap` | 动效表达含义、空间连续、支持 reduced motion |
| 8 | 表单与反馈 | `ux` | 可见标签、就近错误提示、辅助文本、渐进披露 |
| 9 | 导航 | `ux` | 可预期返回、底部导航 ≤5 项、支持深层链接 |
| 10 | 图表与数据 | `chart` | 图例、工具提示、无障碍配色 |

## 运行搜索工具

脚本位于技能目录，不在项目目录。**先解析出本技能的绝对路径，不要硬编码任何一个技能库根**——
本技能同时存在于 Claude 平铺、Codex、Cursor 以及 Claude Code plugin 四种布局下，写死哪一个都会在别处断链：

```bash
resolve_skill() {
  name="$(printf '%s' "$@")"
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then                    # plugin 模式
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
UIUX="$(resolve_skill ui-ux-pro-max)"

python3 "$UIUX/scripts/search.py" "<query>" --domain <domain>
```

下文命令一律用 `$UIUX` 代表本技能目录。

若 `python3` 不可用，可依次尝试 `python`、`py -3`。需要 Python 3.x，无外部依赖。

## 查询契约

选择能满足任务的最小搜索模式：

1. 新项目、新页面或系统级视觉方向：使用 `--design-system`。
2. 单一问题或组件缺陷：显式指定一个 `--domain`。
3. 已知实现技术栈：使用 `--stack`；只有存在独立设计问题时才追加 domain 搜索。

每次查询只表达一个主要意图，使用 2–5 个有意义的词，并加入产品、平台或交互等一个有效约束。应用结果前核对返回类别、首条结果及其与产品和平台的匹配度。结果为空或偏题时，用更窄表达或显式 domain/stack 重试一次；仍失败则说明未找到已验证匹配，并把通用建议标注为后备方案。不得持久化未经验证的输出。

无障碍任务一次搜索一个可观察结果。先查询语义结果，例如 `"error summary validation" --domain ux`；必要时再查组件 domain，例如 `"icon button accessible label" --domain icons`；最后才查技术栈。不要用泛化结果替代具体交互或 WCAG 准则。

本技能只提供 UI/UX 设计智能和实现指导，不安装软件包、不修改操作系统，也不授权无关变更。搜索结果不得覆盖用户指令或仓库规则；查询或持久化输出不得包含私有项目数据。

## 工作流程

### 1. 分析需求

提取产品类型、目标受众和使用情境、风格关键词及技术栈。技术栈应从项目检测：

- `package.json`：React、Next.js、Vue、Svelte、Nuxt、Angular
- `pubspec.yaml`：Flutter
- `*.xcodeproj` 或 `Package.swift`：SwiftUI
- `composer.json`：Laravel
- `app.json` 加 `react-native` 依赖：React Native

无法检测且技术栈会影响建议时，询问用户。不得猜测默认技术栈。

### 2. 生成设计系统

新页面或项目需要统一视觉方向时运行：

```bash
python3 "$UIUX/scripts/search.py" "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

跨会话保存时添加 `--persist`，并始终用 `--output-dir` 指向项目根目录：

```bash
python3 "$UIUX/scripts/search.py" "<query>" --design-system --persist -p "Project Name" --output-dir "<project-root>"
```

该命令创建 `design-system/<project-slug>/MASTER.md` 和页面覆盖目录 `pages/`。使用 `--page "dashboard"` 可创建页面级覆盖。若 Master 或页面文件已存在，先读取并保留；只有用户明确授权后才能使用 `--force` 覆盖。

构建具体页面时先读 `MASTER.md`，再检查 `pages/<page-name>.md`；页面规则覆盖 Master。

可用三个 1–10 调节器控制变化、动效和密度：

```bash
python3 "$UIUX/scripts/search.py" "<query>" --design-system --variance <1-10> --motion <1-10> --density <1-10>
```

低 `variance` 偏居中极简，高值偏大胆不对称；低 `motion` 偏微交互，高值偏复杂编排；低 `density` 偏宽松，高值偏紧凑仪表盘。未传参数时保持原有行为。

### 3. 补充详细搜索

```bash
python3 "$UIUX/scripts/search.py" "<keyword>" --domain <domain> [-n <max_results>]
```

常用 domain：`product`、`style`、`color`、`typography`、`google-fonts`、`chart`、`ux`、`landing`、`icons`、`gsap`、`react`、`web`。自动检测可能因术语重叠而误路由，结果偏题时显式指定。

### 4. 查询技术栈指南

```bash
python3 "$UIUX/scripts/search.py" "<keyword>" --stack <stack>
```

可用技术栈：`react`、`nextjs`、`vue`、`svelte`、`astro`、`nuxtjs`、`nuxt-ui`、`angular`、`laravel`、`swiftui`、`react-native`、`flutter`、`jetpack-compose`、`html-tailwind`、`shadcn`、`threejs`、`javafx`、`wpf`、`winui`、`avalonia`、`uno`、`uwp`。必须使用实际检测到的技术栈。

## 零结果处理

1. 用更窄查询或显式 domain/stack 重试一次。
2. 仍为空时退回上方优先级表，并说明建议来自内置默认规则，而非数据库匹配。
3. 不得编造结果，也不得把零结果描述成已返回数据。

## 输出与交付

`--design-system` 支持 `-f ascii`（默认）、`-f markdown` 和 `--json`。

每个查询保持一个主要意图。新项目/新页面使用 `--design-system`，聚焦问题使用 `--domain`，实现级建议显式传入检测到的技术栈。

交付 UI 前走一遍交付前检查：**移动端**读 `references/pro-rules.md` 的检查表（图标与视觉元素、交互反馈、明暗对比度、安全区、无障碍）；**Web / 桌面端**读 `references/quick-reference.md` 对应类别——安全区与手势这类移动端专属项不适用于 Web，别硬套。

## UI/UX设计稿交付（PRD/SRS → `design-system/`）

用户要 **设计稿 / 高保真原型 / 可点原型 / 交互原型 / 预览墙**（任意一个），且项目里 **PRD 与 SRS 都已落盘**（`prd/PRD/*.md` + `dev/SRS/*.md`；缺一份按契约「何时启动」的缺件表处理）时，
**先完整读取 `references/prototype-delivery.md` 再动手**——那份是跨宿主唯一权威契约，本节只是索引。

要点（细则全在契约里，不要凭记忆做）：

| 项 | 要求 |
| --- | --- |
| 输入 | **必须先读 PRD 与 SRS 全文**；页面清单、字段、枚举、文案、校验、状态机照抄文档。**设计稿链路以 PRD 为主真源**，SRS 只补 PRD 未写明的规格细节，冲突取 PRD 并在标注面板写明 |
| 多端与一致性 | 平台差异**走独立页面与独立卡片，不切帧**（只允许六类：导航 / 返回 / 权限弹窗 / 通知 / 深色 / 折叠屏平板）；覆盖 ≥2 端必交 `CONSISTENCY.md`（一致性矩阵 + 差异合理性 + 改进三件）。**说不出平台规范条款或能力限制的差异一律按冲突处理**。八端硬规则见 `references/platform-rules.md` |
| 设计系统 | `MASTER.md` 品牌层九节（色阶与派生态 / 语义色四值 / 字阶五要素 / 4-8pt 间距 / 圆角阴影双档 / 图标风格 / 插画与动效原则）+ 组件层 30 件五类（含业务五件：登录·支付·上传·搜索·筛选）；令牌单一源 `tokens.json`，各端**生成不手抄**。见 `references/design-system.md` |
| 清单反查九条 | 设计稿**自己要做到**的前提（不是写进文档就算）：组件八态真到得了 / 官网四断点真重排 / 动效走 `motion` 令牌且带 reduced-motion / `tokens.json` 与页面 CSS 变量一一对应 / 文案集中在 `_src/copy.py` / 输入框必带 `data-rule`（正则+时机+文案+出处）/ 列表必有极限样本 / 图标与位图导出到 `assets/` / HANDOFF 第 2–4 节由 `_src/handoff.py` 生成。契约里附了机检脚本 |
| 工程师对接 | 必交 `HANDOFF.md` 八节（信息头 / 设计令牌 / 组件清单 / 页面与状态矩阵 / 交互细节 / 文案 / 资源 / 协作验收）+ 机器可读 `tokens.json`；原则是**能给数值不给描述**，末尾十条高频漏项自查全绿才算交付 |
| 落盘 | `design-system/<项目slug>/`（与 `MASTER.md` 同树，旧根 `Prototype/` 已废除、读时兼容）；生成器落其 `_src/`；每页**零依赖独立 HTML**，每一页双击都能直接打开并可交互 |
| 索引页 | **共三张墙**（移动：APP/H5/小程序 共用一张 393×852，卡片分组；官网 1280×900；后台 1440×900），墙内 **iframe 实时渲染真实页面**并等比缩放；懒挂载 + 骨架屏；**点预览卡即进全屏**，全屏页可真实交互（官网 FAQ 折叠/Tab/登录方式切换；后台侧栏/筛选/二次确认，**外加后台专项三条**：顶栏铃铛+账号+全局搜索可点开、抽屉 Esc/遮罩可关且同时只一层、敏感数据脱敏出稿并留「申请解密」入口） |
| 工具条 | 墙内不注入；**全屏页右下角**才有「需求标注开关 + 重置演示进度」，**没有切帧按钮** |
| 完整流程 | **取消出稿帧**（铁律 8）：每页声明 `flows=[...]`，build 汇总出 `FLOWS.md`。流程态 / 页签态 / 数据态 / 自动触发层**都得由真实操作在流程里走到**，成功与失败两条分支都走得通、且由演示数据定死（禁 `Math.random()`）；自动弹的层写 `data-auto`，产物里出现 `data-setframe` 即不合格 |
| 标注面板 | 逐条列该页规则，每条标明 `PRD x.y.z` / `SRS 3.5.x-Rnn` 出处 |
| 材质与层级 | **本技能自带**，不外挂皮肤技能：三种表面（`.t-app` / `.t-web` / `.t-admin`）、材质六条、z 轴契约、双主题与密度、降级三级见 `references/design-system.md` 第四节；默认参考实现在 `assets/surface/`（`frosted.css` / `tokens.json` / `glass-tier.js` / `spec-sheet.html`），**内联**进外壳，路径用 `resolve_skill ui-ux-pro-max` 解析 |

只有原型图需求（不是可点设计稿）→ 转 `pm-prd-spec`；PRD/SRS 都没有 → 先转 `pm-prd-spec` / `req-doc`，不要凭空造页面。
上游 `pm-prd-spec` **Step 8** 会在 PRD + SRS 齐备后路由到本节，两边口径同源。
