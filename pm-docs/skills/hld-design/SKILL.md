---
name: hld-design
description: >
  生成概要设计说明书（HLD / High-Level Design）的技能。在需求确定后、详细设计前，从 SRS 需求说明书推导系统总体架构。
  触发场景：(1) "概要设计" "概要设计说明书" "生成概要设计" "写概要设计" "HLD",
  (2) "系统设计" "总体设计" "架构设计" "系统架构设计",
  (3) "分层设计" "模块划分" "技术选型方案",
  (4) "审查概要设计" "检查概要设计" "概要设计有没有问题",
  (5) "根据代码补概要设计" "反向生成概要设计" "同步概要设计",
  (6) "导出概要设计" "概要设计导出Word",
  (7) 用户已有 SRS 需求说明书，需要产出系统架构级设计文档时触发。
  支持完整生成、局部完善、审查修复、反向同步、导出 Word。
---

> **⚠️ `.agents/` 是外部资源包路径，本机已不存在**（`Documents/Claude/Product/.agents/` 已删除）。
> 下文凡引用 `.agents/knowledge/`、`.agents/agents/`、`.agents/agent-memory/` 的地方**读不到文件**，
> 按以下降级处理，**不要因此中止**：
> - `.agents/knowledge/**`（内容规范、质量清单）→ 用本技能 `references/` 下的模板与检查表；两者都缺时按通用工程规范执行并在产出里标注「无内容规范可依」
> - `.agents/agents/*.md`（子 Agent 派发）→ 不派发，由当前会话直接执行该角色的工作
> - `.agents/agent-memory/**`（跨会话记忆）→ 跳过读写，改为在产出里写清本次的决定
> - `.agents/rules/prd-to-srs-gate.md` → **已迁到 `../common/prd-to-srs-gate.md`**（库内权威副本）

# 概要设计说明书（HLD）生成器

## Agent 协作架构

```
hld-design skill（主流程：调度 + 文件写入）
  ├── design-analyzer agent（分析师，DOC_TYPE=hld）
  │     职责：读 SRS/代码/已有HLD，输出架构级摘要（模块/实体/接口分组/技术栈/部署/非功能映射）
  │
  ├── design-writer agent（撰写者，DOC_TYPE=hld）
  │     职责：摘要 + 模板 → 架构级设计章节（允许技术词汇，禁止下沉到字段/单接口）
  │
  └── design-reviewer agent（审查者，DOC_TYPE=hld）
        职责：五维度审查（结构完整性/分层边界/技术规范/可追溯性/设计质量）
        时机：内容写入文件后统一运行 → 汇总 → 询问用户是否修复
```

**先写后审原则：** 生成内容写入文件 → 对变更章节运行 design-reviewer → 汇总报告 → 询问"是否修复？" → 用户确认后修复。

**核心约束：** HLD 写到模块/实体/接口分组级即止，字段级表结构、单接口明细、代码实现属于详细设计（LLD），不在此处展开。

## 工作模式

| 模式 | 触发场景 | 入口 |
|------|---------|------|
| **生成模式** | 从 SRS 生成 HLD | → Step A |
| **局部完善模式** | 补充/修改某章节 | → Step B |
| **审查修复模式** | 审查已有 HLD 并修复 | → Step C |
| **反向同步模式** | 根据已有代码更新 HLD | → Step D |
| **导出模式** | 导出为 Word 文档 | → 导出 Word 章节 |

---

## Step A: 生成模式

### A1: 扫描项目上下文

按优先级扫描，找到上游文档再开始：

| 优先级 | 文件类型 | 查找方式 |
|--------|---------|---------|
| 最高 | SRS需求规格说明书 | `Glob("**/*需求*说明书*.md")` |
| 高 | 设计方案 | `Glob("**/*设计*方案*.md")` |
| 中 | 已有概要设计 | `Glob("**/*概要设计*.md")` |
| 低 | 路由/代码 | `src/router/`, `src/views/`, `src/api/`, `package.json` |

