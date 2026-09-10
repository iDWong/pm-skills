---
name: pm-master
description: |
  产品经理 Skill 库唯一入口 + 产品全生命周期单一流程（13 阶段）。管理 37 个 PM Skill + 11 个同链路的非 pm- 技能（SRS/设计/交付/标注链）。
  流程链：战略框架 → 上市与ICP → 市场调研 → 用户画像 → 功能优先级 → 产品路线图 → 需求澄清
  → 需求文档（SRS/PRD）→ 前端原型 → 测试用例 → 操作手册 → 发版说明 → 上线审计。
  能力：(1) 单点需求直接路由到最合适的 Skill (2) 多步需求按同一条流程裁剪出阶段区间并编排
  (3) 判断类问题转交 pm-advisory-board 组织专家评审 (4) 入口处让用户选「默认档／深度档」，并支持断点续跑与中途换挡。
  触发词：「pm-master」「产品总控」「我该用哪个 Skill」「帮我推进这个需求」「从头到尾走一遍」
  「完整链路」「完整流程」「走完整流程」「一键生成所有文档」「完整产品交付」「从0到1」「新产品立项」
  「产品全流程」，或者用户描述了一个产品工作场景但没指明用哪个 Skill、或任务明显需要多个 Skill 接力时。
---

# pm-master：产品全生命周期总控

> 定位：**入口 + 唯一流程**。你不亲自产出内容，你的工作是：判断这是单点还是多步 →
> 单点直接路由，多步按同一条流程裁剪出阶段区间 → 保证上一步产出是下一步的合法输入。
>
> **库里只有一条流程。** 所谓「快速流程」「立项流程」都是同一条流程的裁剪，阶段编号永不改变。

## 分诊（三类，先判这个）

| 类型 | 特征 | 怎么办 |
|---|---|---|
| **判断类** | 要的是一个结论或视角：该不该做、是真是假、值不值、方向对不对 | 转 `pm-advisory-board`，**不要起流程** |
| **单点类** | 要的是一份可交付物，且只要这一份 | 按下方路由表选 1 个 Skill，**不要起流程** |
| **流程类** | 横跨多步、说了「完整走一遍/从 0 到 1/全套文档」、或在项目目录里要落盘 | 起流程：定裁剪 → 建任务清单 → 逐阶段执行 |

判不清单点还是流程：**问一句「只要这一份，还是要往后接着做？」** 不要自己假设。

## 一条流程，13 个阶段

**档位在入口就问定**（Step 0 问题3），不是等用户嫌浅了再换。四个阶段有双档：

| # | 阶段 | 默认档 | 深度档 | 产出 |
|---|---|---|---|---|
| -2 | 战略框架 | `pm-strategy-frameworks` | — | `docs/strategy.md` |
| -1 | 上市与 ICP | `pm-gtm` | — | `docs/gtm.md` |
| 0 | 市场调研 | `pm-market-research` | — | `docs/market-research-*.md` |
| 1 | 用户画像 | `pm-user-persona` | — | `docs/user-persona-*.md` |
| 2 | 功能优先级 | `pm-feature-prioritization` | `pm-prioritization-engine` | `docs/feature-priority-*.md`（**流程代写**） |
| 3 | 产品路线图 | `pm-roadmap` | `pm-roadmap-planner` | `docs/roadmap-*.md` |
| 4 | 需求澄清 | （本技能直接做） | — | `docs/requirements.md` |
| 5 | 需求文档 | `req-doc`（SRS）／`prd-writer`（PRD） | `pm-prd-spec`（字段级+线框图，**流程须代为登记 SPEC_SOURCE**） | `docs/SRS/` 或 `docs/PRD/` |
| 6 | 前端原型 | `page-generator` | — | `src/` |
| 7 | 测试用例 | `pm-test-cases` | — | `docs/*测试用例*.md` |
| 8 | 操作手册 | `pm-operation-manual` | — | `docs/*操作手册*.md` |
| 9 | 发版说明 | `pm-release-notes` | — | `docs/release-notes-*.md`（**流程代写**） |
| 10 | 上线审计 | `pm-ai-ship-audit` | — | `reports/` |

