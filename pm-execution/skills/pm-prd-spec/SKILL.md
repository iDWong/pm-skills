---
name: pm-prd-spec
description: |
  产品需求文档（PRD）生成器，覆盖五种产品形态：移动端 APP、移动端 H5、小程序、Web 运营管理系统、Web 官网。输出"字段级可开发"的中文 PRD，每个页面配原型图，并融合 ui-ux-pro-max 的设计智能补齐界面与交互规范。
  触发场景：(1) "写需求文档" "出 PRD" "产品需求文档" "功能说明书"；
  (2) "写 APP 需求" "H5 活动页需求" "小程序需求" "运营后台 PRD" "官网需求"；
  (3) 用户描述了一个页面/功能（列表、表单、详情、Tab、信息流、指标看板、落地页、留资表单）并要求出文档；
  (4) "按短剧后台那份文档的格式写" "照那个文档的样式写需求"；
  (5) 已有 PRD 需要补漏、补校验规则、补指标口径、补 UX 规范、补原型图。
  上游接力：需求还很模糊、连「该不该做」都没定 → 先用 `pm-prd-writer` 做需求体检与澄清，澄清完成后回本技能补形态判定、字段级规格、原型图与 UX 规范。
  下游接力：PRD 与 SRS 都已落盘、用户要设计稿/高保真原型/可点原型/交互原型/预览墙 → 走 Step 8 出 **UI/UX设计稿**（可点可交互的独立 HTML），调 `ui-ux-pro-max` 落 `design-system/<项目slug>/`（设计稿内容以 PRD 为主真源、共三张 iframe 预览墙：移动 393×852 / 官网 1280×900 / 后台 1440×900、点卡进全屏、全屏页右下角需求标注；**不做出稿帧**，出的是完整流程的动态交互设计稿 + `FLOWS.md` 流程清单 + `HANDOFF.md` 工程师对接清单）。
  流程位置：`pm-master` 13 阶段流程的**阶段5 深度档**（默认档是 `req-doc`／`prd-writer`）——本技能**不登记 `SPEC_SOURCE`**，流程内使用时须由流程在阶段5 收尾代为登记；也可单点直接调用。不适用于：SRS 需求规格说明书（用 req-doc）、纯前端页面实现（用 page-generator）、纯设计评审（用 ui-ux-pro-max）、纯技术方案（用 hld-design / lld-design）。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  author: Wong
  version: "1.7"
  reviewed: "2026-09-15"
---

# PM-PRD-Spec：产品需求文档生成器

## 你的角色

你同时是**资深产品经理**和**UI/UX 设计顾问**。

产出标准只有一条：**开发看完不用追问，测试看完能直接写用例。**

具体到可检验的程度——开发不会问"这个字段限多少字符""重名了提示什么""分页几条""这个指标算不算退款""网络断了怎么办"；测试不会问"失败场景有几种""二次确认弹窗写什么"。答案全在文档里，以表格形式。

## 负责与不负责

| 负责 | 不负责 |
| --- | --- |
| 信息架构（菜单树 / 页面栈 / 导航结构）与页面清单 | SRS 需求规格说明书（转 `req-doc`，见文末） |
| 每个页面的字段、控件、校验、枚举、文案、状态 | 表结构、接口定义（转 `lld-design`） |
| 指标口径、图表规格、数据时效 | 数据仓库建模、SQL、埋点上报实现（只写口径与埋点需求） |
| 每个页面的界面与交互规范（来自 ui-ux-pro-max 检索） | 实际写页面代码（转 `page-generator`） |
| 每个页面的原型图；**设计稿**的路由与验收口径（Step 8） | 高保真视觉稿与设计稿页面代码本身（执行交给 `ui-ux-pro-max`） |
| 导出 Word 评审稿（**默认不导；仅当用户明确开口要时才执行**，见 Step 7） | — |

---

## 技能库根目录自解析

本技能可能落在四种布局下：Claude 平铺（`~/.claude/skills`）、Codex（`${CODEX_HOME:-$HOME/.codex}/skills`）、
Cursor（`~/.cursor/skills`），以及 **Claude Code plugin 模式**（技能在 `${CLAUDE_PLUGIN_ROOT}/skills/` 下，
**不在** `~/.claude/skills`）。**所有跨技能引用都必须走下面的解析器，不要硬编码任何一个根目录**——否则换一种装法就断链。

> plugin 模式下同一个 marketplace 的其他 bundle 各有各的目录，所以解析器还要往**同级 bundle** 找一层
> （`${CLAUDE_PLUGIN_ROOT}/../*/skills/`）：`pm-prd-spec` 在 `pm-execution`，而它要找的 `ui-ux-pro-max` 在 `pm-prototype`。

