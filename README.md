<h1 align="center">PM-Skills 1.0</h1>

<p align="center"><code>pm-skills</code></p>

<p align="center"><em>「一条流程，13 个阶段，从该不该做一路走到能不能上线」</em></p>

<p align="center">
  <img alt="Skills" src="https://img.shields.io/badge/Skills-52-5aa524?style=for-the-badge">
  <img alt="Plugins" src="https://img.shields.io/badge/Plugins-9-c8a500?style=for-the-badge">
  <img alt="Stages" src="https://img.shields.io/badge/Lifecycle-13%20Stages-1888c8?style=for-the-badge">
  <img alt="Runtime" src="https://img.shields.io/badge/Runtime-Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Cursor-7b2bd9?style=for-the-badge">
</p>

<p align="center"><strong>License MIT</strong></p>

---

## 项目归属

| 项 | 内容 |
| --- | --- |
| **项目** | `iDWong/pm-skills` **v1.0**（2026-09-10） |
| **作者** | Noah Wong / Product Compass Master |
| **规模** | **52 个技能**，打包成 **9 个 plugin**；**0 个 slash command**——本库靠 `description` 触发词自动路由，不依赖斜杠命令（Claude Code 仍会把每个技能暴露为 `/<skill-name>`） |
| **语言** | **中文技能说明**（全部 52 个 `description` 为中文，含触发词与「不适用」）+ **中英混排正文**（自研技能中文，上游引进的 16 个技能保留英文原文，产出语言跟随用户提问语言） |
| **实现** | **不是纯 markdown**：178 个 md（含 **123 个 references**）+ 164 个非 md 文件——**32 个可执行脚本**、**37 个 CSV 数据表**、30 个 json（含 `config.example.json`，真实 `config.json` 不入库）、65 个其他资产（PNG/XML/字体）。共 **5.9 MB** |
| **安装** | plugin marketplace：`claude plugin marketplace add iDWong/pm-skills`；Codex / Cursor 用 `bash install.sh` 平铺安装 |

> **和「纯 prompt 库」的区别**：本库带可执行组件——`ui-ux-pro-max` 的 37 张 CSV 是可检索的设计数据库
> （79 风格 / 192 配色 / 74 字体对 / 119 UX 规则 / 22 技术栈），`pm-prd-spec` 有 547 行线框图生成器，
> `diagram-generator` 有 6 个 draw.io 渲染/校验脚本，`common/` 有 Word/xlsx 导出链。
> 这些是「产出可交付物」而不只是「给出建议」的前提。

---

## 一条流程，13 个阶段

```
[-2] 战略框架 ──┐
[-1] 上市与ICP ─┤ 新产品从 0 到 1 才跑
[ 0] 市场调研    │
[ 1] 用户画像    │
[ 2] 功能优先级  │  ← 默认档 / 深度档 可换
[ 3] 产品路线图  │  ← 默认档 / 深度档 可换
[ 4] 需求澄清    │
[ 5] 需求文档    │  ← 不可跳过，登记 SPEC_SOURCE 供 6–9 读取
[ 6] 前端原型    │  ← 只认 SRS，不认 PRD
[ 7] 测试用例    │
[ 8] 操作手册    │
[ 9] 发版说明    │
[10] 上线审计 ───┘ 代码由 AI 生成时才跑
```

**「快速流程」「立项流程」不是另一条流程，是同一条流程的裁剪** —— 阶段编号永不改变，
跳过的阶段在任务清单里标注「已跳过（理由）」，断点续跑靠这个判断。

| 裁剪 | 阶段区间 | 什么时候用 |
| --- | --- | --- |
| 全量 | -2 → 10 | 全新产品，方向都没定 |
| 立项 | -2, -1, 0, 1, 2, 3 | 只要论证方向和规划 |
| 标准交付 | 0 → 9 | 方向已定的新项目 |
| 快速交付 | 4 → 8 | 已有明确需求，直奔文档与原型 |
| 只要文档 | 4, 5, 7, 8, 9 | 不生成前端代码 |
| 迭代 | 4, 5, 6, 7, 9 | 存量产品加功能 |
| 上线体检 | 10 | 代码已存在，只做审计 |

---

## 9 个 plugin

| Plugin | 技能数 | 覆盖 |
| --- | --- | --- |
| `pm-lifecycle` | 1 | **唯一入口**：13 阶段总控、裁剪、换挡、断点续跑 |
| `pm-strategy` | 3 | 12 个战略框架、上市与 ICP、增长营销 |
| `pm-advisory` | 7 | Cagan / Torres / 俞军 + Mom Test / Story Mapping / Build Trap + 评审会总控 |
| `pm-execution` | 11 | PRD 三档、六角色评审、多模型优先级、路线图、OKR、迭代、复盘、汇报 |
| `pm-research` | 5 | 市场调研、用户画像、访谈、问卷、竞品四维拆解 |
| `pm-analytics` | 4 | 归因分析、指标体系、A/B 实验、埋点规格 |
| `pm-docs` | 10 | SRS 真源、PRD、原型逆向、可研、功能清单、交付计划、概要/详细设计、标注、导出链 |
| `pm-prototype` | 7 | 截图/网址转原型、页面实现、UI/UX 设计智能、玻璃材质、图表生成 |
| `pm-shipping` | 4 | AI 代码上线审计、测试用例、操作手册、发版说明 |

---

## 安装

### Claude Code

```bash
claude plugin marketplace add iDWong/pm-skills
claude plugin install pm-lifecycle@pm-skills      # 唯一入口，先装这个
claude plugin install pm-docs@pm-skills           # SRS/PRD 文档链 + 导出
claude plugin install pm-execution@pm-skills
# 其余按需
```