> **产出路径一律按 glob 匹配**：各阶段技能的实际命名带产品名／日期／版本号，写死精确文件名门禁永远过不了。
> 阶段2 和阶段9 的技能**是纯对话输出不写文件**，流程必须代写到表中路径——细则见 `references/flow-engine.md`。

> **阶段5 的技能选择有硬约束**：只有 `req-doc`、`prd-writer` 认识流程契约（登记 `SPEC_SOURCE` 供阶段6–9 读取）。
> `pm-prd-spec` 认识落盘目录但**不登记 SPEC_SOURCE**，用它时流程必须在阶段5 收尾时代为登记。
> **`pm-prd-writer` 不要在流程内当阶段5**——它不登记真源也不知道 `docs/SRS/`、`docs/PRD/` 约定，
> 跑完阶段6 会拿不到规格。它是单点技能（模糊需求 → 可评审 PRD + 需求体检），走单点路由。

**阶段 5 不可跳过**——后续全部依赖它登记的 `SPEC_SOURCE`。其余阶段的跳过判据见 `references/tailoring.md`。

**读这三个文件再动手（不要凭记忆跑流程）：**
- `references/flow-engine.md` — Step 0 初始化五问、任务清单规范、阶段间传递门禁、并行规则、按交付模式的确认节点、进度汇报格式、目录规范、断点续跑判断逻辑
- `references/tailoring.md` — 裁剪表（全量/立项/标准/快速/只要文档/迭代/上线体检）、逐阶段跳过判据、默认档与深度档换挡规则
- `references/stages/s<N>-*.md` — 每个阶段的执行细则，**进入该阶段时读那一个**，不要一次全读

## 常用裁剪（细则见 tailoring.md）

| 裁剪 | 阶段区间 |
|---|---|
| 全量（从 0 到 1） | -2 → 10 全部 |
| 立项 | -2, -1, 0, 1, 2, 3 |
| 标准交付 | 0 → 9 |
| 快速交付 | 4, 5, 6, 7, 8 |
| 只要文档 | 4, 5, 7, 8, 9（跳过 6） |
| 迭代 | 4, 5, 6, 7, 9 |
| 上线体检 | 10 |

## 单点路由表

用户只要一份产出时用这张表，**不要起流程**。备注列写清了同一件事有两个技能时怎么选。

| 用户在说什么 | 路由到 | 备注 |
|---|---|---|
| 该往哪个方向长 / 市场值不值得进 / 护城河 / SWOT / 各种画布 | `pm-strategy-frameworks` | |
| 怎么定价 / 怎么变现 / 商业化路径 | `pm-strategy-frameworks` | 先定变现方式再定价格，别反 |
| 上市计划 / 第一批客户 / ICP / 渠道怎么选 / 增长循环 | `pm-gtm` | |
| 北极星指标 / 定位语 / 起名字 / 对外文案 | `pm-growth-marketing` | |
| AI 写的代码能不能上线 / 安全性能审计 / 代码和文档对不上 | `pm-ai-ship-audit` | |
| 写 PRD（快速可评审） | `pm-prd-writer` | 需求真伪存疑 → 先过顾问团 |
| 写 PRD（字段级可开发、要线框图和 Word） | `pm-prd-spec` | |
| 已有 PRD 要评估改进 / 要过 PRD→SRS 门禁 | `prd-writer` | |
| 要 SRS 需求规格说明书 | `req-doc` | 含研发原型时的真源 |
| 帮我看看这个 PRD / 过评审 | `pm-review-board` | |
| 需求怎么排（多模型交叉 + 敏感性） | `pm-prioritization-engine` | 只要快速排一轮且落盘 → `pm-feature-prioritization` |
| 排期 / 版本规划（要甘特图和风险缓冲） | `pm-roadmap-planner` | 项目内快速出图并落盘 → `pm-roadmap` |
| 指标为什么跌了 / 归因分析 | `pm-analytics` | 要建指标体系/漏斗/留存框架 → `pm-product-metrics` |
| 做个 A/B 实验 / 灰度方案 | `pm-experiment-designer` | |
| 埋点 / 事件设计 / 指标口径 | `pm-tracking-spec-writer` | |
| 设计问卷 | `pm-survey-designer` | 访谈提纲 → 顾问团 Mom Test；项目内访谈 → `pm-user-interview` |
| 竞品分析（深度拆解） | `pm-competitor-deconstructor` | 要销售用的对抗卡片 → `pm-gtm` 战报卡 |
| 复盘 / 迭代总结 | `pm-postmortem-writer` | |
| 截图做成原型 | `pm-image2proto`（HTML）/ `pm-image2pencil`（设计稿） | 问用户要哪种交付物 |
| 要设计稿 / 高保真原型 / 可点原型 / 交互原型 / 预览墙 | `ui-ux-pro-max` | **需 PRD+SRS 齐备**；缺件处理见下方判据 |
| 照着这个网站做 | `pm-url2proto` | |
| 定 OKR | `pm-okr-designer` | |
| 迭代规划 / sprint | `pm-sprint-planning` | |
| 发版说明 | `pm-release-notes` | |
| 操作手册 / 用户指南 | `pm-operation-manual` | |
| 测试用例 | `pm-test-cases` | |
| 对上汇报 | `pm-stakeholder-report` | |
| 该不该做 / 真伪需求 / 价值取舍 / 功能工厂 | `pm-advisory-board` | 判断类全部转交 |