```bash
# 解析出某个技能的绝对路径：resolve_skill <技能名>
resolve_skill() {
  name="$(printf '%s' "$@")"   # 不要写 $1：本技能被当 slash command 带参调用时，$1 会被参数替换掉
  # ① plugin 模式：先看本 bundle，再看同级 bundle（跨 bundle 引用很常见）
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    [ -d "$CLAUDE_PLUGIN_ROOT/skills/$name" ] && { printf '%s' "$CLAUDE_PLUGIN_ROOT/skills/$name"; return 0; }
    for R in "$CLAUDE_PLUGIN_ROOT"/../*/skills; do
      [ -d "$R/$name" ] && { printf '%s' "$R/$name"; return 0; }
    done
  fi
  # ② 平铺安装
  for R in "$HOME/.claude/skills" "${CODEX_HOME:-$HOME/.codex}/skills" "$HOME/.cursor/skills"; do
    [ -d "$R/$name" ] && { printf '%s' "$R/$name"; return 0; }
  done
  echo "未找到技能：$name（plugin 模式请确认同 marketplace 的相关 bundle 已安装）" >&2; return 1
}

UIUX="$(resolve_skill ui-ux-pro-max)"
SELF="$(resolve_skill pm-prd-spec)"
COMMON="$(resolve_skill common)"
```

Python 里同理：

```python
import os
import glob
def resolve_skill(name):
    roots = []
    plug = os.environ.get("CLAUDE_PLUGIN_ROOT")
    if plug:                                          # plugin 模式：本 bundle + 同级 bundle
        roots.append(os.path.join(plug, "skills"))
        roots += sorted(glob.glob(os.path.join(plug, "..", "*", "skills")))
    roots += [os.path.expanduser("~/.claude/skills"),
              os.path.join(os.environ.get("CODEX_HOME", os.path.expanduser("~/.codex")), "skills"),
              os.path.expanduser("~/.cursor/skills")]
    for r in roots:
        p = os.path.join(r, name)
        if os.path.isdir(p):
            return os.path.normpath(p)
    raise FileNotFoundError(f"{name}（plugin 模式请确认同 marketplace 的相关 bundle 已安装）")
```

---

## Step 0：形态路由（第一件事，不能跳）

**先判定产品形态，再谈别的。** 五种形态的页面类型、入口写法、必写章节、UX 检索参数、原型图画布**全都不同**。判错形态，后面写的越多返工越多。

| 形态 | 判定信号 | Profile |
| --- | --- | --- |
| **移动端 APP** | iOS/Android 原生或 RN/Flutter；有安装包、推送、系统权限、版本更新 | `references/profiles/mobile-app.md` |
| **移动端 H5** | 浏览器里打开的移动网页；微信内置浏览器、活动页、分享链接、落地页 | `references/profiles/mobile-h5.md` |
| **小程序** | 微信/支付宝/抖音小程序；有 tabBar、授权按钮、订阅消息、包体积限制 | `references/profiles/miniprogram.md` |
| **Web 运营管理系统** | 后台/中台/运营侧；左侧菜单树、列表页、筛选、批量操作、权限 | `references/profiles/web-admin.md` |
| **Web 官网** | 对外展示与获客；Hero、功能介绍、定价、案例、留资表单、SEO | `references/profiles/web-site.md` |

**判不出来就问**，别猜。常见的坑：

- "H5" 和"小程序"经常被混用——问一句"是在微信里点开的网页，还是要从小程序列表进的"。
- 一个项目**可能横跨多个形态**（C 端 APP + 运营后台）。这时按形态**拆成多份 PRD**，不要塞进一份；在每份开头写明"本文档只覆盖 X 形态，Y 形态见另一份"。
- 用户要的是 **SRS** → 转 `req-doc`。
- 已有 Axure 包 / 线上 URL / 本地 HTML 原型 → 先用 `prototype-to-prd` 盘点页面，把结果作为 Step 2 的输入。

判定后，**立刻读对应的 profile**，它会告诉你这个形态的页面类型、标准小节序列、必写的特有章节。

然后盘点输入物，明确列出你拿到了什么、缺什么：竞品截图、旧版文档、页面结构、字段口径表、技术栈。

---

## 八条铁律（全形态通用）

违反任意一条即为不合格文档，自查时逐条比对。

1. **表格优先。** 凡是"多个同类项各有若干属性"，一律用表格，禁止用散段落堆砌。全文正文表格占比应 ≥ 50%。
2. **入口必须写清路径。** 每个页面开头写清从哪进来，形式随形态：后台用面包屑 `管理后台 → 系统设置 → 用户管理`，移动端用页面栈 `App → 首页Tab → 内容卡片 → 详情页`，官网用导航路径 `官网 → 产品 → 功能介绍`。箭头用 `→`，按钮/控件用 `【】` 包裹。
3. **字段必须三要素。** 字段表固定三列起：`字段名称 | 字段说明 | 示例值`。示例值必须是**具体的、有真实感的假数据**（`2026-09-02 10:15:23`、`COMP20260902001`、`追剧小能手 (U-100886)`），禁止写"字符串""某个值""xxx"。
4. **文案必须给原文。** 所有用户可见文字（提示、按钮、空态、二次确认、权限申请说明）直接写出成品文案并加引号，禁止写"提示错误信息"。二次确认必须写整句：`即将删除【架空历史】分类，删除后将影响所有已关联的剧集。确认继续吗？`
5. **校验必须给四要素。** `触发时机 | 校验规则 | 用户提示 | 处理方式`，四列缺一不可。
6. **指标必须给口径。** 每个指标展开写：定义、时间口径、计算方式、主数字格式、环比对比、环比计算、环比展示、展示文案、特殊处理。少一行开发就会算错数。
7. **每个页面必须有「界面与交互规范」段。** 内容必须来自 ui-ux-pro-max 检索结果，不得凭空写；`依据` 列要能追溯到命中类别。
8. **每个页面必须配一张原型图。** 弹窗/浮层单独一张。光有字段表，评审仍然会卡在区块位置和元素顺序上。画完用 `g.collisions()` 自查文字重叠，重叠的图不许交付。画法见 `references/wireframe.md`。

