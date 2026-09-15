---
name: prototype-to-prd
description: |
  从 Axure 导出 HTML 原型或线上网站逆向盘点功能结构，再生成 PRD。
  触发词（任一命中即用本 skill）：Axure 转 PRD、原型转需求、原型生成 PRD、从原型写 PRD、逆向 PRD、网站转 PRD、线上产品写需求、分析原型写 PRD、HTML 原型转文档、/prototype-to-prd、导出 PRD、PRD 导出 Word、需求文档转 Word、PRD 转 Word。
  与 prd-writer 分工：本技能负责「读原型/站点 → 盘点 → 补缺口」；概念版与落地版模板、三视角诊断、MVP 闸门、自检仍复用 prd-writer 的 references/。
  用户仅说「写 PRD」且无原型/站点输入时，用 prd-writer，不用本技能。
metadata:
  author: Wong
  version: "1.2"
  reviewed: "2026-09-15"
---

# Prototype to PRD · 原型/站点逆向写 PRD

把 **可见界面与交互** 转为结构化需求：先盘点真源，再按 `prd-writer` 分两版交付（概念版 → 落地版）。

## 文件结构

| 文件 | 用途 |
| --- | --- |
| **`SKILL.md`**（本文件） | 门禁、输入识别、执行顺序、交付路径 |
| **`references/axure-html-parse.md`** | Axure 导出包结构与提取要点 |
| **`references/web-site-inventory.md`** | 线上站点/本地 HTML 功能盘点 |
| **`references/playwright-mcp-capture.md`** | Playwright MCP 采集 SPA/线上站（**优先于 WebFetch**） |
| **`references/auth-gated-sites.md`** | 需登录 / 内网 / SSO 的降级与协作 |
| **`references/inventory-template.md`** | 原型盘点稿模板（中间产物） |
| **`references/prd-writer-handoff.md`** | 盘点 → 概念版/落地版的衔接规则 |
| **`../prd-writer/references/*`** | 概念版、落地版、诊断、自检等模板（**复用，不复制**） |

**写 PRD 前**：完成盘点并读 `prd-writer-handoff.md`；写概念版/落地版时 `Read` 对应 `prd-writer/references/` 模板。  
**交付模式**：读 `AGENTS.md`「交付模式」；**本技能未声明时默认「标准」**（写 PRD 阶段与 `prd-writer` §0 一致；可说「快速模式」降档或「严格模式」升档）。

---

## 执行顺序（门禁）

```text
用户消息
  → 1. 识别输入源（Axure / 站点 / 混合）
  → 2. 采集与盘点（按 references 执行）
  → 3. 写入「原型盘点」+ 3–5 句摘要（标准：默认继续；用户可打断纠正）
  → 4. 三视角补缺口（仅问盘点看不出的；快速模式：合并为 1 轮）
  → 5. 概念版（标准默认分两文件；快路径见 prd-writer §0）
  → 6. 落地版（prd-writer prd-template + MVP 闸门）
  → 7. prd-writer self-check.md
  → 8. （可选）Word 导出
```

**禁止**：未读原型/站点就写 §5；把猜测写成确定需求。**严格** 下禁止跳过概念版确认；**标准/快速** 按 prd-writer §0。

---

## 1. 识别输入源

| 用户给出 | 类型 | 首要动作 |
| --- | --- | --- |
| Axure 导出文件夹（含 `index.html`、`data/document.js` 等） | **Axure** | `Read` `axure-html-parse.md`；扫描目录与 sitemap |
| 单个/多个本地 HTML（非完整 Axure 包） | **本地页** | 当简化原型读 DOM；无站点图时向用户要页面清单 |
| 公开 URL | **线上站点** | `Read` `web-site-inventory.md`；**已配 Playwright MCP 时** `Read` `playwright-mcp-capture.md` 并优先 MCP 采集；否则 `WebFetch` / 读 `web/` 镜像 |
| URL 需登录 / 内网 / SSO | **门禁站点** | `Read` `auth-gated-sites.md`；先盘公开区；**若用户已配浏览器 MCP** 可按该文件 §9 抓取，否则请用户选补救方案 |
| URL + Axure 包 | **混合** | 分别盘点，文内标注来源 |
| 仅截图、无 HTML | **不足** | 说明限制；请用户提供导出包、URL 或可浏览 HTML |

**主题命名**：从 Axure 项目名、`document.js` 的 `projectName`、站点 `<title>` 或用户说明提取；不确定时用「待定-原型逆向」。

---

## 2. 采集与盘点

### Axure 导出包

按 `references/axure-html-parse.md`：

1. 读 `index.html`、`data/document.js`（或根目录 `document.js`）建立 **页面树 / 站点图**
2. 逐页读 `files/<page>/` 下 HTML（及同目录 `data.js` 若有）：控件文案、表单字段、Tab/步骤、弹层标题
3. 从 `data.js`、页面内脚本、`notes` 区提取 **交互说明、条件分支、动态面板状态**（能解析则写进盘点；解析不出标 `[原型未标明]`）
4. 合并重复母版/公共页，去重导航

### 线上站点 / 本地 HTML