路由后说明选择理由（一句话），确认后加载执行。用户明显着急或指令明确时**直接执行，不要多问**。

**单点命中双档技能时，先问一句档位**（优先级 / 路线图 / 需求文档 / 数据分析这四类）：

> 「这一步要**默认档**（快，产出精简）还是**深度档**（<该阶段深度档多给的东西>）？」

用户的措辞已经点明档位时不要问——出现「甘特图」「多模型」「敏感性分析」「字段级」「线框图」「导出 Word」
「HTML 报告」这类词，直接走深度档；出现「快速」「先粗排一版」「简单看下」，直接走默认档。

## 专家顾问团（判断型）

判断类一律转 `pm-advisory-board`（顾问团子总控），由它路由或召开评审会。**不要重复它的路由表。**
成员列在这里只为名册完整与降级：

专家视角 `pm-advisor-cagan`（四大风险/赋能团队/discovery）`pm-advisor-torres`（持续发现/机会树/假设验证）
`pm-advisor-yujun`（用户价值公式/交易模型/替换成本）
方法论 `pm-method-mom-test`（访谈问法）`pm-method-story-mapping`（需求拆解与 MVP 切片）
`pm-method-build-trap`（功能工厂自检与成效导向）

## 产品文档链（挂在流程上的非 pm- 技能）

这些不带 `pm-` 前缀，但**在同一条产品链路上**，是流程的合法延伸。挂载点如下：

| 挂在哪 | 技能 | 干什么 | 产出 |
|---|---|---|---|
| 阶段 -2 之前 / 阶段 4 之前 | `brainstorming` | 动手前先探索意图与方案空间（任何创意工作前的必经一步） | `docs/规划/{日期}-{客户}{系统}-设计方案-v*.md` |
| 阶段 -2、-1 之后 | `feasibility-report` | 可行性研究报告（立项报批用的正式文档） | `docs/规划/{日期}-{项目}-可行性研究报告-V*.md` + Word |
| 阶段 5（真源）→ | `req-doc` | **SRS 需求规格说明书**——研发真源 | `docs/SRS/` |
| 阶段 5 之后 | `feature-list` | 从 SRS / 可研提取功能清单 | `docs/规划/{日期}-{项目}-功能清单-V*.{md,xlsx}` |
| 阶段 5 之后 | `delivery-plan` | 交付链路规划与进度追踪 → 接阶段 6（**批量实现的前置**） | `docs/delivery-plan-{项目名称}.md`（活文档，不带版本号） |
| 阶段 5 之后 | `hld-design` | 概要设计说明书（系统架构级） | `docs/架构/{日期}-{客户}{项目}-概要设计说明书-V*.md` + Word |
| `hld-design` 之后 | `lld-design` | 详细设计（模块 + 表结构 + API 三合一） | `docs/架构/{日期}-{客户}{项目}-详细设计说明书-V*.md` + Word |
| 阶段 5 → 阶段 6 | `page-generator` | 在现有项目里实现业务页面 | `src/` |
| 阶段 5 分支 | `prototype-to-prd` | 已有 Axure/HTML/URL 原型 → 逆向盘点出 PRD | `docs/PRD/` |
| 阶段 6 之后 | `annotation` | 往 **`src/` 真实页面代码**注入标注 class + 标注 JSON + Vite 插件 | 项目代码内 |
| 阶段 5 之后（**与阶段6 并列的另一条路**） | `ui-ux-pro-max` | **UI/UX 设计稿**：可点可交互的独立 HTML + 三张 iframe 预览墙 | `Prototype/<项目slug>/` |