### Codex / Cursor

平铺安装（这两个宿主不吃 plugin 格式）：

```bash
git clone https://github.com/iDWong/pm-skills && cd pm-skills
bash install.sh codex     # → ${CODEX_HOME:-$HOME/.codex}/skills/
bash install.sh cursor    # → ~/.cursor/skills/
bash install.sh claude    # → ~/.claude/skills/（不走 plugin 时也可平铺）
bash install.sh all
```

---

## 导出功能需要自己配端点

52 个技能里 **50 个开箱即用**。只有 **Word/xlsx 导出**和**图表渲染**依赖两个外部服务端点，
本仓库**不提供**（原作者用的是自建服务，不随仓库分发）：

```bash
cp pm-docs/skills/config.example.json <技能根>/config.json
```

然后填两个字段：

| 字段 | 需要提供什么 |
| --- | --- |
| `apiBaseUrl` | `POST /api/document/export/word-with-images`（multipart：markdown + `files[]`）<br>`POST /api/document/export/excel-from-data`（JSON：`{filename,title,sheets:[{name,data:[[...]]}]}`） |
| `diagramApiUrl` | draw.io XML → PNG/SVG 渲染，供 `diagram-generator` 调用 |

`config.json` **必须放在技能根目录**（与各技能目录同级），不是放进某个技能目录里——
`export-word.*` 用 `<script_dir>/../config.json` 找它。`install.sh` 会自动放模板并提示。

**不配会怎样**：`req-doc`、`pm-prd-spec` 等仍能正常产出 Markdown 文档，只是「导出 Word」那一步跑不了；
`diagram-generator` 仍能生成和校验 draw.io XML，只是渲不成 PNG。其余功能完全不受影响。

---

## 怎么用

**多步任务**——描述目标，让 `pm-lifecycle` 起流程：

```
「我有个短剧后台的想法，从头到尾走一遍」
「按需求说明书把所有功能实现出来」
「这个项目是 AI 写的，能上线吗」
```

起流程时会问四件事（AskUserQuestion 单次上限 4 问，第二批按需）：
**手头已有什么 / 裁剪范围 / 档位 / 产品类型**。

**单点任务**——直接说要什么，`pm-lifecycle` 路由到对应技能，**不起流程**：

```
「做个 SWOT」「怎么定价」「帮我看看这个 PRD」「指标为什么跌了」「排一下需求优先级」
```

**判断类**——转专家顾问团：

```
「这需求该不该做」「用户说想要，但这是真需求吗」「我们是不是在堆功能」
```

---

## 三条容易踩的硬规则

**① 六个技能只认 SRS，不认 PRD**

`page-generator`、`hld-design`、`lld-design`、`feature-list`、`annotation`、`delivery-plan`
读的是 SRS 的 3.1 / 3.2 / 3.3 / 3.5.x 章节结构。只有 PRD 时门禁会中止并路由 `req-doc` **Step F** 转写。
所以裁剪含阶段 6 时，阶段 5 的文档类型**默认选 SRS**。

**② Word 导出的图片只有一种可用写法**

图片必须放在**与文档同级的 `images/` 子目录**，文件名**纯 ASCII**。实测边界：

| Markdown 里写 | 结果 |
| --- | --- |
| `images/wf-01-flow.png` | ✅ 唯一可用形式 |
| `img/…`、`images/sub/…`、`assets/img/…`、`../images/…`、与文档同目录、中文名 | ❌ **静默丢图** |

「与文档同级」按文档**实际落盘目录**算：SRS 在 `docs/SRS/` → 图放 `docs/SRS/images/`；
设计说明书在 `docs/02-架构与设计/` → 图放那一级的 `images/`。
**导出后必须验**：`unzip -l <docx> | grep -c "word/media/"`，数字要等于图片张数。

**③ 「设计稿」和「前端原型」是两条不同的路**

| | 设计稿 | 前端原型 |
| --- | --- | --- |
| 技能 | `ui-ux-pro-max` | `page-generator`（阶段 6） |
| 产出 | 零依赖独立 HTML + 三张预览墙 | 项目里的真实页面代码 |
| 落盘 | `Prototype/<项目slug>/` | `src/` |
| 真源 | **PRD 为主**，需 PRD+SRS 都有 | **只认 SRS** |

分不清就问一句：「要能进代码库跑起来的页面，还是给人点着看的设计稿？」

---

## 目录约定

```
docs/
├── strategy.md、gtm.md、market-research-*.md …   ← 阶段 -2 至 4 的流程产出
├── SRS/          {日期}-{客户}{项目}-SRS需求规格说明书-V*.md   + images/
├── PRD/          {日期}-{主题}-PRD.md                        + images/
├── 01-需求与规划/  可研报告、功能清单、设计方案                 + images/
├── 02-架构与设计/  概要设计、详细设计                          + images/
└── images/       操作手册与阶段产出的图
src/              ← 阶段 6
reports/          ← 阶段 10 审计报告（与 docs 分开）
Prototype/<slug>/ ← 设计稿（可点 HTML + 预览墙）
```

---

## 致谢

- 战略/GTM/增长/上线审计四组共 25 个能力的方法论来自 [phuryn/pm-skills](https://github.com/phuryn/pm-skills)（MIT），
  本库按主题收敛成 4 个技能并保留其英文原文作为 references
- `ui-ux-pro-max` 的设计数据库来自 [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT）
- 顾问团七个技能由 [career-skill-factory](https://github.com/SpaceZephyr/career.skill) 蒸馏生成

made with Claude Code