**形态特有的附加铁律**写在各 profile 顶部——例如移动端必写「无网络与弱网表现」，小程序必写「授权与订阅消息时机」，官网必写「SEO 与转化目标」。读 profile 时一并遵守。

---

## 工作流

**Step 0–7 不跳步**，Step 8 可选（用户要 UI/UX设计稿时才启动）。**两个对齐点**：Step 2（骨架确认）、Step 4（每写完一个功能域给用户看）——都必须停下来等答复。**Step 7 不再问「要不要导 Word」**：默认只交 md，不生成 docx。

```
用户输入（功能描述 / 竞品截图 / 旧文档 / 原型）
    │
    ▼
Step 0  形态路由 + 输入盘点   → ★ 判定五形态之一，加载 profile
    ▼
Step 1  需求澄清              → 通用五组 + profile 的形态专属组
    ▼
Step 2  信息架构 + 页面清单   → ★ 用户确认骨架后才动笔
    ▼
Step 3  生成设计系统          → ui-ux-pro-max --design-system（参数按形态）
    ▼
Step 4  逐模块写正文          → 每页面按 profile 的标准小节序列 + UX 规范 + 原型图
    ▼
Step 5  全局章节              → 通用 + profile 的形态特有章节
    ▼
Step 6  自查                  → references/review-checklist.md 逐项过
                              （出了设计稿的另加 references/prototype-review.md 四阶段）
    ▼
Step 7  交付                  → md 落盘 + 脚本落 tools/ → 待确认项 + 下游路由（默认只交 md，不导 Word 也不问）
    ▼
Step 8  UI/UX设计稿（可选）    → PRD+SRS 齐备后调 /ui-ux-pro-max，落 design-system/<项目slug>/（iframe 预览墙 + 全屏标注 + FLOWS.md + HANDOFF.md，不做出稿帧）
```

### Step 1：需求澄清

**一次问完，不要挤牙膏。** 每组挑真正影响文档结构的问题问，已知的不要重复问。

**通用五组：**

| 组 | 必问 | 为什么影响文档 |
| --- | --- | --- |
| 使用者与场景 | 谁用？最高频的操作是什么？一天用多少次？在什么环境下用（通勤/办公桌/门店）？ | 决定信息架构排序、默认值、页面密度 |
| 核心流程 | 用户从进入到完成目标，中间经过哪几步？哪一步最容易流失？ | 决定页面清单与流程图 |
| 数据规模与时效 | 数据量多大？是否要求实时？可以接受 T+1 吗？ | 决定分页/加载策略、是否写数据时效声明 |
| 危险与不可逆操作 | 哪些操作不可逆（删除、支付、退款、封禁、发布）？需不需要二次确认、审批流、操作日志？ | 决定二次确认文案表、数据变化表、失败处理表 |
| 指标与口径 | 要看哪些指标？分子分母怎么算？去重规则？环比跟谁比？ | 决定指标章节；口径不清就是数据事故 |

**形态专属组**见各 profile 的「需求澄清补充」小节——例如 APP 要问推送与权限策略，小程序要问平台与类目资质，官网要问转化目标与 SEO 关键词。

**缺口处理**：能合理默认的直接采用行业默认值并标注 `[默认取值]`；影响结构的必须问。

### Step 2：信息架构 + 页面清单（对齐点 ★）

先只输出骨架，让用户确认后再写正文。骨架形式随形态：后台是**菜单树**，APP/小程序是**页面栈 + Tab 结构**，H5 是**流程图**，官网是**导航结构 + 页面列表**。具体样例见 profile。

页面清单统一给一张表作为后续章节目录：

| 编号 | 页面 | 类型 | 入口 | 关键交互 | 关联浮层 |
| --- | --- | --- | --- | --- | --- |
| 3.1 | 内容详情页 | 详情页 | 首页Tab → 卡片点击 | 上滑加载下一条、双击点赞 | 分享面板、举报弹窗 |

页面类型**由 profile 规定**，不要跨形态混用。

**必须问用户确认后再进 Step 4。** 骨架错了，后面写多少都是白写。

### Step 3：生成设计系统

先解析技能路径：

```bash
UIUX="$(resolve_skill ui-ux-pro-max)"    # 解析器见文首「技能库根目录自解析」
```

三个调节器**按形态取值**，不要一套参数打天下：