按 `references/web-site-inventory.md`；**采集工具优先级**见下节。

#### 采集工具（线上 URL）

```text
已配置 Playwright MCP？
  ├─ 是 → playwright-mcp-capture.md（navigate → wait → snapshot → evaluate → 多路由）
  └─ 否 → WebFetch；失败则请用户配置 MCP 或导出 HTML
需登录？→ auth-gated-sites.md（MCP 登录协作见该文件 §9）
```

1. 列可达页面（主导航、hash 路由、页脚；登录后若不可达则标注）
2. 每页：模块分区、主 CTA、表单、列表、空态/错误态（若可见）
3. 推断用户动线（主路径 + 可见分支）；**推断处标 `[推断]`**

### 盘点产出

按 `references/inventory-template.md` 写入：

**路径**：`prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-原型盘点-V{版本号}.md`

写完后用 3–5 句摘要告知用户，并说明：

> 盘点已写入 `-原型盘点-V*.md`。若无漏页/理解偏差，我将按 **prd-writer** 继续写 PRD；有需要更正请直接指出。

- **标准 / 快速**：用户 **未在下一轮消息中纠正** → 视为可继续，**不阻塞**等待「确认」
- **严格**：须用户 **明确确认** 盘点无误后再写概念版
- 用户更正 → 更新盘点稿对应章节，再进入下一步

---

## 3. 三视角补缺口

盘点解决「界面有什么」；以下 **不能从原型可靠推出**，按 `prd-writer/references/diagnosis-guide.md` **只补缺口**（每次 1–2 问）：

- **用户**：目标人群、痛点（原型常缺）
- **商业**：变现、为何做、与竞品差异
- **开发**：后端能力、第三方、权限模型、真实数据源

已有 PRD/调研在 `prd/`（旧项目 `docs/`） → 先 `Read`（同 `prd-writer/references/read-first.md`），不重复追问。

---

## 4. 交接 prd-writer 写 PRD

按 `references/prd-writer-handoff.md` 与 `prd-writer/SKILL.md` **模式 A**：

| 步骤 | 模板 | 路径 |
| --- | --- | --- |
| 概念版 | `prd-writer/references/concept-template.md` | `prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-概念版-V{版本号}.md` |
| 落地版 | `prd-writer/references/prd-template.md` | `prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-V{版本号}.md` |

**概念版「已有输入摘要」**：链回 `-原型盘点-V*.md`，并注明输入源（Axure 路径 / URL）。

**落地版额外规则**：

- §3 动线：与盘点中的页面跳转、交互分支一致；简单用 Mermaid，复杂见 `diagram-handoff.md`
- §4 功能清单：页面/模块映射到功能树；🔴🟡⚪ 默认按「主路径可见 + 用户确认的 MVP」划分
- §5：**仅展开 MVP 🔴**；原型有标注的交互/状态/字段优先写入；无标注用 `[待补充]` 并写清影响
- §4.1 线框：优先从盘点中核心页 ASCII 提炼，可与原型布局一致

**严格** 下用户 **明确确认** 概念版后再写落地版（「差不多」不算确认）；**标准** 下用户说「可以/继续」即可进入落地版；**快速** 跳过概念版（见 `prd-writer` §0）。

---

## 5. 交付物一览

| 产物 | 路径 | 说明 |
| --- | --- | --- |
| 原型盘点 | `prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-原型盘点-V{版本号}.md` | 真源摘录 + 来源标注 |
| 概念版 | `prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-概念版-V{版本号}.md` | 方向对齐 |
| 落地 PRD | `prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-V{版本号}.md` | 文首链回概念版与盘点稿 |
| Word 导出 | 与源 Markdown 同目录 `.docx` | **可选**；自检后用户要求时用 `formal` 等模板（见 §8） |

命名片段（`{客户名称}` 可省、`{形态}` 五选一、`{版本号}` 首版 `V1.0`）见 `prd-writer` §4「命名片段规则」，三份产物共用同一前缀。

**修订：就地改也要改文件名。** 大文档（几千行 / MB 级）**就地 `Edit` 改**，别整份重写；但改完必须三样一起动——文首「文档版本」、版本记录表、**`mv` 把文件名的版本号也改掉**（局部修订 `+0.1`，结构性重写进大版本；日期取改动当天）。**绝不允许内容已是 V1.1、文件名还写 V1.0。**改名后 `grep` 一遍旧名，把 README 清单、下游「来源」行、`tools/` 脚本里的引用一并改掉。完整规则见 `../common/README.md`。

**进研发门禁**：PRD 落盘后若用户要开发 → 适用 `prd-writer` §10 / `../common/prd-to-srs-gate.md`，须 **`req-doc` Step F** 再 `page-generator`。

用户已有 PRD、仅想对照原型查漏 → 不走本技能全流程；用 `prd-writer` **模式 B/C**，本技能盘点稿可作为附件输入。

---

## 6. 与相邻技能