**三套目录别搞混**：SRS/PRD → `docs/SRS/`、`docs/PRD/`；可研／功能清单／设计方案 → `docs/规划/`
（**这三类有意留在那儿，不是遗留**）；概要／详细设计 → `docs/架构/`；流程阶段产出 → `docs/` 根。
细则见 `references/flow-engine.md` 的目录规范。

### 「设计稿」和「前端原型」是两条不同的路，别混

阶段5 之后有**两条并列的下游**，用户说「做原型」时必须先分清要哪个：

| | 阶段6 前端原型 | 设计稿（阶段5 之后的另一条路） |
|---|---|---|
| 技能 | `page-generator` | `ui-ux-pro-max`（细则读 `ui-ux-pro-max/references/prototype-delivery.md`） |
| 产出 | 项目里的**真实页面代码** | **零依赖的独立 HTML** + 三张 iframe 预览墙 |
| 落盘 | `src/` | `Prototype/<项目slug>/` |
| 真源 | **SRS**（不认 PRD，见下方硬规则） | **PRD 为主真源**，SRS 补规格细节 |
| 用途 | 进开发、要能跑起来 | 给人看、点得动、评审与对齐用 |
| 前置 | 合格 SRS | **PRD 与 SRS 都要有** |

**分不清就问一句**：「你要的是能进代码库跑起来的页面，还是给人点着看的设计稿？」

设计稿的缺件处理（与 `ui-ux-pro-max` 契约同一口径，**不要另写一套**）：

| 现状 | 处理 |
|---|---|
| PRD + SRS 都有 | 可启动 |
| 只有 PRD | 先 `req-doc` **Step F** 转 SRS；用户**原话**要求「跳过 SRS 直接出设计稿」才允许只用 PRD，并在索引页注明 |
| 只有 SRS | 先 `pm-prd-spec` 出 PRD——**设计稿以 PRD 为主真源**，没 PRD 就没有页面清单与文案依据 |
| 两个都没有 | 不要凭空造页面：先 `pm-prd-spec` 再 `req-doc` |

口径冲突时**以 `ui-ux-pro-max/references/prototype-delivery.md` 为准**。
另外两个截图类技能（`pm-image2proto` 单文件 HTML / `pm-image2pencil` Pencil 稿）**不需要 PRD/SRS**，
它们的输入是图片，走单点路由，不在这条链上。

### 两个「标注」不是一回事

用户说「加标注」时先分清：

| | `annotation` 技能 | 设计稿自带的标注面板 |
|---|---|---|
| 标在哪 | **`src/` 项目真实页面代码** | `Prototype/<项目slug>/` 的独立 HTML |
| 怎么实现 | 注入专属 class + 生成标注 JSON + 装依赖 + 注册 Vite 插件 | 页面内建，全屏页右下角开关 |
| 前置 | 阶段6 已出代码 + **合格 SRS**（在只认 SRS 的六技能名单里） | 设计稿已出（`ui-ux-pro-max`） |
| 谁做 | `annotation` | `ui-ux-pro-max`，**不需要另调 `annotation`** |

**走设计稿这条路的用户不需要 `annotation` 技能**——预览墙的全屏页已经内建标注面板，
且每条规则要标 `PRD x.y.z` / `SRS 3.5.x` 出处。反过来，只要 `src/` 里的代码被标注，才用 `annotation`。

