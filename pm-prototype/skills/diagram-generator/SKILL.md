---
name: diagram-generator
description: '> 用户要求在文档中生成、创建、绘制或插入任何类型图表时必须使用本技能。 重要：通过 req-doc 技能生成需求说明书时，必须使用本技能生成所有图表，禁止手动绘制图表。
  触发场景： (1) 流程图/活动图: "生成流程图" "画流程图" "重新生成流程图" "插入流程图" "生成活动图" "用户操作流程图", (2) 架构图:
  "生成架构图" "画架构图" "插入架构图" "系统架构图", (3) 时序图: "生成时序图" "画时序图" "插入时序图" "系统交互时序", (4) 泳道图:
  "生成泳道图" "画泳道图" "插入泳道图", (5) ER图: "生成ER图" "实体关系图" "数据库设计图", (6) UML图: "生成UML" "类图"
  "用例图" "状态图", (7) 组织结构图: "组织架构图" "组织结构" "人员架构", (8) 思维导图: "生成思维导图" "画思维导图" "脑图" "心智图"
  "知识梳理", (9) BPMN: "生成BPMN" "业务流程建模", (10) 任何需要将业务流程、系统架构、数据流或其他内容可视化为图表的请求。'
---

> **⚠️ `.agents/` 是外部资源包路径，本机已不存在**（`Documents/Claude/Product/.agents/` 已删除）。
> 下文凡引用 `.agents/knowledge/`、`.agents/agents/`、`.agents/agent-memory/` 的地方**读不到文件**，
> 按以下降级处理，**不要因此中止**：
> - `.agents/knowledge/**`（内容规范、质量清单）→ 用本技能 `references/` 下的模板与检查表；两者都缺时按通用工程规范执行并在产出里标注「无内容规范可依」
> - `.agents/agents/*.md`（子 Agent 派发）→ 不派发，由当前会话直接执行该角色的工作
> - `.agents/agent-memory/**`（跨会话记忆）→ 跳过读写，改为在产出里写清本次的决定
> - `.agents/rules/prd-to-srs-gate.md` → **已迁到 `../common/prd-to-srs-gate.md`**（库内权威副本）

# 图表生成器（draw.io）

## 核心原则

**所有图表统一使用 draw.io XML 格式，通过后端 API 渲染为 PNG/SVG。**

- 不使用 Mermaid、PlantUML、D2 或任何其他图表语言
- 源文件为 `.xml`（draw.io 格式），输出为 `.png`（默认）或 `.svg`
- 渲染通过配置的 draw.io 渲染服务完成（技能根 `config.json` 的 `diagramApiUrl` → `POST {diagramApiUrl}/api/export`）；
  **端点不随仓库分发**，未配置时 `render-diagram.*` 会明确报错并提示如何配。校验（`validate-diagram.*`）是本地的，不需要端点

## 角色定义

你是业务架构师，负责将需求转化为清晰的可视化图表。你的输出必须：
1. 准确表达业务逻辑和系统结构
2. 遵循 draw.io XML 规范
3. 通过 API 渲染验证后才能交付

## 使用流程

### 单张图表生成

```
1. 确定图表类型 → 查阅类型对照表
2. 调用 diagram-drawer agent 生成 XML
   - 传入：PROJECT_PATH, SKILL_PATH, DIAGRAM_TYPE, DESCRIPTION
   - agent 自动读取绘图规范 + 模板 → 生成 → 自检
3. 接收 agent 输出的 XML
4. 保存 XML 源文件 → `<目标文档所在目录>/images/src/<名称>.xml`（见下方「输出目录」）
5. 调用本地校验脚本 `validate-diagram` 确认 XML 结构合法（见「本地校验脚本」）
6. 调用渲染脚本 → 按平台选择 `render-diagram.ps1`（Windows）或 `render-diagram.sh`（Git Bash / Linux / macOS）生成 PNG
7. 验证渲染成功 → 确认文件存在且大小 > 0
8. 在文档中插入图片引用
```

### Agent 调用方式

