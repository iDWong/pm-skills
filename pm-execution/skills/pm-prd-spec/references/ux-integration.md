# ui-ux-pro-max 集成手册

> 检索契约五形态通用；**参数和查询词按形态取**，形态专属的查询清单在 `profiles/<形态>.md` 的「UX 检索」小节。

本文件定义「界面与交互规范」段怎么写才不是编的。写这一段之前必读。

---

## 0. 路径解析

技能脚本在技能目录，不在项目目录。每个会话第一次用时先解析路径：

```bash
UIUX="$(resolve_skill ui-ux-pro-max)"    # resolve_skill 见 SKILL.md 文首
```

`python3` 不可用时依次试 `python`、`py -3`。

**读哪个规则集**（按形态，不要读错）：

| 形态 | 规则集 |
| --- | --- |
| 移动端 APP / H5 / 小程序 | `$UIUX/references/pro-rules.md`（移动端专用）**加** `quick-reference.md` |
| Web 运营管理系统 / Web 官网 | `$UIUX/references/quick-reference.md`（Web/桌面端全 10 类） |

`pro-rules.md` 里的移动端硬约束（触控 44×44pt / 48×48dp、安全区避让、单区域单手势、按压反馈不改变布局、最大系统字号验证）**必须逐条落进移动端文档的 UX 规范表**，不能只读不写。

---

## 1. 两类检索，各用一次

### 1.1 项目级：设计系统（Step 3，整个项目一次）

三个调节器**按形态取值**（完整表见 SKILL.md Step 3）：

| 形态 | variance | motion | density |
| --- | --- | --- | --- |
| 移动端 APP | 5 | 6 | 4 |
| 移动端 H5 | 6 | 5 | 4 |
| 小程序 | 4 | 4 | 5 |
| Web 运营管理系统 | 3 | 2 | 8 |
| Web 官网 | 7 | 6 | 3 |

以 Web 运营管理系统为例，固定往"高密度、低变化、低动效"给：

```bash
python3 "$UIUX/scripts/search.py" "admin dashboard back office data table operations" \
  --design-system --variance 3 --motion 2 --density 8 \
  --persist -p "<项目名>后台管理" --output-dir "<项目根目录>"
```

| 调节器 | 取值 | 为什么 |
| --- | --- | --- |
| `--variance 3` | 低 | 后台要可预测，不要大胆不对称；运营每天用几十次，惊喜是负债 |
| `--motion 2` | 低 | 只保留微交互；大编排会拖慢高频操作 |
| `--density 8` | 高 | 一屏尽量多行；运营的核心诉求是少滚动少翻页 |

产出 `design-system/<slug>/MASTER.md`。**已存在则先读取沿用，不要覆盖**；只有用户明确授权才加 `--force`。

需要给某个页面单独定调（比如仪表盘要比列表页宽松）时加 `--page`：

```bash
python3 "$UIUX/scripts/search.py" "<query>" --design-system --page "dashboard" --density 6 --persist -p "<项目名>后台管理" --output-dir "<项目根目录>"
```

**页面覆盖优先于 MASTER**：写某页面时先读 `MASTER.md`，再读 `pages/<page-name>.md`。

### 1.2 章节级：定向检索（Step 4，每写一段查一次）

**查询契约**：一次只表达一个主要意图，2–5 个有意义的词，附一个有效约束（`admin`/`back office`/`web`/`table`）。

```bash
python3 "$UIUX/scripts/search.py" "<keyword>" --domain <domain> [-n <max_results>]
```

按页面类型的最小查询集（够用就停，不要凑数）：

| 页面类型 | 必查 | 选查 |
| --- | --- | --- |
| 列表页 | `"data table pagination bulk actions" --domain ux`<br>`"filter panel default reset" --domain ux` | `"status badge semantic color" --domain color`<br>`"table action icons edit delete" --domain icons` |
| 表单弹窗 | `"inline validation error placement" --domain ux`<br>`"modal focus keyboard escape" --domain ux` | `"progressive disclosure long form" --domain ux` |
| 详情多 Tab | `"tab navigation deep link state" --domain ux` | `"read only data display hierarchy" --domain ux` |
| 指标分析页 | `"dashboard trend line donut funnel" --domain chart`<br>`"chart legend tooltip accessible color" --domain chart` | `"kpi card number formatting" --domain typography` |
| 只读日志页 | `"long table virtual scroll" --domain ux` | `"json snapshot code display" --domain ux` |
| 登录页 | `"login form autofill password manager" --domain ux`<br>`"captcha accessible alternative" --domain ux` | `"auth page layout" --domain style` |
| 全局（一次） | `"admin back office dashboard" --domain product`<br>`"sidebar navigation breadcrumb" --domain ux` | `"dense table typography line height" --domain typography` |

