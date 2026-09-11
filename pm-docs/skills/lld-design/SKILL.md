---
name: lld-design
description: >
  生成详细设计说明书（LLD / Low-Level Design）的技能，一份文档涵盖「模块详细设计 + 数据库物理设计 + API详细设计」三大维度。在概要设计后、编码前，产出开发可直接照着编码的设计依据。
  触发场景：(1) "详细设计" "详细设计说明书" "生成详细设计" "写详细设计" "LLD",
  (2) "数据库设计" "数据库物理设计" "表结构设计" "建表设计" "数据库文档",
  (3) "API设计" "接口设计" "API详细设计" "接口文档" "接口规格",
  (4) "类图设计" "模块详细设计" "时序设计",
  (5) "审查详细设计" "检查详细设计" "检查表结构" "检查接口设计",
  (6) "根据代码生成详细设计" "反向生成详细设计" "从代码补数据库设计" "同步详细设计" "代码和设计对齐",
  (7) "导出详细设计" "详细设计导出Word",
  (8) 用户已有 SRS 或概要设计，需要产出表结构/接口/模块实现级设计文档时触发。
  支持完整生成、局部完善、审查修复、反向同步、导出 Word。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
metadata:
  author: Wong
  version: "1.1"
  reviewed: "2026-09-12"
---

> **⚠️ `.agents/` 是外部资源包路径，本机已不存在**（`Documents/Claude/Product/.agents/` 已删除）。
> 下文凡引用 `.agents/knowledge/`、`.agents/agents/`、`.agents/agent-memory/` 的地方**读不到文件**，
> 按以下降级处理，**不要因此中止**：
> - `.agents/knowledge/**`（内容规范、质量清单）→ 用本技能 `references/` 下的模板与检查表；两者都缺时按通用工程规范执行并在产出里标注「无内容规范可依」
> - `.agents/agents/*.md`（子 Agent 派发）→ 不派发，由当前会话直接执行该角色的工作
> - `.agents/agent-memory/**`（跨会话记忆）→ 跳过读写，改为在产出里写清本次的决定
> - `.agents/rules/prd-to-srs-gate.md` → **已迁到 `../common/prd-to-srs-gate.md`**（库内权威副本）

# 详细设计说明书（LLD）生成器

## Agent 协作架构

```
lld-design skill（主流程：调度 + 文件写入）
  ├── design-analyzer agent（分析师，DOC_TYPE=lld）
  │     职责：读 SRS/HLD/代码，输出实现级摘要（类/表结构/字段/索引/接口签名/错误码）
  │     按 database.md 补全必备字段，按 backend.md 规整接口
  │
  ├── design-writer agent（撰写者，DOC_TYPE=lld）
  │     职责：摘要 + 模板 + 技术规范 → 模块详设/数据库物理设计/API详细设计章节
  │
  └── design-reviewer agent（审查者，DOC_TYPE=lld）
        职责：五维度审查（结构完整性/分层边界/技术规范符合/可追溯性/设计质量）
        重点：表必备字段、命名规范、索引、统一响应格式、可追溯性
```

**先写后审原则：** 生成 → 写入 → design-reviewer 审查 → 汇总 → 询问修复 → 用户确认后修复。

**分组并行策略**（模块多时）：按 2-3 个模块一组，组内并行 analyzer → 并行 writer → 串行写入，组间串行。审查阶段统一在末尾进行。

## 工作模式

| 模式 | 触发场景 | 入口 |
|------|---------|------|
| **生成模式** | 从 SRS/HLD 生成 LLD | → Step A |
| **局部完善模式** | 补充/修改某模块或某表/接口 | → Step B |
| **审查修复模式** | 审查已有 LLD 并修复 | → Step C |
| **反向同步模式** | 根据代码更新 LLD（代码是真相源） | → Step D |
| **导出模式** | 导出为 Word 文档 | → 导出 Word 章节 |

---

## Step A: 生成模式

### A1: 扫描项目上下文

| 优先级 | 文件类型 | 查找方式 |
|--------|---------|---------|
| 最高 | 概要设计 | `Glob("**/*概要设计*.md")` |
| 高 | SRS需求说明书 | `Glob("**/*需求*说明书*.md")` |
| 中 | 已有详细设计 | `Glob("**/*详细设计*.md")` |
| 关键 | 代码 | `src/views/`, `src/api/`, `src/mock/`, entity 文件, `src/router/` |

- 有 HLD → analyzer 用 `from_hld` 派生；无 HLD 仅有 SRS → 提示 HLD 缺失但可继续（from_srs）
- **仅有 PRD、无 SRS** → Read `../common/prd-to-srs-gate.md`，**中止**，路由 **`req-doc` Step F**
- **代码是 LLD 表结构/接口的最重要来源**，必须扫描 mock/api/entity
- 找到已有 LLD → 转 Step B / C

### A2: 读取模板与规范

读取 `references/templates/lld-template.md`。design-analyzer / writer / reviewer 会自行读取 database.md / backend.md / security.md，主流程无需预读。