使用 Task 工具调用子 Agent 生成 XML。Cursor 环境无内置 `diagram-drawer` 类型时，使用 `generalPurpose` + 读取 agent 定义：

```
subagent_type: "generalPurpose"
readonly: true
prompt:
  你是 diagram-drawer 子 Agent。开始前必须先 Read `.agents/agents/diagram-drawer.md` 并严格按其 Step 1-5 执行。
  你只输出 XML，不触发其他技能，不派发子 Agent。

  PROJECT_PATH: {项目根目录}
  SKILL_PATH: {PROJECT_PATH}/../diagram-generator
  DIAGRAM_TYPE: bpmn | flowchart | sequence | architecture | system-arch | swimlane | cross-functional | matrix-swimlane | er | class | usecase | state | orgchart | mindmap | mindmap-vertical | mindmap-radial | mindmap-minimal
  DESCRIPTION: {图表内容描述，包含节点名称、流程步骤、角色等}
  CONTAINER_SIZE: {可选，如 "1050x1000"}
  STYLE_OVERRIDE: {可选，如 "swimlane border: #b0b8c0"}
```

> `diagram-drawer` agent 定义在 `.agents/agents/diagram-drawer.md`。

### 批量生成（需求文档场景）

```
1. 分析文档中所有需要图表的位置
2. 逐张调用 diagram-drawer agent 生成 XML
3. 保存所有 XML 源文件
4. 批量调用 `validate-diagram` 校验每个源文件
5. 批量调用渲染脚本
6. 验证所有图片生成成功
7. 在文档中插入所有图片引用
```

## API 调用

### 渲染脚本（推荐）

### 输出目录：**必须与要插图的那份文档同级**

Word 导出接口只认 `images/<纯ASCII名>.png`（与文档同级的 `images/` 子目录），**其余路径形式一律丢图**。
所以渲图前先确定图要插进哪份文档，把 PNG 渲到**那份文档同级的 `images/`** 下：

| 目标文档 | 落在 | PNG 渲到 | 文档里引用 |
|---|---|---|---|
| SRS（`req-doc`） | `docs/SRS/` | `docs/SRS/images/` | `images/xxx.png` |
| PRD（`prd-writer`／`pm-prd-spec`） | `docs/PRD/` | `docs/PRD/images/` | `images/xxx.png` |
| 概要／详细设计（`hld-design`／`lld-design`） | `docs/架构/` | `docs/架构/images/` | `images/xxx.png` |
| 可研／功能清单（`feasibility-report`／`feature-list`） | `docs/规划/` | `docs/规划/images/` | `images/xxx.png` |
| 流程阶段产出 | `docs/` 根 | `docs/images/` | `images/xxx.png` |

**渲到 `docs/images/` 是老写法，只有当文档本身在 `docs/` 根下时才对**——SRS/PRD/设计说明书都不在根下，
渲到 `docs/images/` 会让它们的 `images/xxx.png` 引用指向不存在的文件（脚本报 `! missing image`，
导出仍"成功"但 `word/media` 是 0）。2026-09-10 实测确认。

XML 源文件同理放 `<文档目录>/images/src/`，与 PNG 同级便于对照。首次使用前确保这两个目录存在。

下面示例用 `<DOC_DIR>` 代表目标文档所在目录（如 `docs/SRS`、`docs/PRD`、`docs/架构`、`docs`）。

**Windows（PowerShell，需 Python 3）：**

```powershell
../diagram-generator/scripts/render-diagram.ps1 <DOC_DIR>/images/src/login-flow.xml <DOC_DIR>/images/login-flow.png
```

**Git Bash / Linux / macOS：**

```bash
../diagram-generator/scripts/render-diagram.sh <DOC_DIR>/images/src/login-flow.xml <DOC_DIR>/images/login-flow.png
```

**跨平台（Python 3）：**

```bash
python ../diagram-generator/scripts/render-diagram.py <DOC_DIR>/images/src/login-flow.xml <DOC_DIR>/images/login-flow.png
```

> Windows 若默认 `bash` 不可用，请使用 Git Bash（`"C:\Program Files\Git\bin\bash.exe"`）或 PowerShell 脚本。