| 形态 | variance | motion | density | 理由 |
| --- | --- | --- | --- | --- |
| 移动端 APP | 5 | 6 | 4 | 动效承担导航语义与空间连续性；单屏信息量小 |
| 移动端 H5 | 6 | 5 | 4 | 活动页要有记忆点，但首屏性能优先 |
| 小程序 | 4 | 4 | 5 | 受平台组件约束，克制为主 |
| Web 运营管理系统 | 3 | 2 | 8 | 可预测优先；运营每天用几十次，惊喜是负债 |
| Web 官网 | 7 | 6 | 3 | 要有辨识度和叙事节奏，留白大 |

```bash
python3 "$UIUX/scripts/search.py" "<product_type> <industry> <keywords>" \
  --design-system --variance <v> --motion <m> --density <d> \
  --persist -p "<项目名>" --output-dir "<项目根目录>"
```

产出 `design-system/<项目slug>/MASTER.md`。若已存在，**先读取并沿用，不要覆盖**；只有用户明确授权才加 `--force`。
**slug 用项目名、不带形态后缀**——Step 8 的设计稿包与这份母版同树（都在 `design-system/<项目slug>/` 下）。
存量项目已按形态分了 slug（`zymix-app` / `zymix-admin`）的沿用不动，在 `HANDOFF.md` 第 1 节写明各形态母版在哪。

**读哪个 UX 规则集**：

- 移动端 APP / H5 / 小程序 → `$UIUX/references/pro-rules.md`（移动端专用）**加** `quick-reference.md`
- Web 后台 / Web 官网 → `$UIUX/references/quick-reference.md`（Web/桌面端全量规则）

技术栈从项目检测（`package.json` → React/Vue；`pubspec.yaml` → Flutter；`*.xcodeproj` → SwiftUI；`app.json` + react-native → React Native）。检测不到且会影响建议时问用户，禁止猜默认栈。

### Step 4：逐模块写正文（对齐点 ★）

按 Step 2 的页面清单顺序写。**每个页面的标准小节序列由 profile 规定**，但收尾的「界面与交互规范」全形态通用且不可省：

| # | 小节 | 说明 |
| --- | --- | --- |
| 1..N | 形态专属小节 | 见 profile（后台是筛选/列表/表单/危险操作；APP 是页面结构/手势/状态/异常；官网是区块顺序/CTA/SEO） |
| N+1 | **界面与交互规范** | 来自 ui-ux-pro-max 检索，`维度 \| 规范 \| 依据` 三列——**是每个页面的最后一个小节** |

**原型图不单独成节**：以 `**页面原型图**` 粗体块 + 图 + 图注的形式，嵌在**小节 1「功能概述」末尾**
（先看图再看字段，评审动线才顺）。浮层/弹窗各一张，紧随其所属页面。写法见 `references/wireframe.md`。

通用表头、文案范式、禁用写法见 `references/doc-style.md`——**这份是全形态通用的，Step 4 动笔前必读**。

原型图用 `scripts/wireframe.py` 的组件库画 SVG，`scripts/render.sh` 渲成 PNG。**生成脚本每张图收尾必须写一行 `assert not g.collisions(), g.collisions()`**——SVG 的 `<text>` 不换行也不截断，长中文串会直接压在隔壁元素上，这行断言让重叠当场失败而不是等评审时被发现。**你写的生成脚本一律落项目根的 `tools/`**（如 `tools/gen_wireframes.py`），SVG 中间产物落 `tools/svg/`，规则见 Step 7「脚本落盘」。**PNG 文件名必须纯 ASCII**，否则 Word 导出会静默丢图。移动端用手机框画布，画法见 `references/wireframe.md`。

原型图要把"文字规范里说了但看不见"的东西画出来——涨跌不能只靠颜色、Chip 换行不裁切、错误汇总在表单顶部、未授权模块整组不渲染、安全区避让、tabBar 位置。

**写完一个功能域，停下来给用户看一次再继续下一个域**，不要一口气写完再返工。

### Step 5：全局章节

**通用**（按需选取）：

- **错误提示规范**：全局文案表 `错误场景 | 前端提示文案 | 提示位置 | 后端日志记录`
- **数据时效声明**：哪些实时、哪些 T+1、跑批时间、界面是否有说明文案
- **埋点需求**：只写"要采什么、口径是什么"，不写上报实现（详细方案转 `pm-tracking-spec-writer`）
- **非功能需求**：加载时间、单页数据量、导出上限、并发冲突、兼容范围

**形态特有的全局章节由 profile 规定**——后台是权限模型与操作日志，APP 是权限申请/推送/版本更新/离线，小程序是授权登录/订阅消息/审核合规，官网是 SEO/多语言/CMS 可维护性。

### Step 6：自查

逐项过 `references/review-checklist.md`：通用 P0 + 你这个形态的专属 P0。P0 必须当场修完再交付；P1/P2 汇总成清单随文档给用户，问一次是否一并修。

### Step 7：交付

**文件命名**：`prd/PRD/{YYYYMMDD}-{客户名称}{项目名称}{形态}-产品需求文档-V{版本号}.md`——**PRD 一律落 `prd/PRD/`**（目录不存在先 `mkdir -p prd/PRD`），与 `req-doc` 的 SRS（`dev/SRS/`）分目录归档；命名格式与 SRS、`hld-design`/`lld-design` 的设计说明书保持一致，评审稿归档口径一致。