### A3: 确定模块范围

从 HLD 模块清单或 SRS 功能清单确定要做详细设计的模块列表，与用户确认范围（可全量，也可指定优先模块）。

### A4: 生成任务清单

**必须先展示任务清单，再逐个生成。**

模块详细设计（三、）按模块拆分为 [Agent] 任务并分组；数据库（四、）和 API（五、）有两种编排：
- **集中编排**（推荐，文档更清晰）：各模块 analyzer 完成后，主流程汇总所有表与接口，统一生成四、五章
- **随模块编排**：每个模块连带自己的表和接口一起写（模块自治时适用）

```
| 序号 | 任务名称 | 类型 | 分组 | 状态 |
|------|---------|------|------|------|
| 1 | 创建文件 - 封面+文档信息+引言（全局约定） | [文档] | - | [ ] 等待中 |
| 2 | 生成 模块A+模块B 类图+时序图 | [图表] | 第1组 | [ ] 等待中 |
| 3 | 三、3.1 模块A 详细设计 | [Agent] | 第1组 | [ ] 等待中 |
| 4 | 三、3.2 模块B 详细设计 | [Agent] | 第1组 | [ ] 等待中 |
| 5 | 生成 模块C 类图+时序图 | [图表] | 第2组 | [ ] 等待中 |
| 6 | 三、3.3 模块C 详细设计 | [Agent] | 第2组 | [ ] 等待中 |
| 7 | 生成 物理ER图 | [图表] | - | [ ] 等待中 |
| 8 | 四、数据库物理设计（汇总所有表） | [Agent] | - | [ ] 等待中 |
| 9 | 五、API 详细设计（汇总所有接口） | [Agent] | - | [ ] 等待中 |
| 10 | 六、安全设计 + 七、可追溯矩阵 | [Agent] | - | [ ] 等待中 |
```

### A5: 执行任务

**[Agent] 类任务分组执行：**

```
Phase 1 — 并行 analyzer（组内模块同时启动）
  subagent_type: "design-analyzer"
  传入：
    PROJECT_PATH: {项目根目录}
    DOC_TYPE: lld
    FEATURE_NAME: {模块名}
    MODE: from_hld（有HLD）/ from_code（代码为主）/ from_srs
    SOURCE_PATH: 按 MODE 取值——from_hld 传 HLD 文件路径，from_code 传 src/ 目录，from_srs 传 SRS 路径
  （analyzer 会从路由逐层定位代码，提取表结构/接口/类，补全必备字段）
  **主流程必须按模块名索引保存每个 analyzer 的输出摘要，供 A6 审查时取用。**

Phase 2 — 并行 writer（组内模块同时启动）
  subagent_type: "design-writer"
  传入：
    PROJECT_PATH: {项目根目录}
    DOC_TYPE: lld
    FEATURE_NAME: {模块名}（模块详设章节用 FEATURE_NAME；数据库/API 汇总章节用 CHAPTER 传章节名）
    SECTION_NUMBER: {编号}
    设计摘要: {对应模块的 analyzer 输出}
    DIAGRAM_PATHS: {对应类图/时序图/ER图路径}

Phase 3 — 串行写入（按编号顺序 Edit 追加，每次 ≤150 行）
```

**四、数据库 / 五、API 集中编排时：** 主流程汇总各模块 analyzer 输出中的表与接口，去重后传给 design-writer 统一生成（避免同一张表在多模块重复定义）。

**图表：** 每组图表合并为一个批次调用 diagram-generator（类图 class、时序图 sequence、物理ER图 er），路径记入备注。

**注意：** 本阶段不运行 reviewer，统一在 A6 审查。

### A6: 全文审查与修复

1. **并行审查**：模块章节、数据库章节、API章节分别调用 design-reviewer（DOC_TYPE=lld）。传入「章节内容 + 对应摘要」——模块章节传该模块在 A5 按模块名索引保存的 analyzer 摘要；数据库/API 汇总章节传 A5 汇总去重后的表/接口摘要。数据库和API章节是审查重点（必备字段、命名、索引、统一响应格式）。
2. **汇总报告**（P0/P1/P2 分级，同 hld-design A6）
3. **询问用户**："发现 N 个问题，是否修复？" 等待确认
4. **执行修复**：[Agent重写]（问题≥2或涉及规范/结构）/ [主流程修正]（局部问题），[Agent重写] 走 analyzer from_existing → writer → reviewer复审（最多2次）
5. 修复后更新版本号（+0.1），重命名文件

---

## Step B: 局部完善模式

适用：补某个模块、加一张表、补一个接口。

1. 读取现有 LLD 对应章节
2. design-analyzer（MODE: from_existing 或 from_code，DOC_TYPE=lld）
3. design-writer 补充/改写（如需新表，补全必备字段）
4. Edit 写入对应位置
5. design-reviewer 审查 → 汇总 → 询问修复 → 用户确认后修复
6. 更新版本号