### 本地校验脚本（渲染前推荐）

生成或修改 XML 后、调用渲染 API **之前**，运行校验脚本做离线结构检查（仅需 Python 3 标准库，不调用 `config.json`）。

**Windows（PowerShell）：**

```powershell
../diagram-generator/scripts/validate-diagram.ps1 <DOC_DIR>/images/src/login-flow.xml
```

**Git Bash / Linux / macOS：**

```bash
../diagram-generator/scripts/validate-diagram.sh <DOC_DIR>/images/src/login-flow.xml
```

**跨平台 / 批量：**

```bash
python ../diagram-generator/scripts/validate-diagram.py <DOC_DIR>/images/src/login-flow.xml
python ../diagram-generator/scripts/validate-diagram.py --dir <DOC_DIR>/images/src
```

校验通过（exit code `0`）后再调用 `render-diagram`。**最终以渲染成功为交付门禁**；校验用于快速发现结构错误、减少无效 API 请求。

**可选：** `--check-overlap` 检测顶点包围盒重叠（WARN，不阻断通过）。

### 直接调用 API

```bash
curl.exe -X POST "{diagramApiUrl}/api/export" \
  -H "Content-Type: application/json" \
  -d '{"xml":"<mxGraphModel>...</mxGraphModel>","format":"png","scale":2}' \
  --output output.png
```

> Windows PowerShell 中 `curl` 是 `Invoke-WebRequest` 别名，请使用 `curl.exe` 或渲染脚本。

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| xml | string | 是 | 完整的 draw.io XML 字符串 |
| format | string | 否 | `png`（默认）或 `svg` |
| scale | number | 否 | 缩放倍数，默认 2 |

## 图表类型对照表

| 业务场景 | DIAGRAM_TYPE | 模板文件 | 适用情况 |
| --- | --- | --- | --- |
| 流程图 / 活动图 | flowchart | `examples/flowchart.xml` | 单角色线性流程：开始→步骤→判断→分支→结束 |
| 技术架构图 | architecture | `examples/architecture.xml` | 技术分层：接入/网关/微服务/存储/第三方 |
| 系统功能架构图 | system-arch | `examples/system-arch.xml` | 业务功能分层：左侧层标签 + 模块矩阵 + 图例 |
| 时序图 | sequence | `examples/sequence.xml` | 系统间交互、API 调用链 |
| 纵向泳道图 | swimlane | `examples/swimlane.xml` | 多角色纵向泳道、审批驳回回路 |
| 横向泳道图 | cross-functional | `examples/cross-functional.xml` | 跨职能横向泳道（如请假：员工→主管→HR→财务） |
| 矩阵泳道图 | matrix-swimlane | `examples/matrix-swimlane.xml` | 角色 × 阶段二维矩阵（如订单履约多环节） |
| BPMN 流程图 | bpmn | `examples/bpmn-flow.xml` | 含排他/并行网关的标准 BPMN 建模 |
| ER 图 | er | `examples/er-diagram.xml` | 数据库表关系、实体建模 |
| 类图 | class | `examples/uml-class.xml` | 数据模型、继承与关联 |
| 用例图 | usecase | `examples/uml-usecase.xml` | 角色用例、include 关系 |
| 状态图 | state | `examples/uml-state.xml` | 状态机、订单/审批生命周期 |
| 组织结构图 | orgchart | `examples/orgchart.xml` | 部门层级、汇报关系 |
| 思维导图（左右平衡） | mindmap | `examples/mindmap.xml` | 中心主题左右展开、彩色分支：产品规划、需求拆解 |
| 思维导图（自上而下） | mindmap-vertical | `examples/mindmap-vertical.xml` | 主题置顶、层级向下：功能模块、WBS 拆解 |
| 思维导图（放射状） | mindmap-radial | `examples/mindmap-radial.xml` | 中心向四周辐射、高饱和配色：brainstorm、立项发散 |
| 思维导图（简约线框） | mindmap-minimal | `examples/mindmap-minimal.xml` | 灰阶无阴影直角：OKR、汇报材料、正式文档 |