| 片段 | 规则 |
| --- | --- |
| `{YYYYMMDD}` | 落盘当天日期，无分隔符，例 `20260908` |
| `{客户名称}` | 甲方/客户简称；内部项目或问不到客户时**整段省略**，不要留空格或占位符 |
| `{项目名称}` | 项目/产品名，例 `短视频运营日报`、`会员中心` |
| `{形态}` | 固定五选一：`后台管理` / `APP` / `H5` / `小程序` / `官网`。跨形态拆多份 PRD 时靠这个后缀区分 |
| `{版本号}` | 首版 `V1.0`；评审后修订 `V1.1`，结构性重写 `V2.0`。**改了内容就得改文件名**：小文档另存新版留档，大文档就地 `Edit` + `mv` 重命名（见下） |

示例：

- `prd/PRD/20260908-PM能源科技短视频运营日报后台管理-产品需求文档-V1.0.md`
- `prd/PRD/20260908-会员中心APP-产品需求文档-V1.0.md`（无客户名称）

**修订：就地改也要改文件名。** 大文档（几千行 / MB 级）**就地 `Edit` 改**，别整份重写；但改完必须三样一起动——文首「文档版本」、版本历史表、**`mv` 把文件名的版本号也改掉**（局部修订 `+0.1`，结构性重写进大版本；日期取改动当天）。**绝不允许内容已是 V1.1、文件名还写 V1.0。**改名后 `grep` 一遍旧名，把 README 清单、下游「来源」行、`tools/` 脚本里的引用一并改掉。完整规则见 `../common/README.md`。

**交付包 README 落盘：`README-PRD.md`，不准用裸 `README.md`**

一份交付包里同时存在 PRD 与 SRS 两条链路，README 必须带**文档类型后缀**区分，否则后写的那条会把先写的覆盖掉：

| 谁写 | 文件名 | 内容 |
| --- | --- | --- |
| 本技能（PRD 链路） | 项目根 `README-PRD.md` | PRD 清单（按形态一份一行：文档名 / 形态 / 覆盖的功能域与页面数 / 原型图张数）、目录结构、原型图与脚本位置、Word 导出状态（默认「未导出」）、下游路由（下一步是 `req-doc` Step F） |
| `req-doc`（SRS 链路） | 项目根 `README-SRS.md` | SRS 清单、章节与真源说明、图表来源、与 PRD 的对应关系 |

多份 PRD（跨形态拆分）**合写一份 `README-PRD.md`**，用表格分行，不要每个形态再拆一个 README。已存在 `README-PRD.md` 时**增量更新**对应行，不要整篇重写覆盖别人写的行。

**原型图落盘**：PNG 放在与 md **同级**的 `images/` 下，即 `prd/PRD/images/pt-01-daily-report.png`；Markdown 里写相对路径 `images/pt-01-daily-report.png`（`export-word.sh` 以 md 所在目录解析相对路径）。文件名一律纯 ASCII。

**脚本落盘：一律放项目根的 `tools/`**

本技能过程中你写的每一个脚本（原型图生成脚本、渲染包装、字段/指标表的一次性生成或校验脚本）**必须落到项目根的 `tools/`**（目录不存在先 `mkdir -p tools`）。不要散在项目根，不要塞进 `docs/`，更不要写到系统临时目录——评审后改一版原型图还得靠它重跑，丢了就得重写。

| 产物 | 落盘位置 | 例 |
| --- | --- | --- |
| 原型图生成脚本 | `tools/` | `tools/gen_wireframes.py` |
| SVG 中间产物 | `tools/svg/` | `tools/svg/pt-01-daily-report.svg` |
| 其他一次性脚本（校验、批量改名、口径核算） | `tools/` | `tools/check_metrics.py` |
| PNG 成品 | `prd/PRD/images/` | 见上一条 |

脚本文件名纯 ASCII + 蛇形命名；文件顶部写一行注释说明「生成什么、怎么跑」。SVG 中间产物**留着不要删**，改图靠它增量重渲。

```bash
mkdir -p tools/svg
python3 tools/gen_wireframes.py      # 脚本内每张图 assert not g.collisions()
bash "$(resolve_skill pm-prd-spec)/scripts/render.sh" tools/svg prd/PRD/images 2400
```

**Word 导出：默认不导，也不要主动问（用户明确开口才导）**

**本技能的默认交付物只有 md + 原型图，不生成 docx。** md 落盘后直接进交付说明，
**不要停下来问**"要不要导 Word"——交付说明里一句话带过就够：

```
PRD 已落盘：prd/PRD/20260908-会员中心APP-产品需求文档-V1.0.md
（本次交付为 md；需要 Word 评审稿说一声，随时可补导。）
```

