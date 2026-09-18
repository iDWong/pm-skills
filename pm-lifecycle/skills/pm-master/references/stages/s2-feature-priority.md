## 阶段2：功能优先级

**目标**：基于用户画像，对功能需求进行优先级排序

**档位**（Step 0 问题3 已选定）：
- 默认档 `pm-feature-prioritization`——项目内自动扫上下文，快速排一轮并落盘
- 深度档 `pm-prioritization-engine`——RICE／ICE／Kano 多模型交叉 + 权重校准 + 敏感性分析 + 高分歧裁决

两档**产出路径相同**（`prd/planning/feature-priority-{产品名}.md`）。

**输入**：
- `prd/research/market-research*.md`（阶段0输出）
- `prd/research/user-persona*.md`（阶段1输出）

> 输入块里是 glob，**由流程解析成真实路径后再传给技能**（见 `../flow-engine.md`「流程内调用技能的约定」）。

**执行方式**：按 Step 0 问题3 定下的档位调用对应技能——**不要两档都跑，也不要默认档顶替深度档**。

<details><summary><b>默认档 · 调用 <code>pm-feature-prioritization</code></b></summary>

**传入上下文**：
```
请读取 {市场调研报告} 和 {用户画像}，
对以下功能需求进行优先级排序：

[用户提供的功能列表]

使用 RICE 模型评估，输出：
- P0（必须有）功能列表
- P1（重要）功能列表
- P2（可选）功能列表
```
</details>

<details><summary><b>深度档 · 调用 <code>pm-prioritization-engine</code></b></summary>

**传入上下文**：
```
请读取 {市场调研报告} 和 {用户画像}，
对以下功能需求做多模型交叉优先级排序：

[用户提供的功能列表]

要求：
- RICE / ICE / Kano 三个模型分别打分，并列出三者的排序差异
- 权重校准：说明各因子取值依据，不要凭感觉给分
- 敏感性分析：指出哪些条目的排名对参数变化最敏感
- 高分歧裁决：三模型排序差异大的条目单独列出并给裁决建议
- 最终输出 P0 / P1 / P2 分级 + Now/Next/Later
```
</details>

**输出**：`prd/planning/feature-priority-{产品名}.md`（技能不落盘，**流程代写**；命名见 `../flow-engine.md` 代落盘规则）

**完成标志**：功能优先级文档已写入，所有功能已分级

---