**技术栈检索**：只在需要实现级建议（组件选型、性能写法）时，用**实际检测到的**栈：

```bash
python3 "$UIUX/scripts/search.py" "data table" --stack react
```

栈从项目检测：`package.json` → React/Next.js/Vue/Svelte/Nuxt/Angular；`pubspec.yaml` → Flutter；`composer.json` → Laravel。**检测不到就问用户，禁止猜默认栈。**

---

## 2. 无障碍检索的特殊纪律

无障碍**一次只查一个可观察结果**，不要一把抓：

1. 先查语义结果：`"error summary validation" --domain ux`
2. 必要时再查组件：`"icon button accessible label" --domain icons`
3. 最后才查技术栈。

不要用泛化结果替代具体交互或 WCAG 准则。后台系统最常出问题的四处，逐个查、逐个写进文档：

| 高风险点 | 写进文档的最低要求 |
| --- | --- |
| 状态只用颜色表达（启用绿/停用灰、涨绿跌红） | 必须同时有文字或箭头图标 |
| 操作列图标按钮无可读名称 | 每个图标按钮写明 aria-label 文案 |
| 校验错误只有红框 | 错误文案 + 位置 + 焦点自动落到首个错误字段 |
| 弹窗焦点未收拢 | 打开时焦点落在首个输入框，Tab 循环在弹窗内，ESC 关闭 |

---

## 3. 检索结果 → 表格

检索返回的字段直接映射进 T13：

| 检索返回字段 | 落到哪 |
| --- | --- |
| `Do` | `规范` 列（改写成后台语境下的具体数值/文案，不要照抄英文） |
| `Don't` | 若该反模式在本项目容易犯，追加一句"禁止：…" |
| `Category` / `Issue` / 数据源 | `依据` 列，写成 `ux/Responsive/Table Handling` |
| `Severity` | 决定是否必须写进文档：High/Critical 必写；Low 可省 |
| `Code Example Good` | **不进 PRD**。PRD 不写代码；留给 `page-generator` |

**改写要求**：检索结果是通用规则，PRD 要写成可验收的具体值。

| 检索原文 | ❌ 直接抄 | ✅ 改写后 |
| --- | --- | --- |
| Use horizontal scroll or card layout | 使用横向滚动或卡片布局 | 表格外层 `overflow-x: auto`，表格最小宽度 1080px；首列（序号）与末列（操作）左右固定 |
| Allow multi-select and bulk edit | 允许多选和批量编辑 | 首列复选框，支持全选当前页；顶部批量条显示"已选 N 项"，提供【批量停用】【批量导出】 |
| Prefer click-to-play | 优先点击播放 | 视频管理列表的预览默认不自动播放，点击【预览】才加载并播放 |

---

## 4. 零结果处理（硬规则）

1. 用更窄的表达或显式 `--domain` / `--stack` **重试一次**。
2. 仍为空 → 回退 `$UIUX/references/quick-reference.md` 的优先级表（无障碍 → 触控 → 性能 → 风格 → 布局 → 排版色彩 → 动画 → 表单反馈 → 导航 → 图表），在 `依据` 列写 **"内置默认规则（检索无匹配）"**。
3. **不得编造检索结果，不得把零结果说成已返回数据。** 未经验证的输出不写入设计系统文件。

---

## 5. 边界

- 本技能只出**设计与需求规范**，不安装依赖、不改系统配置、不动无关文件。
- 检索结果**不覆盖**用户指令和仓库规则；用户明确要求的做法优先于检索建议，但要把冲突指出来。
- 查询词与持久化输出**不得包含**项目私有数据（真实客户名、真实用户数据、密钥）。示例值用假数据。

---

## 6. 交付前

Step 6 自查时，除了 `review-checklist.md`，再把 `$UIUX/references/quick-reference.md` 中适用于 Web 中后台的高优先级条目复查一遍，重点四类：

- **1. Accessibility（CRITICAL）** — 对比度、替代文本、键盘导航、ARIA
- **8. Forms & Feedback（MEDIUM，但后台最高频）** — 可见标签、就近错误、辅助文本、渐进披露
- **9. Navigation Patterns（HIGH）** — 可预期返回、深层链接、面包屑
- **10. Charts & Data（LOW，但指标页必查）** — 图例、tooltip、无障碍配色