**唯一开导情形**：用户**原话开口**要 Word / 要 docx / 要评审稿文件（"导出 Word"、"出 docx"、"要评审稿"，
或直接以「PRD 导出Word」这类说法触发本技能）。**"看起来要评审""顺手导一份更稳妥"这类自行判断不算**；
反过来追着问"要不要导 Word"同样不行——这一问已从对齐点里去掉，问了就是打扰。
**下游衔接里触发 `req-doc` Step F 转写出的 SRS 同此规则**：只交 md、不导 docx、也不问，两边口径一致。

导出能力本身保留，**用户明确要求后**才执行：

```bash
bash "$(resolve_skill common)/export-word.sh" "<md路径>" req-doc
```

第二个参数是模板名。`export-word` **没有 `prd` 模板**（可选值只有 `req-doc` / `test-cases` /
`operation-manual` / `feasibility-report` / `feature-list` / `default` / `formal` / `simple`），
PRD 与 SRS 都复用 `req-doc` 模板——这是有意的，不是写错。

**导出后必须验证图片真的嵌进去了**——导出接口对非 ASCII 图片文件名会**静默丢图**（照样打印 `Found N local image(s)` 和 `Export succeeded`，但 docx 里只有空图框）：

```bash
unzip -l "<docx路径>" | grep -c "word/media/"
```

数字必须等于原型图张数。为 0 就是丢了，把 PNG 改成 ASCII 文件名后重导。

**交付物四件**：PRD 正文（md；`.docx` 仅在用户明确要求导出时才附上）、`README-PRD.md`（清单与目录结构，见上）、待确认项清单（问题/影响章节/缺答案的后果/建议默认值）、下游路由说明（下一步是 `req-doc` Step F；PRD+SRS 齐备后可出设计稿，见 Step 8）。

---

### Step 8：UI/UX设计稿交付（PRD + SRS 齐备 → 调 `/ui-ux-pro-max`）

PRD 与 SRS 都落盘后，**这条链路的下一站是设计稿**（可点、可交互的独立 HTML），执行技能是 `/ui-ux-pro-max`。

**权威契约是 `$(resolve_skill ui-ux-pro-max)/references/prototype-delivery.md`，启动前必须完整读它。**
本节只写**本技能自己的决策**：什么时候启动、以谁为真源、PRD 侧要供什么料、验收看哪几条。
**设计稿长什么样、怎么做、怎么机检，一律以契约为准，本节不复述**——两处各写一份，契约一改这边就是错的。

**启动条件**：

| 条件 | 处理 |
| --- | --- |
| PRD 与 SRS 都已落盘（`prd/PRD/*.md` + `dev/SRS/*.md`） | 可启动 |
| 只有 PRD，SRS 未落盘 | 先按「下游衔接」跑 `req-doc` **Step F** 转写 SRS，再启动；用户**原话**说"跳过 SRS"时才允许只用 PRD，并在索引页注明"SRS 未落盘" |
| 只有 SRS，没有 PRD | **先用本技能出 PRD**——设计稿以 PRD 为主真源，没 PRD 就没有页面清单与文案依据 |
| 只有 SRS，且项目走的是 `dev-master` 研发流程（没有产品侧 PRD 链路） | **允许以 SRS 为唯一真源出稿**（契约缺件表已开此豁免），索引页注明「无 PRD，页面清单与文案取自 SRS」。**不要为此回来跑本技能** |
| 两份都没有 | 不许凭空造页面：回 **Step 0** 从形态路由开始把 PRD 走完，再按上一行处理 SRS |

**叫法**：`design-system/` 下那批可点 HTML 正式名是 **UI/UX设计稿**，简称**设计稿**（标题与首次出现用全称）；PRD 正文里嵌的那张静态图叫**页面原型图**。正文、README 与交付说明**不要互相混称**（口径表见 `references/doc-style.md` 一、文档骨架）。
触发词（**全技能统一这一套**）：**设计稿 / 高保真原型 / 可点原型 / 交互原型 / 预览墙**——说其中任意一个都是要这批可点 HTML，不用纠正用户的说法。

**何时开口**：Step 7 交付说明里主动提示一行"下一步可出设计稿（`/ui-ux-pro-max`）"；用户说了上面任一触发词即开工。不要没人要就自动生成几十个 HTML，也不要反复追问。

**真源优先级（与研发交付相反，务必看清）**：

- **以 PRD 为主真源**——页面清单、区块顺序、字段与枚举、文案原文、交互与状态、界面与交互规范一律照抄 PRD。
- SRS 是**补充与兜底**：PRD 未写明的规格细节（校验边界、状态机、接口约束）取 SRS。
- 两份冲突时**取 PRD**，并在该页标注面板里写明"取 PRD x.y.z（SRS 3.5.x 表述不同）"。
- 这条**只适用于设计稿交付**。研发交付真源仍是 SRS，见「下游衔接」。

**PM 侧验收只把关这三件**（形态与规格细则由契约的「交付前自查」负责，不在这儿重写）：

1. **覆盖度**——① 墙上卡片数 = 实际页面数；② `HANDOFF.md` 第 4 节站点地图节点数 = 分级页面清单条数 = 产物 HTML 数，**平台变体计一条并注明变体数**（多端项目里这两组数不是一回事，别连等着数）。另外 PRD 点名的每个弹窗/浮层都建了且从真实入口点得到。
2. **可追溯**——每张卡图注带 `PRD 章节号 · 文件名`；全屏页标注面板每条规则末尾标出处 `PRD x.y.z`（取自 SRS 的写 `SRS 3.5.x-Rnn`）。
3. **真源正确**——与 PRD 冲突处按上表取 PRD，并在标注面板写明取舍。

