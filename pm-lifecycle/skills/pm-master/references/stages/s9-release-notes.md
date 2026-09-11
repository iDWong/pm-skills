## 阶段9：发版说明

**目标**：基于真源与交付物生成发版说明。

**输入**：
- `SPEC_SOURCE`
- `prd/planning/roadmap.md`（**迭代／只要文档裁剪下不存在**；缺失时改用 `SPEC_SOURCE` 的功能清单 +
  git log／已完成任务清单来确定本次发了什么，不要因为没有路线图就停下）
- `dev/code/`（若有）

**执行方式**：调用 `pm-release-notes` skill

**传入上下文**：
```
请读取 {SPEC_SOURCE} 与 prd/planning/roadmap.md，生成 V1.0 发版说明。
功能列表从 SRS 3.2/3.3 或 PRD §4 提取。
```

**输出**：`prd/release/release-notes-{产品名}-{版本}.md`（技能不落盘，**流程代写**；命名见 `../flow-engine.md` 代落盘规则）

**完成标志**：发版说明清晰描述所有新功能，用户可快速了解版本更新内容

---