---

## Step C: 审查修复模式

1. `Glob("**/*详细设计*.md")` 找到文档
2. 展示审查任务清单：模块章节逐个 + 数据库章节 + API章节
3. 逐项调用 design-reviewer（DOC_TYPE=lld）。**数据库与API是审查重点。**
4. 汇总报告，询问"是否修复？"（"只审查"则停止）
5. 用户确认后生成修复任务清单并执行
6. 更新版本号，重命名文件

---

## Step D: 反向同步模式

**触发场景：** 代码已实现/演进，需将 LLD 与代码现状对齐。**代码是真相源。**

1. **分析代码现状**：以路由注册表为唯一真相源——只有实际注册的路由才算"功能存在"，残留文件不算（判定细则见 `../req-doc/SKILL.md` 的 Step B）。对每个活跃模块，design-analyzer（from_code）提取：实际表字段（mock/entity）、实际接口（api/*.ts）、实际类结构
2. **分析现有 LLD**：提取文档中的表、接口、模块
3. **生成差异清单**：
   - 表级：字段增减、类型变更、新表、废弃表
   - 接口级：接口增减、参数变更、响应变更
   - 模块级：类增减、流程变更
   展示给用户确认
4. **代码质量评估**：若某模块代码信息不足（字段+接口合计过少或 analyzer 自检有✗），标注 ⚠️ 提示人工补充，不自动写入
5. **执行更新**：design-writer 更新对应章节 → 重新生成受影响图表（类图/时序图/ER图）
6. **审查**：design-reviewer → 汇总 → 询问修复
7. 更新版本号

---

## 导出 Word

触发词："导出详细设计" "详细设计导出Word"

```bash
> **⚠️ 导出前后各一件事**：① 图片必须放在**文档同级的 `images/` 子目录**且**文件名纯 ASCII**——这是唯一可用形式，`img/`、`images/sub/`、`../images/`、与文档同目录、中文名**全都静默丢图**（脚本仍打印 `Export succeeded`，但 `word/media/` 是空的）；② 导出后立刻验 `unzip -l <docx> | grep -c "word/media/"`，数字必须等于图片张数。实测边界表见 `../common/README.md`。

bash ../common/export-word.sh <markdown文件路径> formal
```

找到文件：`Glob("dev/design/**/*详细设计*.md")`（旧根 `Glob("docs/**/*详细设计*.md")`），多个让用户选。

## 文档命名规范

`dev/design/{日期}-{客户名称}{项目名称}-详细设计说明书-V{版本号}.md`

示例：`dev/design/20260530-PM能源科技智慧厂区巡检平台-详细设计说明书-V1.0.md`

**修订：就地改也要改文件名。** 大文档（几千行 / MB 级）**就地 `Edit` 改**，别整份重写；但改完必须三样一起动——文首「文档版本」、版本历史表、**`mv` 把文件名的版本号也改掉**（局部修订 `+0.1`，结构性重写进大版本；日期取改动当天）。**绝不允许内容已是 V1.1、文件名还写 V1.0。**改名后 `grep` 一遍旧名，把 README 清单、下游「来源」行、`tools/` 脚本里的引用一并改掉。完整规则见 `../common/README.md`。

## 参考资源

| 资源 | 路径 | 用途 |
|------|------|------|
| LLD 模板 | `references/templates/lld-template.md` | 三维度文档结构 |
| LLD 内容规范 | `.agents/knowledge/phase2-design/lld-spec.md` | 三维度内容要求、质量清单 |
| 数据库规范 | `.agents/knowledge/phase3-development/database.md` | 表/字段/索引/必备字段 |
| 后端规范 | `.agents/knowledge/phase3-development/backend.md` | RESTful、统一响应格式 |
| 安全规范 | `.agents/knowledge/conventions/security.md` | 鉴权、数据安全、注入防护 |
| 图表生成 | 调用 `diagram-generator` 技能 | 类图、时序图、物理ER图 |
| 分析/撰写/审查 | `design-analyzer` / `design-writer` / `design-reviewer` | 三代理（DOC_TYPE=lld） |

## 外部依赖与降级：Word/xlsx 导出

导出链走**技能库根的 `config.json`** 里的 `apiBaseUrl`（本机是 docsvc `http://127.0.0.1:8899`）。

| 情况 | 表现 | 怎么办 |
|---|---|---|
| 没配 `config.json` | 脚本报「无法从 config.json 读取 apiBaseUrl」 | 从同级 `config.example.json` 复制后填地址 |
| 服务没起 | `curl` 连不上 / 超时 | 先自检：`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8899/`，起服务后重试 |
| 两者都缺 | —— | **降级交 md**，并在交付清单里写明「Word 未导出（端点未配）」 |

**三条不许**：不许把「导出失败」写成完成；不许跳过导出直接说交付完成；
不许在导出后不验图——`unzip -l x.docx | grep -c 'word/media/'` 要等于文档里的图片张数（文件名含中文会静默丢图）。