**抽查三条**（随便挑三页双击打开，比读报告管用）：控制台零报错、无外链请求；墙内看不到 devbar、全屏页看得到；产物里 `data-setframe` 出现即不合格（出稿帧已废除）。

**速查**（详规以契约为准）：三张预览墙——移动墙 `index.html` **393×852**（APP / H5 / 小程序共用一张，卡片按形态分组）、官网墙 `web-index.html` **1280×900**、后台墙 `admin-index.html` **1440×900**；落盘 `design-system/<项目slug>/`，产物由 `python3 _src/build.py` 构建，手改产物会被覆盖。

契约里这几节是评审最常卡的地方，读的时候别跳：**「三种墙尺寸」「弹窗与浮层」「页面之间要闭环」「完整流程的动态交互（取代出稿帧）」「清单反查九条」「工程师对接交付清单」**。

### Step 8.1：设计稿闭环检查（出稿即入检，**不可省**）

Step 8 那三条抽查只解决「交付形态对不对」。**设计稿能不能支撑业务流程跑通，是另一件事**，
判据与清单在 `references/prototype-review.md`，四阶段逐层递进：

| 阶段 | 谁做 | 查什么 | 准出 |
| --- | --- | --- | --- |
| 机检 | 出稿方 | 四组脚本：死按钮与孤层 / 流程完整性 / 清单反查九条 / 页面闭环（死链·无入链·无出链）。**脚本与判据在契约的「流程完整性自查」「九条的机检」两节，照那儿跑，别自己另写判据** | 全部输出 OK / 为 0 |
| 一 | 产品专家 | 业务流程 → 页面映射，每个节点有承载物、入口、正常出口、放弃出口 | 映射表无空格 |
| 二 | 测试专家 | **起服务器用真人的手逐条点**，四问：可进入 / 可完成 / 可返回 / 可中断 | 六条真人路径全通 |
| 三 | 测试专家 | 正常/空/加载/异常/权限/离线六态 + 异常流 + 边界 + 危险操作 | 三张表无空格 |
| 四 | 交互设计 | 字段 / 文案 / 交互模式 / 组件复用 / 状态流转 | 五维度无 P0/P1 |

**PRD 侧要为这套检查供料**——写 PRD 时就得让阶段一有表可对，所以下面三样是硬要求
（Step 4 写正文时落，不要等到检查时才补）：

1. **每条业务流程线在 PRD 里有有序节点清单**，节点粒度 = 用户能感知的一次状态变化；
2. **每个页面的「页面状态」小节写全六态**（正常/空/加载/异常/权限/离线），
   且**空态与失败态分开写**——混着写下游一定会做成同一屏；
3. **关联浮层总表逐层列出**，并注明「用户触发」还是「自动触发」——
   这一列决定它在设计稿里**怎么到达**：用户触发的接真实入口（表格操作列、页面按钮），
   自动触发的按真实条件自动弹（`data-auto` + `localStorage` 记标志）。
   **两类都必须在流程里到达，没有「工具条切」这一档**——出稿帧已废除（契约铁律 8），
   数据状态也要靠预置的演示数据路径走到。

**常见失败**：PRD 只写了正常流，设计稿照着做，检查时才发现异常流整块没有——
那是 PRD 的缺口，不是设计稿的。**Step 4 自查时就按 `references/prototype-review.md` §5 反查一遍。**

---

## 章节 → 检索 domain 映射（速查）

一次只表达一个意图，2–5 个有意义的词，附一个约束。**约束词按形态取**：`admin`/`mobile app`/`h5`/`miniprogram`/`landing`。详细查询词模板见 `references/ux-integration.md` 与各 profile。

| 正在写的章节 | domain | 查询示例 |
| --- | --- | --- |
| 列表 / 信息流 | `ux` | `"data table pagination bulk actions" --domain ux` / `"pull to refresh infinite scroll" --domain ux` |
| 表单与校验 | `ux` | `"inline validation error message placement" --domain ux` |
| 空态 / 加载 / 失败 | `ux` | `"empty state skeleton loading feedback" --domain ux` |
| 导航结构 | `ux` | `"sidebar navigation breadcrumb deep link" --domain ux` / `"bottom navigation back button" --domain ux` |
| 手势与触控 | `ux` | `"gesture conflict swipe back" --domain ux` |
| 状态标签 / 语义色 | `color` | `"status badge semantic color tokens" --domain color` |
| 排版 | `typography` | `"dense table typography line height" --domain typography` |
| 指标与图表 | `chart` | `"trend line donut funnel dashboard" --domain chart` |
| 图标 | `icons` | `"edit delete export action icons" --domain icons` |
| 官网区块顺序 | `landing` | `"hero pricing testimonials cta" --domain landing` |
| 视觉风格基调 | `style`, `product` | `"admin back office dashboard" --domain product` |
| 动效 | `gsap` | `"page transition shared element" --domain gsap` |
| 实现级建议 | `--stack` | `"data table" --stack react` |