- 未找到 SRS 但存在 `docs/PRD/*.md`（或旧路径 `docs/**/*-PRD.md`） → Read `../common/prd-to-srs-gate.md`，**中止**，路由 **`req-doc` Step F**
- 未找到 SRS 且无 PRD → 提示用户先用 `/req-doc` 生成需求说明书（HLD 以 SRS 为依据）
- 找到已有 HLD → 转 Step B / C

### A2: 读取模板

读取 `references/templates/hld-template.md`，严格按模板章节结构生成。

### A3: 调用 design-analyzer（系统级分析）

```
subagent_type: "design-analyzer"
传入：
  PROJECT_PATH: {项目根目录}
  DOC_TYPE: hld
  FEATURE_NAME: {系统名称}
  MODE: from_srs（有SRS）或 from_code（仅有代码）
  SOURCE_PATH: {SRS路径 或 src/ 目录}
```

收到架构级摘要后，对照"开放项"清单补充询问用户（如技术选型偏好、部署形态）。

### A4: 生成任务清单

**必须先展示任务清单，再逐章生成，禁止一次性写入整个文档。**

```
| 序号 | 任务名称 | 类型 | 状态 |
|------|---------|------|------|
| 1 | 创建文件 - 封面 + 文档信息 + 引言 | [文档] | [ ] 等待中 |
| 2 | 生成系统总体架构图 | [图表] | [ ] 等待中 |
| 3 | 三、系统总体设计 | [Agent] | [ ] 等待中 |
| 4 | 生成模块关系图 | [图表] | [ ] 等待中 |
| 5 | 四、应用架构 | [Agent] | [ ] 等待中 |
| 6 | 生成概念ER图 | [图表] | [ ] 等待中 |
| 7 | 五、数据架构 | [Agent] | [ ] 等待中 |
| 8 | 六、接口架构 | [Agent] | [ ] 等待中 |
| 9 | 七、技术架构 | [Agent] | [ ] 等待中 |
| 10 | 生成部署架构图 | [图表] | [ ] 等待中 |
| 11 | 八、部署架构 | [Agent] | [ ] 等待中 |
| 12 | 九、非功能性设计 | [Agent] | [ ] 等待中 |
```

状态标识：[ ] 等待中 → [进行中] → [完成]

**类型说明：**
- [文档]：主流程直接写（封面、文档信息、引言）
- [图表]：调用 `diagram-generator` 技能生成，图片路径记入备注列
- [Agent]：调用 analyzer（A3已完成系统级分析，此处直接复用摘要）→ writer → 写入

### A5: 执行任务

1. [文档] / [图表]：每次执行一个，前置图表先于对应 [Agent] 完成，路径记备注
2. [Agent]：调用 design-writer（传入 A3 摘要中对应章节部分 + DIAGRAM_PATHS）→ Edit 追加
3. 第一个任务用 Write 创建文件，后续 Edit 追加，每次写入 ≤150 行

```
design-writer 调用：
  subagent_type: "design-writer"
  传入：
    PROJECT_PATH: {项目根目录}
    DOC_TYPE: hld
    CHAPTER: {章节名}
    SECTION_NUMBER: {编号}
    设计摘要: {A3 摘要中对应部分}
    DIAGRAM_PATHS: {对应图表路径}
```

**注意：** diagram-generator 是技能不是 agent，图表必须作为独立 [图表] 任务在 [Agent] 任务前完成。

### A6: 全文审查与修复

所有章节写入完成后：

1. **并行审查**：对各 [Agent] 章节调用 design-reviewer（DOC_TYPE=hld，传入章节内容 + A3摘要）
2. **汇总报告**：
```
## 审查报告
### P0 结构性问题（必须修复）
### P1 内容缺失（需补充）
### P2 规范不符（建议优化）
---
共发现 N 个问题（P0: x，P1: y，P2: z）
```
无问题输出"✅ 全文审查通过"。
3. **询问用户**："发现 N 个问题，是否进行修复？（P0必须，P1/P2可选）" 等待确认。
4. **执行修复**（用户确认后）：问题数≥2或涉及结构/规范 → [Agent重写]（analyzer from_existing → writer → reviewer复审，最多2次）；问题数=1的局部问题 → [主流程修正] 直接 Edit。
5. 修复后更新版本号（+0.1），重命名文件。

