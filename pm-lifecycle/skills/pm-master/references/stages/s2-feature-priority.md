## 阶段2：功能优先级

**目标**：基于用户画像，对功能需求进行优先级排序

**档位**（Step 0 问题3 已选定）：
- 默认档 `pm-feature-prioritization`——项目内自动扫上下文，快速排一轮并落盘
- 深度档 `pm-prioritization-engine`——RICE／ICE／Kano 多模型交叉 + 权重校准 + 敏感性分析 + 高分歧裁决

两档**产出路径相同**（`docs/feature-priority.md`）。

**输入**：
- `docs/market-research.md`（阶段0输出）
- `docs/user-persona.md`（阶段1输出）

**执行方式**：调用 `pm-feature-prioritization` skill

**传入上下文**：
```
请读取 docs/market-research.md 和 docs/user-persona.md，
对以下功能需求进行优先级排序：

[用户提供的功能列表]

使用 RICE 模型评估，输出：
- P0（必须有）功能列表
- P1（重要）功能列表
- P2（可选）功能列表
```

**输出**：`docs/feature-priority-{产品名}.md`（技能不落盘，**流程代写**；命名见 `../flow-engine.md` 代落盘规则）

**完成标志**：功能优先级文档已写入，所有功能已分级

---