**零结果处理**：用更窄的词或显式 domain 重试**一次**；仍为空则回退到对应的 UX 规则集优先级表，并在文档 `依据` 列明确写"内置默认规则（检索无匹配）"。不得编造结果。

---

## 下游衔接（重要）

本技能产出的是 **PRD，不是研发交付真源**。

用户接着说"进开发 / 实现 / 生成页面 / 出交付计划 / 做概要设计"时：

- `page-generator`、`hld-design`、`lld-design`、`feature-list`、`annotation`、`delivery-plan`、`dev-fullstack-product` 这七个技能**不得**以 PRD（`prd/PRD/*.md`）为规格真源（`dev-fullstack-product` 来自姊妹库 `dev-skills`，只装 `pm-skills` 时忽略它，其余六个不变）。
- 正确路径：先跑 `req-doc` **Step F**（PRD → SRS 转写），落 `dev/SRS/{日期}-{客户}{项目}-SRS需求规格说明书-V*.md`，再进下游。
- 交付时主动提示这一步，**不要问"是否转写"**——直接说明下一步是 Step F。SRS 落盘后同样默认不导 Word，按 Step 7 的规则处理（不导、不问）。
- 唯一豁免：用户**原话**说"跳过 SRS"或"按 PRD 手动对齐"，且仅限单次。

其他常见衔接：
- 想让人评审 → `pm-review-board`（六角色模拟评审）
- 想出 **UI/UX设计稿**（触发词：设计稿 / 高保真原型 / 可点原型 / 交互原型 / 预览墙）→ 走本技能 **Step 8**，那儿写了启动条件、真源优先级与验收三条；执行技能是 `ui-ux-pro-max`，动手前先完整读 `$(resolve_skill ui-ux-pro-max)/references/prototype-delivery.md`（权威契约）。两点最容易搞错：**前置**是 PRD 与 SRS 都已落盘（只有 PRD 时先走上面的 `req-doc` Step F）；**真源**是设计稿以 PRD 为主、SRS 补细节，**只限设计稿交付**——上面那七个研发技能的规格真源仍是 SRS，两者不冲突。
- 想在**现有工程里出可运行页面** → 先读 `design-system/<项目slug>/MASTER.md`，再走 `page-generator`（须先有 SRS，见上）
- 想出测试用例 → `pm-test-cases`
- 想补埋点方案 → `pm-tracking-spec-writer`

---

## 参考文件

| 文件 | 何时读 |
| --- | --- |
| `references/profiles/<形态>.md` | **Step 0 判定形态后立刻读**——页面类型、小节序列、特有章节 |
| `references/doc-style.md` | Step 4 动笔前必读——全形态通用的表头、文案范式、禁用写法 |
| `references/ux-integration.md` | 写「界面与交互规范」段前必读——检索契约与结果落表方法 |
| `references/wireframe.md` | 画原型图前必读——工具链、各形态画布尺寸、ASCII 文件名坑 |
| `references/module-templates.md` | Web 后台形态的页面模板库（其他形态的模板在各自 profile 里） |
| `references/review-checklist.md` | Step 6 逐项过 |
| `$(resolve_skill ui-ux-pro-max)/references/prototype-delivery.md` | **Step 8 启动前必读**——预览墙三种尺寸、墙内/全屏差异、devbar 与标注面板契约、目录骨架 |
| `scripts/wireframe.py` | SVG 组件库 |
| `scripts/render.sh` | SVG → PNG 渲染 + 裁边 |
| `scripts/selftest.py` | 改过 `wireframe.py` 后跑一遍：验证组件不重叠、不出框、度量不低估 |

## 外部依赖与降级：Word/xlsx 导出

导出链走**技能库根的 `config.json`** 里的 `apiBaseUrl`（**端点不随仓库分发**，取值见该文件）。

**默认流程走不到这一节**——只有用户明确要求导 Word 时才需要这条链。

| 情况 | 表现 | 怎么办 |
|---|---|---|
| 没配 `config.json` | 脚本报「无法从 config.json 读取 apiBaseUrl」 | 从同级 `config.example.json` 复制后填地址 |
| 服务没起 | `curl` 连不上 / 超时 | 先自检（在技能自己的目录下跑）：`curl -s -o /dev/null -w '%{http_code}' "$(python3 -c 'import json;print(json.load(open("../config.json"))["apiBaseUrl"])')/"`，**连得上就行**（`/` 不是路由，返回 404 也算通；连不上才是服务没起），起服务后重试 |
| 两者都缺 | —— | **降级交 md**，并在交付清单里写明「Word 未导出（端点未配）」 |

**三条不许**（仅在用户明确要求导出时适用）：不许把「导出失败」写成完成；不许拿「默认不导」当借口跳过用户已经明确要求的导出；
不许在导出后不验图——`unzip -l x.docx | grep -c 'word/media/'` 要等于文档里的图片张数（文件名含中文会静默丢图）。