---

## Step B: 局部完善模式

1. 读取现有 HLD 对应章节
2. design-analyzer（MODE: from_existing，DOC_TYPE=hld）分析现有内容，识别缺失
3. design-writer 补充/改写
4. Edit 写入
5. design-reviewer 审查变更章节 → 汇总 → 询问修复 → 用户确认后修复
6. 更新版本号

---

## Step C: 审查修复模式

1. `Glob("**/*概要设计*.md")` 找到文档
2. 展示审查任务清单，逐章调用 design-reviewer（DOC_TYPE=hld）
3. 汇总审查报告，询问"是否修复？"（若用户说"只审查"则停止）
4. 用户确认后生成修复任务清单并逐项执行（[Agent重写]/[主流程修正]，判断标准同 A6）
5. 修复完成后更新版本号，重命名文件

---

## Step D: 反向同步模式

**触发场景：** 代码已演进，需将 HLD 与代码现状对齐（架构级：模块增减、技术栈变更、模块依赖变化）。

1. **分析代码现状**：以路由注册表为唯一真相源——只有在 `src/router/modules/index.ts`（或等效入口）中实际注册的路由才算"功能存在"，残留的 view/api/mock 文件不算（判定细则见 `../req-doc/SKILL.md` 的 Step B）。提取实际模块清单、技术栈（package.json）、模块依赖
2. **分析现有 HLD**：提取文档声称的模块、架构、技术栈
3. **生成差异清单**：模块增减、技术栈变更、依赖变化 → 展示给用户确认
4. **执行更新**：design-analyzer（from_code）→ design-writer 更新对应章节 → 重新生成受影响图表
5. **审查**：design-reviewer → 汇总 → 询问修复
6. 更新版本号

---

## 导出 Word

触发词："导出概要设计" "概要设计导出Word"

```bash
> **⚠️ 导出前后各一件事**：① 图片必须放在**文档同级的 `images/` 子目录**且**文件名纯 ASCII**——这是唯一可用形式，`img/`、`images/sub/`、`../images/`、与文档同目录、中文名**全都静默丢图**（脚本仍打印 `Export succeeded`，但 `word/media/` 是空的）；② 导出后立刻验 `unzip -l <docx> | grep -c "word/media/"`，数字必须等于图片张数。实测边界表见 `../common/README.md`。

bash ../common/export-word.sh <markdown文件路径> formal
```

找到文件：`Glob("docs/**/*概要设计*.md")`，多个让用户选。导出失败检查 `../config.json` 的 `apiBaseUrl`。

## 文档命名规范

`docs/架构/{日期}-{客户名称}{项目名称}-概要设计说明书-V{版本号}.md`

示例：`docs/架构/20260530-PM能源科技智慧厂区巡检平台-概要设计说明书-V1.0.md`

**修订：就地改也要改文件名。** 大文档（几千行 / MB 级）**就地 `Edit` 改**，别整份重写；但改完必须三样一起动——文首「文档版本」、版本历史表、**`mv` 把文件名的版本号也改掉**（局部修订 `+0.1`，结构性重写进大版本；日期取改动当天）。**绝不允许内容已是 V1.1、文件名还写 V1.0。**改名后 `grep` 一遍旧名，把 README 清单、下游「来源」行、`tools/` 脚本里的引用一并改掉。完整规则见 `../common/README.md`。

## 参考资源

| 资源 | 路径 | 用途 |
|------|------|------|
| HLD 模板 | `references/templates/hld-template.md` | 文档结构与章节规范 |
| HLD 内容规范 | `.agents/knowledge/phase2-design/hld-spec.md` | 分层边界、质量清单 |
| 图表生成 | 调用 `diagram-generator` 技能 | 架构图、概念ER图、部署图 |
| 分析/撰写/审查 | `design-analyzer` / `design-writer` / `design-reviewer` | 三代理（DOC_TYPE=hld） |
