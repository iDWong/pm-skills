# 原型图：每个页面必须配一张

## 为什么这条是硬要求

参考文档（短剧后台管理.doc）**一张图都没有**——54 页全是表格，唯一带 UI 字样的 §1.2「登录界面UI设计」实际是一张 `交互元素 | 行为描述 | 策划说明` 表。那是原模板的缺陷，不是范式。

一份后台 PRD 光有字段表，评审时仍然会卡在"这些区块谁在上谁在下""指标卡一行放几张""操作列在最左还是最右"。**原型图不是美化，是省一轮评审。**

所以：**Step 4 每写完一个页面，必须配一张原型图。** 弹窗单独一张，不与主页面挤在一起。

## 原型图画什么、不画什么

| 画 | 不画 |
| --- | --- |
| 区块位置与上下顺序 | 最终配色（配色以 `MASTER.md` 为准） |
| 指标卡一行几张、卡内四行结构 | 精确字号与间距 |
| 表格的列顺序与列宽比例 | 真实数据（用文档里同一套假数据，保持一致） |
| 状态表达方式（颜色+图标+文字三者并用的样子） | 图标的具体形状（用文字占位） |
| 校验失败态、空态、权限隐藏态 | 动效 |
| 二次确认文案原文 | 响应式各断点（在 UX 规范表里用文字写） |

**关键**：原型图要把"文字规范里说了但看不见"的东西画出来——涨跌不能只靠颜色、Chip 换行不裁切、错误汇总在表单顶部、未授权指标组整组不渲染。画出来评审才会真的注意到。

## 工具链

这台机器没有 ImageMagick / rsvg-convert / Inkscape，只有系统自带的 `qlmanage`。技能自带三个脚本处理这件事：

| 脚本 | 作用 |
| --- | --- |
| `scripts/wireframe.py` | SVG 组件库：sidebar / header / 筛选字段 / segmented / 指标卡 / 表格 / 四种图表 / 按钮 |
| `scripts/png_crop.py` | 纯 Python PNG 裁边（只用 zlib，无第三方依赖） |
| `scripts/render.sh` | SVG → PNG 流水线 |
| `scripts/selftest.py` | 排版自测：给每个组件灌超长中文，验证不重叠、不出框、度量不低估 |

### 为什么要裁边

`qlmanage` 渲染 SVG 时按**短边**缩放并裁掉超出部分——直接喂一张 1280×1520 的 SVG，右侧会被切掉。

解法在 `wireframe.py` 的 `SVG.__init__` 里：画布强制为 `max(w,h)` 的正方形，内容锚定左上角，其余留白。这样 qlmanage 不裁切；再用 `png_crop.py` 以**右下角像素**为留白基准精确裁回原始比例。

### 用法

**第一步**：写一个生成脚本，`import` 组件库，把每个页面画成一个 SVG。

脚本**落项目根的 `tools/`**（如 `tools/gen_wireframes.py`，先 `mkdir -p tools/svg`），SVG 输出到 `tools/svg/`。不要把脚本写在项目根或系统临时目录——改一版原型图要靠它重跑，SVG 中间产物同理留着不删。

