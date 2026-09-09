## 阶段6：前端原型

**目标**：基于 **阶段5 真源（`SPEC_SOURCE`，须为 SRS）** 生成可运行前端代码。

**前置**：`SPEC_SOURCE` 指向 SRS；若为 PRD，先完成 **阶段5C**。

**批量模式的前置**：用户要「实现全部功能／连续实现」时，`page-generator` 需要 `docs/delivery-plan.md`
（由 `delivery-plan` 技能产出，按 SRS 模块依赖排顺序）。**流程里 `delivery-plan` 不是必需阶段**，
所以进阶段6 前若用户要批量实现，**先问一句要不要跑 `delivery-plan`**——不跑就只能按 3.1 功能列表顺序做，
没有依赖校验。单个功能实现（「实现xxx」）不需要它。

**输入**：`SPEC_SOURCE`（SRS 路径）

**执行方式**：

### 6.1 — 项目框架

在已有业务项目中直接调用 **`page-generator`**（勿使用已移除的 vue-admin-generator 等旧名）。

传入：从 SRS 读取 3.1 菜单结构、3.3 页面清单、主题与登录方式（自 SRS 提取）。

### 6.2 — 逐功能页面

按 SRS 3.2/3.3 的 V1.0 模块，**每个功能一次** `page-generator`（批量模式不在功能间询问「继续吗」）。

**交付模式**：继承 Step 0 所选 `DELIVERY_MODE`（**流水线默认标准**）。阶段 6 调用 `page-generator` 时传入同一模式；未选快速则步骤 6 **全量双审查**。

**输出**：业务项目 `src/`（或子项目 `admin/`、`mobile/` 等）

**完成标志**：V1.0 页面可访问；`npm run dev` 可启动（verification 按 AGENTS 交付模式）

---
