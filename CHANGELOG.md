# Changelog

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
  `delivery-plan` 不接受 `*-PRD.md` 作为规格真源，只有 PRD 时门禁会路由 `req-doc` Step F 转写。
- **Word 导出的图片只有一种可用写法**：`images/<纯ASCII名>.png`，且 `images/` 要与文档**实际落盘目录**同级。
  其余形式（`img/`、`images/sub/`、`../images/`、与文档同目录、中文文件名）会**静默丢图**——
  导出后务必验 `unzip -l <docx> | grep -c "word/media/"`。
- **xlsx 导出的 payload 用 `data`（二维数组，首行表头）**，不是 `headers` + `rows`；
  后者接口仍返回 200，但产出的文件里没有 worksheet。
- **导出与图表渲染需自配端点**，见 README「导出功能需要自己配端点」。其余 50 个技能开箱可用。
- **两处未在真实项目里跑过**：`ui-ux-pro-max` 的设计稿交付（三张预览墙）与 `annotation` 的代码注入，
  这两条需要真实 PRD+SRS 与真实前端项目才能验证。