```python
import sys, os, glob
# 自解析（SKILL.md「技能库根目录自解析」那份的 sys.path 变体，改根目录顺序时两处一起改）：
# plugin 模式（本 bundle + 同级 bundle）优先，再找 Claude / Codex / Cursor 平铺
_roots = []
_plug = os.environ.get("CLAUDE_PLUGIN_ROOT")
if _plug:
    _roots.append(os.path.join(_plug, "skills"))
    _roots += sorted(glob.glob(os.path.join(_plug, "..", "*", "skills")))
_roots += [os.path.expanduser("~/.claude/skills"),
           os.path.join(os.environ.get("CODEX_HOME", os.path.expanduser("~/.codex")), "skills"),
           os.path.expanduser("~/.cursor/skills")]
for _r in _roots:
    _p = os.path.join(_r, "pm-prd-spec", "scripts")
    if os.path.isdir(_p):
        sys.path.insert(0, os.path.normpath(_p)); break
else:
    raise FileNotFoundError("pm-prd-spec/scripts 未找到（plugin 模式请确认 pm-execution bundle 已安装）")
from wireframe import *                      # SVG, sidebar, header, field, seg, kpi, table, chartbox, btn, 及颜色常量

g = SVG(1280, 620)                           # 传内容尺寸；画布会自动补成正方形
sidebar(g, 620, "运营日报")                   # 第2参数=内容高度，第3参数=高亮的菜单项
header(g, "数据统计  /  运营日报", "数据更新至 2026-09-07 23:59:59")

g.rect(200, 62, 1060, 70, fill=FILL)
g.t(214, 84, "数据筛选", 12, INK, weight="600")
seg(g, 214, 92, ["昨日", "近7天", "近30天", "自定义"], 0)        # 最后一个参数=选中项下标

kpi(g, 214, 150, 250, "DAU", "128,406", "较上周期 +12.4% 升", GRN,
    "自然 96,318 ｜ 投流 32,088")                                # GRN/RED/YEL/MUT 控制涨跌色

table(g, 214, 300, 1040, "表1 · 冒烟表",
      [("字段", 30), ("说明", 40), ("示例", 30)],                # (列名, 宽度占比)
      [[("日志ID", INK), ("全局唯一编号", INK), ("20260902001234", INK)]])

chartbox(g, 214, 400, 500, 190, "图1 · 核心指标趋势", "line")     # kind: line / dual / donut / bar

assert not g.collisions(), g.collisions()   # ← 收尾自查：文字重叠就当场失败
g.save("tools/svg/pt-01-daily-report.svg")   # ← 文件名纯 ASCII；SVG 落 tools/svg/
```

**第二步**：渲染成 PNG。

```bash
python3 tools/gen_wireframes.py
bash "$(resolve_skill pm-prd-spec)/scripts/render.sh" tools/svg prd/PRD/images 2400
```

`render.sh` 会打印每张图的 `原尺寸 -> 裁后尺寸`。**裁后比例必须等于 SVG 内容比例**，否则说明裁边失败（通常是画布没做成正方形），不要将就。

## 致命坑：SVG 不会自动换行，也不会自动截断

**这是"生成的图内容重叠"的唯一成因。** HTML 里一个 `<div>` 装不下文字会换行或滚动；
SVG 的 `<text>` 不会——它既不换行、不截断，也不会撑开所在的框，超出的部分照样画出来，
于是长中文串直接压在隔壁元素上。中英混排还会放大这件事：一个字符的宽度从 0.19em（`l`）
到 1.0em（汉字）不等，**用 `len(s)*常数` 估宽必错**。

所以 `wireframe.py` 里三条硬规矩，自己写组件时也照办：

| 规矩 | 怎么做 |
| --- | --- |
| 画字先量宽 | `text_width(s, size, weight, mono)`，再用 `ellipsize()` 截断或 `wrap()` 折行 |
| 框宽由文字决定，或文字截到框内 | `g.t(..., maxw=可用宽度)` 会自动截断加省略号；`btn()` / `seg()` 反过来按文字撑开框 |
| 相邻元素要互相扣掉 | 右边有角标/箭头/按钮时，左边文字的 `maxw` 必须减掉它——两边各写死一个数就会撞上 |

`text_width()` 的字符宽度表是在本机用 `qlmanage` 实测出来的（同一字符画 20 遍和 40 遍各渲一次，
宽度差 ÷ 20 得到步进，从而消掉字形左右边距），换字体或换渲染器必须重测。

另外 `<text>` 一律带 `xml:space="preserve"`：不加的话 SVG 会把连续空格塌缩成一个、并吃掉首尾空格，
渲染宽度就和模型算的对不上（侧边栏靠前导空格做的二级菜单缩进也会凭空消失）。