### 硬规则：这六个技能只认 SRS，不认 PRD

**`page-generator`、`hld-design`、`lld-design`、`feature-list`、`annotation`、`delivery-plan`
不得以 PRD（`docs/PRD/*.md`）为规格真源。**

所以阶段 5 的文档类型选择（Step 0 问题5）直接决定下游能不能走：

| 阶段 5 选了 | 能直接进阶段 6 及上述六个吗 |
|---|---|
| SRS（`req-doc`） | ✅ 可以 |
| 先 PRD 后 SRS | ✅ 转写完成后可以 |
| 只有 PRD（`pm-prd-writer` / `pm-prd-spec` / `prototype-to-prd`） | ❌ **必须先走 `req-doc` 的 PRD→SRS 转写（Step F）** |

裁剪里含阶段 6，或用户提到上面六个技能中的任何一个时，**Step 0 问题5 默认选 SRS**，
不要让用户在不知情的情况下选了 PRD 然后卡在阶段 6 前面。

## 流程外的 Skill（不在 13 阶段里，按需路由）

`pm-review-board`（评审）`pm-experiment-designer`（实验）`pm-tracking-spec-writer`（埋点）
`pm-survey-designer`（问卷）`pm-user-interview`（访谈）`pm-competitor-deconstructor`（竞品）
`pm-postmortem-writer`（复盘）`pm-analytics` / `pm-product-metrics`（数据）`pm-okr-designer`（OKR）
`pm-sprint-planning`（迭代规划）`pm-stakeholder-report`（汇报）`pm-growth-marketing`（增长营销）
`pm-image2proto` / `pm-image2pencil` / `pm-url2proto`（原型三件套）

它们可以**挂在流程的任意阶段之后**作为增项，最常见的三处：
阶段5 之后接 `pm-review-board`（评审 PRD）、阶段5 之后接 `pm-tracking-spec-writer`（埋点）、
阶段9 之后接 `pm-postmortem-writer`（上线复盘）。

## 流程执行规则

1. **开始前报价**：列出裁剪后的阶段区间、每阶段产出物、需要用户确认的点，让用户砍阶段
2. **起流程必走 Step 0**：按 `references/flow-engine.md` 分两批收集（AskUserQuestion 单次上限 4 问）。
   第一批必问：**手头已有什么 / 裁剪范围 / 档位 / 产品类型**；第二批仅当裁剪含阶段 5 或 6 时问：**阶段5 文档类型 / 交付模式**。
   收完回显一行确认（裁剪｜档位｜阶段5｜模式），再用 TaskCreate 建清单
3. **阶段门禁**：上一阶段的产出文件写入成功，才能进下一阶段
4. **步间交接**：每阶段输出「交接摘要」（≤10 行：本阶段结论 + 下阶段需要的输入），不让下一阶段重读全文
5. **可中途退出**：每阶段完成即是独立可用的交付物
6. **断点续跑**：再次启动时按 `flow-engine.md` 的判断逻辑扫 `docs/`，从未完成的阶段继续
7. **不强推流程**：用户只要一步就给一步

## 澄清规则

- 最多一轮澄清，问题不超过 4 个，按「阻塞路由的 → 影响质量的」排序
- 信息足够路由时不澄清，直接路由（缺的信息留给目标 Skill 自己问）
- **起流程前必须确认裁剪范围**——这一条不能省，跑错区间的代价比多问一句大

## 降级策略

- **目标 Skill 未安装**：按路由表的职责描述做低保真版本，并提示安装完整 Skill
- **问题超出 38 个 Skill 覆盖范围**（技术选型、组织设计、法务合规）：直说不在覆盖范围，不硬套

## 诚实边界

- 总控只保证「路由对 + 流程通」，各 Skill 的产出质量由各自的检查清单负责
- 流程 ≠ 必然更好：单点需求起流程是浪费，一步能解决就一步
- 默认档与深度档选错不影响正确性，只影响产出厚度。**档位在入口问定**，但用户中途说「这步做深一点」随时可换，
  换挡不影响已完成阶段的产出，也不改变阶段编号和产出路径
