## 阶段5：需求文档（SRS / PRD 分支）

**目标**：将阶段4概述扩展为可交付的需求文档，并登记 **阶段5 真源路径**（供阶段6–9 读取）。

**本阶段完成后有两条并列下游**：阶段6 `page-generator`（→ `src/` 真实代码，认 SRS）／设计稿 `ui-ux-pro-max`（→ `Prototype/<项目slug>/` 可点 HTML，**PRD 为主真源且需 PRD+SRS 都有**）。判据表见 `../../SKILL.md`「设计稿和前端原型是两条不同的路」。

**输入**：
- `docs/requirements.md`（阶段4）
- `docs/roadmap.md`（阶段3，V1.0 范围）——**快速交付／只要文档／迭代三个裁剪跳过了阶段3，此文件不存在**。
  缺失时的替代：① 用 `docs/requirements.md` 里用户圈定的范围；② 问用户一句「本次做到哪个版本／哪些功能进 V1」；
  ③ 存量产品迭代时读已有的 `docs/roadmap.md`（老文件也算）。**三条都拿不到就不要自己编版本范围**，标为待确认
- Step 0 选的文档类型、交付模式

**档位在本阶段的含义**：本阶段**不看 Step 0 问题3（档位）**，走的是**问题5 选的文档类型**——
下方 5.0 表就是本阶段唯一的分支选择器（不要另立一套）。

**技能选择的硬约束**：
- `req-doc`、`prd-writer` 是流程原生技能，会登记 `SPEC_SOURCE`，阶段6–9 靠它读规格
- `pm-prd-spec`（字段级 + 线框图 + Word）认识 `docs/PRD/`、`docs/SRS/` 落盘约定但**不登记 `SPEC_SOURCE`**：
  用户明确要字段级规格时可在 5B 用它，但**流程必须在本阶段收尾时代为登记 `SPEC_SOURCE=<它落的 PRD 路径>`**
- **`pm-prd-writer` 不要在流程内使用**——不登记真源、不知道落盘目录，阶段6 会拿不到规格。它走单点路由

用户在 Step 0 选了「深度档」时，本阶段的唯一体现是：5B 分支下可改用 `pm-prd-spec`（并代登记真源）；
**选了 SRS 就只有 5A 一条路**，深度档不改变它。

### 5.0 分支选择（进入本阶段时执行一次）

| Step 0 选择 / 信号 | 调用技能 | 阶段5 真源路径 |
| --- | --- | --- |
| **SRS**（默认，且含阶段6） | **`req-doc`** | `docs/SRS/{日期}-{项目}-SRS需求规格说明书-V*.md` |
| **PRD**（只要文档 / 不对接研发） | **`prd-writer`** | `docs/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-V{版本号}.md`（+ 可选 `-概念版-V*.md`） |
| **先 PRD 后 SRS** | **`prd-writer`** → **`req-doc`** | 最终以 **SRS 路径** 为真源；PRD 路径写入 SRS 文首引用 |
| **已有 Axure/HTML/URL** | **`prototype-to-prd`** → **`prd-writer`** | 默认 PRD；若含阶段6，盘点+PRD 完成后 **须转 SRS**（`req-doc` 或用户确认转写） |
| 用户未选但 **含阶段6** | **`req-doc`** | 同 SRS 行（page-generator 依赖 SRS 章节结构） |

**禁止**：含阶段6 时仅以 PRD（`docs/PRD/*.md`）为真源调用 page-generator（除非用户明确接受手动对齐且跳过 SRS 模板）。

**交付模式**：传入各技能（`req-doc` A6 抽检 / `prd-writer` 快路径等），三档定义见 `../flow-engine.md` 问题6。

---

### 5A. SRS 路径（`req-doc`）

**执行方式**：调用 `req-doc`，传入阶段4 `requirements.md` + 阶段3 V1.0 范围。

**关键规范**：
- 只生成 V1.0 / P0 模块（对照 `roadmap.md`）
- 读取 `docs/requirements.md` 作为 analyzer 输入摘要
- 遵循 `req-doc` **标准模式**（A6 抽检、P0 自动修）；流水线内 **不重复**额外全文审查

**输出**：SRS 文件（上表路径）

**完成标志**：SRS 覆盖 V1.0 功能模块；3.2/3.3/3.5.x 结构完整

**登记**：在会话中记录 `SPEC_SOURCE=<SRS 绝对或相对路径>`

---

### 5B. PRD 路径（`prd-writer`）

**执行方式**：调用 `prd-writer` 模式 A；以 `requirements.md` 写入概念版「已有输入摘要」。

**关键规范**：
- **标准/快速**：可说「跳过概念版」走快路径（见 `prd-writer` §0）
- MVP 以 §4 🔴 为准，流水线内 **不另开** MVP 口头确认（除非 **严格** 模式）
- 若后续含阶段6 且用户选「先 PRD 后 SRS」→ 本小节完成后执行 **5C**

**输出**：`docs/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-V{版本号}.md`（及可选 `-概念版-V*.md`、`-原型盘点-V*.md`）

**完成标志**：PRD §4 功能树覆盖 V1.0 范围

**登记**：`SPEC_SOURCE=<PRD 路径>`（未转 SRS 前）

---

### 5C. PRD → SRS 转写（门禁 · 含阶段6 时强制）

**规则**：Read `.agents/rules/prd-to-srs-gate.md`。**含阶段6 时不可跳过。**

**触发**：阶段6 开始前 `SPEC_SOURCE` 仍指向 PRD；或用户说「进开发」且仅有 PRD。

**执行方式**：调用 **`req-doc` Step F**（非 Step A 泛化生成）；输入 PRD + 可选 `requirements.md`；对照 `req-doc/references/prd-to-srs-handoff.md`。

**完成标志**：SRS 落盘 + 门禁 §5 七项检查 + `SPEC_SOURCE` **更新为 SRS 路径**

**批量模式**：不询问「是否转写」，默认自动执行 5C。

---

### 5D. 原型逆向（`prototype-to-prd`）

**执行方式**：按 `prototype-to-prd/SKILL.md` 完成盘点 → `prd-writer`；**标准模式**下盘点 **默认继续**。

**含阶段6**：盘点+PRD 完成后执行 **5C**，再进入阶段6。

**登记**：`SPEC_SOURCE` 最终指向 SRS（含阶段6）或 PRD（仅文档）

---

### 阶段5 完成检查

```
SPEC_SOURCE 已登记 ✅
含阶段6 → SPEC_SOURCE 指向 SRS 文件 ✅
仅文档 + PRD → SPEC_SOURCE 指向 `docs/PRD/*-产品需求文档-V*.md` ✅（概念版／评审／原型盘点都不算）
```

---
