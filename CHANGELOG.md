# Changelog

## Unreleased

### 设计稿闭环检查机制

- 新增 `pm-master/references/prototype-review.md` 与 `pm-prd-spec/references/prototype-review.md`
  （**两份内容相同**，bundle 要能独立安装；改一处必须同步另一处）：设计稿**生成之后**的验收规范。
- 核心是四层递进判据，上一层不通过不进下一层：**存在性 → 可达性 → 闭环性 → 一致性**。
  它针对的是设计稿评审里三种在演示中看不出来的断点——**流程有页面无 / 页面有走不到 / 点得动没反应**。
- 内容：角色与签字（出题的人不能自己判卷）· 四阶段流程（产品流程映射 → 测试真人走查 → 异常边界 → 一致性）
  · 四项机检（死链 / 无绑定控件 / 孤层 / 状态不可达）· 问题分级与返工闭环 · 准入准出与打回重做判据
  · 57 项可勾选清单 · 订单提交流程样例。
- 两条关键口径：**「状态帧」与「流程帧」判据不同**——由用户操作推进的必须点得到，
  由真实数据决定的（离线/空态/额度用完）允许只由工具条切；**静态属性检查证明不了点得动**，
  必须起服务器用真人的手走一遍。
- `pm-prd-spec` 的 Step 8 增加 **Step 8.1 设计稿闭环检查**，并反向要求 PRD 供料：
  流程节点清单、每页六态写全（空态与失败态分开）、关联浮层标注触发方式。
- `pm-master` 的阶段门禁增加一条：**出了设计稿的，未签字不得作为下游（研发/测试用例/操作手册）的输入**。
- 两个技能 metadata 推到 `version: "1.2"` / `reviewed: "2026-09-13"`。

### 编制单位改名

- 文档模板与示例里的编制单位由 `Wong's Development Team` 改为 **`Chaos Dev Studio`**
  （编制人/作者/修订人仍是 `Wong`，客户单位不动）。规则真源 `common/README.md` 同步更新。

### 代码落盘：`dev/code/`

- 阶段 6 `page-generator` 的产出由 `src/` 改为 **`dev/code/`**（研发链产出，与 `dev-master` 那条链对齐）：
  门禁、目录树、断点续跑判据、`annotation` 的标注目标一并改。
- 仓库级基建（compose / CI / hooks / scripts / 部署文档）留仓库根，不进 `dev/`；
  存量项目代码在仓库根的原地续用不搬家。

### 落盘根收敛：产品链 `prd/`、研发链 `dev/`

- 产品链 13 阶段产出统一落 **`prd/`**：`strategy/`（战略 · GTM/ICP）、`research/`（调研 · 画像）、
  `planning/`（优先级 · 路线图 · 需求澄清 · 可研 · 设计方案）、`PRD/`、`test/`（测试用例）、
  `release/`（操作手册 · 发版说明）、`reports/`（上线审计）。
- **唯一例外：SRS 落 `dev/SRS/`** —— 它是研发侧规格真源，姊妹库 [`dev-skills`](https://github.com/iDWong/dev-skills)
  的全链门禁与「只认 SRS」的七个技能都指向它。功能清单、概要/详细设计、交付计划同理属研发链产出，
  即使由 `pm-master` 接力触发也落 `dev/`。
- **`docs/**` 整棵树（含 `docs/SRS/`、`docs/PRD/`、`docs/规划/`、`docs/架构/`、`docs/01-需求与规划/`）
  降级为只读兼容**，不再往里写。读取端保留旧根兼容行，存量项目的老文档**原地续用不搬家**。
- `common/prd-to-srs-gate.md` 的 SRS 检测顺序改为 `dev/SRS/` → `docs/SRS/` → 旧归档路径。

### 文档署名

- 文档模板的编制人/作者/客户单位统一为 `Wong`，编制单位 `Wong's Development Team`；
  技能 frontmatter 的 `author` 由 `iDWong` 改为 `Wong`（上游 claudekit 的第三方署名不动）。

## v1.0.0 — 2026-09-10

首个发布版本。52 个技能 / 9 个 plugin / 13 阶段单一流程。

### 架构

- **单一编排器**：`pm-master` 是唯一入口，管 13 阶段流程（-2 战略 → 10 上线审计）。
  合并自原来两个互不知道对方存在的编排器（路由派 + 流水线派），其中一个已删除、627 行全部吸收。
- **裁剪而非多流程**：「快速交付」「立项」等 7 种裁剪是同一条流程的阶段区间，编号永不改变；
  跳过的阶段标注「已跳过（理由）」，断点续跑靠它判断。
- **默认档 / 深度档换挡**：4 个阶段有快慢两档（优先级、路线图、需求文档、数据分析），
  档位在入口 Step 0 问定，中途可换；换挡不改阶段编号与产出路径。
- **门禁一律 glob**：各阶段技能的实际命名带产品名/日期/版本号，写死精确文件名会让门禁永远过不了。
- **代落盘规则**：阶段 2 与阶段 9 的技能是纯对话输出不写文件，由流程代写到约定路径。

### 引进与收敛

- 从 [phuryn/pm-skills](https://github.com/phuryn/pm-skills) v2.1.0 引进 25 个零重叠能力，
  **按主题收敛成 4 个技能**（`pm-strategy-frameworks` / `pm-gtm` / `pm-growth-marketing` / `pm-ai-ship-audit`），
  而非 1:1 平铺，避免 60 个技能触发词互撞。英文原文保留在各自 `references/` 下（逐字节副本）。
- 删除 `product-strategy-analyzer`（与三个技能三重重叠），其独有的「倒推法/顺推法」双向推演
  吸收为 `pm-strategy-frameworks/references/backcasting-forwardcasting.md`。

### 已知约束（使用前值得知道）

- **阶段 5 不可跳过**：后续阶段全靠它登记的 `SPEC_SOURCE` 读规格。
- **六个技能只认 SRS**：`page-generator`、`hld-design`、`lld-design`、`feature-list`、`annotation`、
  `delivery-plan` 不接受 PRD（`docs/PRD/*.md`）作为规格真源，只有 PRD 时门禁会路由 `req-doc` Step F 转写。
- **Word 导出的图片只有一种可用写法**：`images/<纯ASCII名>.png`，且 `images/` 要与文档**实际落盘目录**同级。
  其余形式（`img/`、`images/sub/`、`../images/`、与文档同目录、中文文件名）会**静默丢图**——
  导出后务必验 `unzip -l <docx> | grep -c "word/media/"`。
- **xlsx 导出的 payload 用 `data`（二维数组，首行表头）**，不是 `headers` + `rows`；
  后者接口仍返回 200，但产出的文件里没有 worksheet。
- **导出与图表渲染需自配端点**，见 README「导出功能需要自己配端点」。其余 50 个技能开箱可用。
- **两处未在真实项目里跑过**：`ui-ux-pro-max` 的设计稿交付（三张预览墙）与 `annotation` 的代码注入，
  这两条需要真实 PRD+SRS 与真实前端项目才能验证。