### 画完必须自查

`SVG` 对象会记录每段文字的包围盒，收尾加一行断言，重叠就当场失败：

```python
assert not g.collisions(), g.collisions()      # 任意两段文字的包围盒相交
assert not g.out_of_canvas(), g.out_of_canvas()  # 文字画到内容区之外（裁边后会被切掉）
```

改过 `scripts/wireframe.py` 之后跑一遍自测：

```bash
python3 "$(resolve_skill pm-prd-spec)/scripts/selftest.py"
```

## 致命坑：只有 `images/<纯ASCII名>.png` 这一种写法能嵌入

**Word 导出接口只认 `images/<纯ASCII名>.png`，其余形式一律静默丢图。**

2026-09-10 实测边界（同一张图、只改路径）：`images/wf-01.png` → 嵌入 ✅；
`img/wf-01.png`、`images/sub/wf-01.png`、`assets/img/wf-01.png`、与 md 同目录的 `wf-01.png`、
`../images/wf-01.png`、`images/中文名.png` → **全部 0 张图**。
所以本技能「PNG 放在与 md 同级的 `images/` 下」这条不是风格偏好，**是唯一能用的形式**。
完整边界表见 `../../common/README.md`。

`common/export-word.sh` 会打印 `Found 5 local image(s)` 和 `+ images/xxx.png`，然后 `Export succeeded` ——看起来一切正常。但如果文件名含中文，服务端返回的 docx 里只有一个空图框加图注，**没有图片**，而且不报错。

判定方法（每次导出后必做）：

```bash
unzip -l <导出的.docx> | grep -c "word/media/"
```

数字必须等于图片张数。为 0 就是丢图了。另一个信号是 docx 体积——嵌了图的 docx 至少几百 KB，纯文字的只有几十 KB。

所以：**PNG 一律用 ASCII 文件名**，例如 `pt-01-daily-report.png`、`pt-03-subscription-form.png`。中文只出现在 Markdown 的 alt 文本和图注里。

**前缀：新增一律 `pt-`（原型图），存量 `wf-` 不动。** 早期文档用的是 `wf-`（wireframe），术语改叫原型图后新文件统一 `pt-`。
在已有 `wf-` 图的项目里补图时：**新图用 `pt-`，老图保持 `wf-` 原样**，不要为了统一去批量改名——
改名要同步改 Markdown 引用、SVG 中间产物名和已导出的 docx，收益抵不上风险。同一份文档里两种前缀共存是允许的。

## Markdown 里的写法

插在该页面「功能概述」小节末尾，**不要单独开一个小节**（`**页面原型图**` 是粗体块，不是标题），图注单独一行：

```markdown
**页面原型图**

![图 3-1 运营日报页面原型图](images/pt-01-daily-report.png)

> 图 3-1　运营日报。含筛选区、核心结论区、三组指标卡、四张图表与两张明细表。原型图只表达信息层级、区块位置与状态表达方式，不代表最终视觉。配色、字号、间距以 `design-system/default/MASTER.md` 为准。
```

图号规则：`图 {章节号}-{序号}`，与页面编号对齐（3.1 → 图 3-1，3.2 的弹窗 → 图 3-3）。

## 画布尺寸参考（按形态）

### Web 运营管理系统

| 页面类型 | 内容尺寸 |
| --- | --- |
| 指标分析页（含图表与明细表） | 1280 × 1500±200 |
| 列表页 | 1280 × 700±100 |
| 表单弹窗 | 980 × 1000±200（带遮罩） |
| 详情弹窗 | 980 × 660±100（带遮罩） |
| 只读日志页 | 1280 × 620±100 |

侧边栏固定 180px，主内容区从 x=200 起，右边距 20px。用 `sidebar()` + `header()`。

### 移动端 APP / H5 / 小程序