| 场景 | 技能 |
| --- | --- |
| 盘点后只要页面清单（不写完整 PRD） | 本技能的盘点报告本身就是页面清单，停在那一步即可 |
| 要把页面清单切成 MVP 分期 | `pm-method-story-mapping`（故事地图横切发布切片） |
| 只要视觉 tokens / 设计系统 | `ui-ux-pro-max --design-system`（出风格+配色+字体+令牌）或 `design-system`（三层令牌与 CSS 变量） |
| 从零口述想法、无原型 | `prd-writer` |
| PRD 完成后画流程图 PNG | `diagram-generator` |
| 完整 0→1 流程 | `pm-master`（13 阶段单一流程；阶段 4 可替换为本技能） |

---

## 7. 通用原则

1. **真源优先**：原型/站点可见 > 用户口头 > 推断；推断与待确认必须标注  
2. **不编造业务规则**：无标注的条件分支不写死逻辑  
3. **复用 prd-writer**：模板、自检、MVP 闸门不另起炉灶  
4. **分阶段**：**严格** 下概念版未确认不写 §5 细节；**标准** 须概念对齐后再写落地版  
5. **写完必过** `prd-writer/references/self-check.md`（盘点稿路径写入自检备注）

---

## 8. 导出 Word（可选）

> **⚠️ 导出前后各一件事**：① 图片必须放在**文档同级的 `images/` 子目录**且**文件名纯 ASCII**——这是唯一可用形式，`img/`、`images/sub/`、`../images/`、与文档同目录、中文名**全都静默丢图**（脚本仍打印 `Export succeeded`，但 `word/media/` 是空的）；② 导出后立刻验 `unzip -l <docx> | grep -c "word/media/"`，数字必须等于图片张数。实测边界表见 `../common/README.md`。

Markdown 落盘并通过 `prd-writer/references/self-check.md` 后，若用户要求导出 Word（或消息命中「导出 PRD」「PRD 导出 Word」「需求文档转 Word」等），执行本步；**未明确要求时不主动导出**。命令与模板规则同 `prd-writer` §9，共用 `../common/export-word.*`。

### 适用文件

| 文件 | 模板 | 说明 |
| --- | --- | --- |
| 落地版 `*-产品需求文档-V*.md` | **`formal`** | 默认导出对象 |
| 概念版 `*-产品需求文档-概念版-V*.md` | `formal` 或 `simple` | 用户指定时 |
| 原型盘点 `*-原型盘点-V*.md` | `feature-list` 或 `simple` | 用户指定时 |

### 命令

**Windows（PowerShell）：** `../common/export-word.ps1 <markdown文件路径> formal`

**跨平台：** `python ../common/export-word.py <markdown文件路径> formal`

**Git Bash：** `bash ../common/export-word.sh <markdown文件路径> formal`

**示例**（文件名遵循 §5 落地版命名，`<主题>` 替换为实际项目名）：

```powershell
../common/export-word.ps1 prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-V{版本号}.md formal
```

### 输出与依赖

- **输出路径**：与源 Markdown 同目录，文件名相同、扩展名为 `.docx`
- **本地图片**：脚本自动扫描 MD 内 `![](相对路径)` 并一并上传；远程 URL 图片不处理
- **依赖**：Python 3；可访问 `../config.json` 中 `apiBaseUrl`

导出完成后告知用户 `.docx` 路径；若 API 不可用，说明失败原因并保留 Markdown 为真源。

## 外部依赖与降级：Word/xlsx 导出

导出链走**技能库根的 `config.json`** 里的 `apiBaseUrl`（**端点不随仓库分发**，取值见该文件）。

| 情况 | 表现 | 怎么办 |
|---|---|---|
| 没配 `config.json` | 脚本报「无法从 config.json 读取 apiBaseUrl」 | 从同级 `config.example.json` 复制后填地址 |
| 服务没起 | `curl` 连不上 / 超时 | 先自检（在技能自己的目录下跑）：`curl -s -o /dev/null -w '%{http_code}' "$(python3 -c 'import json;print(json.load(open("../config.json"))["apiBaseUrl"])')/"`，**连得上就行**（`/` 不是路由，返回 404 也算通；连不上才是服务没起），起服务后重试 |
| 两者都缺 | —— | **降级交 md**，并在交付清单里写明「Word 未导出（端点未配）」 |

**三条不许**：不许把「导出失败」写成完成；不许跳过导出直接说交付完成；
不许在导出后不验图——`unzip -l x.docx | grep -c 'word/media/'` 要等于文档里的图片张数（文件名含中文会静默丢图）。

## 外部依赖与降级：浏览器/模拟器驱动

本技能要真的把页面跑起来点一遍，依赖宿主提供的浏览器工具（Claude Code 的 Browser 面板、
Playwright MCP 等），移动端还要模拟器。

| 情况 | 怎么办 |
|---|---|
| 宿主没有浏览器工具 | **明确写「本轮该端未执行」**，给出人工验证清单让用户自己点；**不得纸面推演成"通过"** |
| 服务起不来（端口占用/依赖缺失） | 先修起服务再测；修不了就记为**阻塞**，写清阻塞原因与复现命令 |
| 模拟器不可用 | 该端标「未执行」，不要用截图或经验描述代替实跑结果 |

**铁律**：报告里只写**真正执行过**的结果。没跑的标「未执行」，跑挂的标「失败」并贴关键报错。
