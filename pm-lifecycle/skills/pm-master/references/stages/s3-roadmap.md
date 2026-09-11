## 阶段3：产品路线图

**目标**：基于功能优先级，规划产品迭代路线图

**档位**（Step 0 问题3 已选定）：
- 默认档 `pm-roadmap`——项目内自动扫上下文，快速出路线图并落盘
- 深度档 `pm-roadmap-planner`——目标对齐／能力拆分／里程碑编排／风险缓冲四步法 + 甘特图 HTML

两档**产出路径相同**（`prd/planning/roadmap.md`），深度档额外产出甘特图 HTML。

**输入**：
- `prd/planning/feature-priority.md`（阶段2输出）
- `prd/research/user-persona.md`（阶段1输出）

**执行方式**：调用 `pm-roadmap` skill

**传入上下文**：
```
请读取 prd/planning/feature-priority.md，规划产品路线图。

要求：
- 将功能分配到 3-4 个版本
- V1.0 只包含 P0 功能（MVP）
- 每个版本设定里程碑和交付时间
- 说明版本间的依赖关系
```

**输出**：`prd/planning/roadmap-{产品名}-{年度}.md`

**完成标志**：产品路线图已写入，V1.0 功能范围明确

---