模板路径相对于 `{PROJECT_PATH}/../diagram-generator/`。人类可读索引见 `examples/模板索引.md`。

每个模板 XML 在 `examples/` 下配有**同名 `.png` 预览图**（如 `flowchart.xml` ↔ `flowchart.png`），供人类在 IDE 中快速对照版式；预览图由维护者手工更新，Agent 生成时以 XML 模板为准，**勿用 API 覆盖 `examples/*.png`**。

### 模板选型指南

| 用户意图 | 推荐模板 | 勿混用 |
| --- | --- | --- |
| 「画流程图 / 用户操作步骤」 | `flowchart.xml` | 多角色协作应选泳道类 |
| 「系统架构 / 技术架构 / 微服务」 | `architecture.xml` | 功能模块清单应选 `system-arch.xml` |
| 「功能架构 / 系统功能模块 / 业务能力分层」 | `system-arch.xml` | 技术栈分层应选 `architecture.xml` |
| 「泳道图 / 跨部门协作」且角色纵向排列 | `swimlane.xml` | 横向职能流选 `cross-functional.xml` |
| 「跨职能流程 / 横向泳道」 | `cross-functional.xml` | 角色×阶段矩阵选 `matrix-swimlane.xml` |
| 「多角色 × 多阶段矩阵」 | `matrix-swimlane.xml` | 简单审批流选 `swimlane.xml` |
| 「BPMN / 业务流程建模 / 网关分支」 | `bpmn-flow.xml` | 普通审批不含网关时选 `swimlane.xml` |
| 「思维导图 / 脑图 / 知识梳理 / 主题拆解」 | 见下方思维导图风格表 | 有汇报关系的层级应选 `orgchart.xml`；有先后顺序应选 `flowchart.xml` |

### 思维导图风格选型

| 用户意图 / 风格偏好 | 推荐模板 | 勿混用 |
| --- | --- | --- |
| 默认 / 左右平衡 / 彩色 B 端 | `mindmap.xml` | 层级向下拆解选 `mindmap-vertical.xml` |
| 功能清单 / WBS / 模块自上而下 | `mindmap-vertical.xml` | 发散 brainstorm 选 `mindmap-radial.xml` |
| brainstorm / 立项发散 / 四周辐射 | `mindmap-radial.xml` | 正式汇报灰阶风选 `mindmap-minimal.xml` |
| 简约 / 线框 / 灰阶 / 打印友好 | `mindmap-minimal.xml` | 需要鲜艳分区配色选 `mindmap.xml` 或 `mindmap-radial.xml` |

## 模板参考流程

由 diagram-drawer agent 自动完成，主流程无需手动读取模板：

1. agent 根据 DIAGRAM_TYPE 读取 `examples/` 下对应模板 XML
2. agent 读取 `.agents/knowledge/diagram/common-rules.md` 通用规范 + 专项规范
3. agent 以模板为骨架，替换为实际业务内容
4. agent 自检通过后输出 XML

**主流程只负责：** 接收 XML → 保存文件 → 调用渲染 → 验证结果

## draw.io XML 结构

### 基本骨架

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- 节点和连线从 id="2" 开始 -->
  </root>
</mxGraphModel>
```

### 节点（vertex）

```xml
<mxCell id="2" value="节点文字" style="样式字符串" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

### 连线（edge）

```xml
<mxCell id="10" value="标签" style="edgeStyle=orthogonalEdgeStyle;rounded=0;" edge="1" source="2" target="3" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### 容器（泳道/分组）

```xml
<mxCell id="2" value="泳道名" style="swimlane;startSize=30;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="700" height="100" as="geometry"/>
</mxCell>
<!-- 子节点 parent 指向容器 id -->
<mxCell id="3" value="子节点" style="rounded=1;" vertex="1" parent="2">
  <mxGeometry x="20" y="40" width="100" height="40" as="geometry"/>