手机内容区固定 375×812，但**画布要留出右侧标注栏**——移动端单屏信息少、规则多，规则写在图右边比堆在正文里好读。

| 场景 | 画布 | 说明 |
| --- | --- | --- |
| 单页 + 标注 | 900 × 900 | 手机在左（x=40,y=40），`note()` 块在右（x=470，宽 390） |
| 长页（H5 活动页） | 900 × 1600+ | 手机加高，用 `foldline()` 标首屏折线 |
| 双端对照 | 900 × 900 | 两台手机并排 x=40 / x=470 |
| 浮层 | 900 × 900 | 单独一张，画在半透明遮罩上 |

### Web 官网

| 场景 | 画布 |
| --- | --- |
| 桌面主视图 | 1440 × 2400±600（按区块数定） |
| 移动断点对照 | 375 × 长（定价表转卡片流这类差异大的页面才画） |

用 `sitepage()` 画导航条与页脚，`section()` 画内容区块，`foldline()` 标首屏（1440×900）。

## 组件 API 速查

| 函数 | 签名 | 返回 |
| --- | --- | --- |
| `SVG(w, h)` | 传内容尺寸，画布自动补正方形 | — |
| `sidebar(g, h, active)` | 后台侧边栏，`active` 是高亮的菜单项名 | — |
| `header(g, crumb, right)` | 后台顶栏（面包屑 + 右侧说明） | — |
| `phone(g, x, y, w=375, h=812, variant, title, tabs)` | `variant`: `app` / `miniprogram` / `h5`；`tabs`: `[(名,选中), ...]` 或 `None` | `(left, top, right, bottom)` 内容区 |
| `sitepage(g, x, y, w, h, nav, cta, brand, footer)` | 官网导航条 + 页脚 | `(left, top, right, bottom)` 内容区 |
| `section(g, x, y, w, h, name, desc, cta, tone)` | 官网区块，`tone`: `plain`/`tinted`/`dark` | 区块底部 y |
| `note(g, x, y, w, title, lines)` | 右侧标注块 | 下一个块的 y |
| `foldline(g, x, y, w, label)` | 首屏折线 | — |
| `field(g, x, y, w, label, val, ctrl)` | 筛选/表单控件，值超长自动截断并避让右侧箭头 | 控件右边界 x |
| `seg(g, x, y, opts, sel)` | 分段控件，每段按文字实测宽度撑开 | 右边界 x |
| `btn(g, x, y, w, txt, primary, ghost)` | 按钮，`w` 只是下限，按文字自动撑开 | 实际宽度 |
| `kpi(g, x, y, w, label, num, delta, dcolor, split, note)` | 指标卡；主数字放不下会自动缩号，标题会避让右上角标 | — |
| `table(g, x, y, w, title, cols, rows, rowh, note, wrap_cells)` | 表格；`wrap_cells=True` 长文本折行并自动加高行，否则截断到列宽内 | 表格底部 y |
| `chartbox(g, x, y, w, h, title, kind, note)` | 图表，`kind`: `line`/`dual`/`donut`/`bar`；顶部留图例带，末端标名带白底 | — |
| `text_width(s, size, weight, mono)` | 量文字宽度（px），所有排版决策的地基 | 宽度 |
| `ellipsize(s, maxw, size, ...)` / `wrap(s, maxw, size, ...)` | 截断加省略号 / 折成多行 | 字符串 / 行数组 |
| `g.t(x, y, txt, ..., maxw=)` / `g.tblock(x, y, txt, w, ...)` | 画一行字（`maxw` 自动截断） / 画一段自动折行的字 | 宽度 / 占用高度 |
| `g.collisions()` / `g.out_of_canvas()` | 自查：互相压住的文字对 / 画出内容区的文字 | 列表，空即合格 |

`phone()` 和 `sitepage()` **返回内容区坐标**，后续元素基于返回值定位，不要硬编码——改了导航栏高度不用重算整页。