</mxCell>
```

## 样式参考

### 节点样式

| 类型 | style 值 |
| --- | --- |
| 普通节点 | `rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;` |
| 判断菱形 | `rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;` |
| 开始圆形 | `ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;` |
| 结束圆形 | `ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=12;` |
| 数据库 | `shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;size=10;` |
| 思维导图中心主题 | `ellipse;shadow=1;whiteSpace=wrap;html=1;fillColor=#1565c0;strokeColor=#0d47a1;fontColor=#ffffff;fontSize=14;fontStyle=1;` |
| 思维导图一级分支 | `rounded=1;shadow=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333333;fontSize=12;fontStyle=1;arcSize=12;` |
| 思维导图简约中心 | `rounded=0;whiteSpace=wrap;html=1;fillColor=#fafafa;strokeColor=#424242;fontColor=#212121;fontSize=14;fontStyle=1;strokeWidth=2;` |

### 容器样式

| 类型 | style 值 |
| --- | --- |
| 泳道 | `swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;html=1;fontSize=13;fontStyle=1;` |
| 分层容器 | `swimlane;startSize=30;fillColor=#f5f5f5;strokeColor=#666666;html=1;fontSize=13;fontStyle=1;horizontal=1;` |

### 连线样式

| 类型 | style 值 |
| --- | --- |
| 正交连线 | `edgeStyle=orthogonalEdgeStyle;rounded=0;` |
| 直线连线 | `rounded=0;` |
| 虚线 | `dashed=1;edgeStyle=orthogonalEdgeStyle;rounded=0;` |
| 思维导图分支线 | `curved=1;html=1;strokeColor=#6c8ebf;strokeWidth=2;endArrow=none;` |

## 配色方案

| 语义 | 填充色 | 边框色 | 用途 |
| --- | --- | --- | --- |
| 蓝色系 | #dae8fc | #6c8ebf | 主流程节点、表现层 |
| 绿色系 | #d5e8d4 | #82b366 | 开始节点、成功状态 |
| 红色系 | #f8cecc | #b85450 | 结束节点、错误状态 |
| 黄色系 | #fff2cc | #d6b656 | 判断节点、数据层 |
| 紫色系 | #e1d5e7 | #9673a6 | 业务层、中间件 |
| 灰色系 | #f5f5f5 | #666666 | 容器背景、分隔 |

## 文件命名与路径

### 源文件（XML）

```
<DOC_DIR>/images/src/<模块>-<描述>.xml
```

示例：
- `<DOC_DIR>/images/src/login-flow.xml`
- `<DOC_DIR>/images/src/system-arch.xml`
- `<DOC_DIR>/images/src/order-sequence.xml`

### 输出文件（PNG/SVG）

```
<DOC_DIR>/images/<模块>-<描述>.png
```

示例：
- `<DOC_DIR>/images/login-flow.png`
- `<DOC_DIR>/images/system-arch.png`

### 文档引用

```markdown
![登录流程图](<DOC_DIR>/images/login-flow.png)
```

## 布局规范

- 节点最小宽度：100px，高度：40px
- 节点间距：水平 50px，垂直 60px
- 泳道高度：至少 100px
- 字体大小：节点 12px，泳道标题 13px（fontStyle=1 加粗）
- 画布起始坐标：x=40, y=40
- 思维导图：默认左右平衡（`mindmap.xml`）；WBS / 功能拆解用自上而下（`mindmap-vertical.xml`）；brainstorm 用放射状（`mindmap-radial.xml`）；正式汇报用简约线框（`mindmap-minimal.xml`）

## 禁止行为

1. **禁止使用 Mermaid/PlantUML/D2** — 所有图表必须是 draw.io XML
2. **禁止跳过本地校验与渲染验证** — 须先 `validate-diagram` 通过，再 `render-diagram` 确认输出
3. **禁止绕过 config.json** — 渲染时优先从 `../config.json` 读取 API 地址，仅在 config.json 不存在时使用默认值
4. **禁止省略 id="0" 和 id="1"** — 这两个根节点是 draw.io 必需的
5. **禁止使用中文文件名** — 文件名用英文，节点内容可以用中文
6. **禁止不验证就声称完成** — 渲染成功才算完成
7. **禁止覆盖 `examples/*.png`** — 模板预览图为手工维护，仅同步 XML 模板
