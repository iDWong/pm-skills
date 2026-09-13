# UI/UX设计稿交付：PRD/SRS → `design-system/`

本文件是**跨宿主唯一权威契约**。`ui-ux-pro-max` 在"根据 PRD/SRS 出设计稿"这件事上读它，
`pm-prd-spec` / `req-doc` 交付后路由到它。目录骨架与一致性要求见文末。

**设计这一侧只有 `ui-ux-pro-max` 一个技能**：设计系统、材质与层级、多端规则、交付全在它里面，
不再外挂材质皮肤技能（原 ui-frosted-gradient-clear-sleeve 已并入本技能，见 `design-system.md` 第四节与 `assets/surface/`）。

**同目录另有两份规格，动手前按需读**：`design-system.md`（品牌层九节 + 组件层 30 件 + 令牌同步方案 + **表面与材质层**）、
`platform-rules.md`（iOS / Android / HarmonyOS / 微信 / 支付宝 / H5 / 官网 / 后台 八端硬规则 + 跨端一致性审查）。
本份管**怎么交**，那两份管**交什么、各端要满足什么**。

## 何时启动

同时满足才启动：

1. 用户要 **设计稿 / 高保真原型 / 可点原型 / 交互原型 / 预览墙**（任意一个即触发；不是原型图——PRD 里那张静态原型图走 `pm-prd-spec`）；
2. 项目里 **PRD 与 SRS 都已落盘**（`prd/PRD/*.md` + `dev/SRS/*.md`）。

缺件怎么办（与 `pm-prd-spec` Step 8 的启动条件表**同一口径**，两边不得各写一套）：

| 现状 | 处理 |
| --- | --- |
| PRD + SRS 都有 | 可启动 |
| 只有 PRD | 先走 `req-doc` **Step F** 转写 SRS 再启动；只有用户**原话**要求"跳过 SRS / 直接出设计稿"时才允许只用 PRD，并在索引页注明"SRS 未落盘，规格细节全部取自 PRD" |
| 只有 SRS | 先走 `pm-prd-spec` 出 PRD——**设计稿内容以 PRD 为主真源**，没有 PRD 就没有页面清单、文案与交互依据 |
| 只有 SRS，且项目走的是 `dev-master` 研发流程（没有产品侧 PRD 链路） | **允许以 SRS 为唯一真源出稿**：页面清单取 SRS 的页面清单章节、字段与状态取字段级详细设计章节，视觉与交互决策由本技能补全；索引页注明「无 PRD，页面清单与文案取自 SRS」。**不要为此去跑 `pm-prd-spec`**——研发流程里没有这一环，硬等 PRD 会把阶段 6 卡死 |
| 两个都没有 | 不要凭空造页面，先 `pm-prd-spec`（出 PRD）再 `req-doc`（出 SRS） |

常见上游：`pm-prd-spec` **Step 8** 在 PRD + SRS 齐备后路由到这里，其 Step 8 的验收表与本契约同源，
口径不一致时**以本契约为准**。

## 铁律

1. **必须先读 PRD 与 SRS 全文再动手**。禁止只读目录、只读章节标题、只读其中一份就开始写页面。
   页面清单、字段、枚举、文案原文、校验规则、状态机、指标口径**一律照抄文档**，不得自创。
   **本链路以 PRD 为主真源**——页面清单、区块顺序、字段与枚举、文案原文、交互与状态、界面与交互规范都取 PRD；
   SRS 是补充与兜底，只在 PRD 未写明时提供规格细节（校验边界、状态机、接口约束）。
   两份冲突时**取 PRD**，并在标注面板里写明"取 PRD x.y.z（SRS 3.5.x 表述不同）"。
   注意这条只适用于**设计稿交付**：研发交付（`page-generator` / `lld-design` 等）的规格真源仍是 SRS。
   **「取 PRD」是动手改稿，不是补一条标注就算完。** 已有设计稿与 PRD 对不上时（枚举不同、分档口径不同、
   按钮少了一半、文案是自己写的），改的是设计稿；标注面板里那句「取 PRD x.y.z」是留痕，不是豁免。
   实际踩到的四类：① 人设五段用了文档里不存在的两段；② 池子按四档出稿而 PRD 是 8×3 矩阵；
   ③ 三态权限层共用两个按钮（PRD 要求三态各给各的出路，混在一起的表现就是「按钮点了没反应」）；
   ④ 二次确认写「不占今天的额度」而 PRD 明写「当日配额仍占用」—— 最后这类最危险，它把一条业务规则写反了。
2. **落盘 `design-system/<项目slug>/`**（项目根下；目录不存在先 `mkdir -p`）——设计稿包与设计令牌母版 `MASTER.md` 同树。
   HTML 产物落这个目录的**根**：不要落它的 `pages/`（那是令牌覆盖 `.md`），也不要落 `docs/`、`dist/`。
   旧约定的 `Prototype/` **已废除**：存量项目**读时兼容**（有稿就认），新产出一律落新根，不主动搬家；用户要求迁移时 `images/` 一起搬并回改相对引用。
3. **每页零依赖独立 HTML**：CSS/JS 全部内联，不引任何 CDN、不用 ES module `import`、
   不 `fetch` 本地文件——**每一页双击都能直接打开并正常交互**。
   图片有两条合法路径：**内联 SVG / `data:` URI**，或**放进 `images/` 用相对路径引**（见「位图资源」一节）。
   「零依赖」禁的是**运行时的外部请求**，不是禁位图 —— 从 CDN **下载到本地**再相对引用不违反本条，
   判据是 `grep 'src="https\?://' *.html` 必须为空。
4. **必须生成索引页，共三张墙**：移动墙（APP / H5 / 小程序 共用一张）、官网墙、后台墙，规格见下。索引页是评审入口，不是文件列表。
5. **墙内不注入工具条**；需求标注开关与「重置演示进度」**只在全屏页**出现，位置固定右下角。
   「只在全屏页」是字面意思：**墙页面自己也不许挂 devbar**，不只是 iframe 里看不见。
   连带后果是墙上不能有任何「要点开关才看得到」的内容 —— 墙的出稿口径必须**常驻正文**，见「页头」一节。
6. **标注面板逐条列出该页规则，每条标明 PRD/SRS 出处**（章节号）。没出处的规则不要写进面板。
7. 形态判定沿用 PRD 的五形态（APP / H5 / 小程序 / 后台管理 / 官网），但**墙只按画布尺寸分三张**：
   三种移动形态画布相同（393×852），共用移动墙，靠卡片分组区分（组头写"APP" / "H5" / "小程序" + PRD 章节号）；
   官网与后台画布不同，各自独立一张。**不要把 1280 或 1440 的页面混进移动墙**，也不要给 H5、小程序各建一张空墙。
   **平台差异（iOS / Android / HarmonyOS，微信 / 支付宝）不新建墙、也不切帧**：差异点存在的页面出独立文件与独立卡片
   （`app-01-login-ios.html`…），同组并排，卡片图注标平台名。只有六类差异允许出多版，细则见 `platform-rules.md` 第 0 节。
8. **完整流程出稿，不做「出稿帧」**：页面里的每一个状态——流程态、页签态、数据态、自动触发层——
   都必须由真实操作在流程里走到；**禁止**用工具条切帧展示状态，产物里出现 `data-setframe` 即不合格。
   到不了的状态说明流程缺了一环（少一个入口、少一条演示数据、少一个分支），**补流程，不补开关**。
   细则见「完整流程的动态交互」一节。

## 目录与命名

```
design-system/<项目slug>/
├── MASTER.md             ← 设计系统母版（`--design-system` 产出；已存在**沿用不覆盖**）
├── pages/                ← 页面级令牌覆盖（`.md`，`--page` 产出）；**不放 HTML**
├── HANDOFF.md            ← 工程师对接交付清单（八节，见「工程师对接交付清单」一节）
├── tokens.json           ← 机器可读设计令牌（前端直接吃，与 MASTER.md 同源）
├── index.html            ← 移动端墙（APP / H5 / 小程序，393×852）
├── web-index.html        ← 官网墙（1280×900）
├── admin-index.html      ← 后台墙（1440×900）
├── app-01-login.html     ← 移动端页面（app- / h5- / mp- 前缀 + 两位序号 + slug）
├── web-home.html         ← 官网页面
├── admin-dashboard.html  ← 后台页面
├── FLOWS.md              ← 流程清单（build 汇总；评审与开发照着逐条走，取代原来的出稿帧）
├── CONSISTENCY.md        ← 跨端一致性矩阵与走查清单（覆盖 ≥2 端时必交，见 `platform-rules.md` 第 9 节）
├── images/               ← 真实位图（封面 / 头像 / 墙底）；文件名纯 ASCII，见「位图资源」一节
├── assets/               ← 交给前端的切图 / 图标 / 字体 / 动画源文件（见 HANDOFF 第 7 节）
└── _src/                 ← 生成器（Python），产物由它构建；同目录还有 `copy.py`（文案字典）、
                          `handoff.py`（生成 HANDOFF 第 2–4 节）、`fetch_images.py`（位图下载）
```

- 文件名一律**纯 ASCII 小写连字符**。中文只出现在页面内容、卡片图注与标注面板里。
- **生成器落 `design-system/<项目slug>/_src/`**，随设计稿包整体迁移；`tools/` 只放 PRD/SRS 阶段的一次性脚本（原型图生成等），两者不要混。
- 根目录 `.html` 是 `python3 _src/build.py` 的产物，**手改会被覆盖**——改动一律落 `_src/` 再 build。
  这句必须写进 `design-system/<项目slug>/README.md`（设计稿包内那一份），否则下一个人会手改产物。
  该 README 只讲设计稿包自身（页面清单、怎么 build、墙怎么看），**不要**去覆盖项目根的
  `README-PRD.md` / `README-SRS.md`——那两份分别归 `pm-prd-spec` 与 `req-doc` 维护。

## 索引页规格（预览墙）

### 页头

badge（`图标 + 英文分区名 · PRD 第 N 章`）+ 标题（`品牌 墙名`）+ **出稿口径卡** + **KPI 胶囊行** +
主题切换 + 语言切换 + **跨墙互跳胶囊**。
再给一行分组目录（锚点 + 每组页数），下面按功能域分组排卡片，组头写 **PRD 章节号**。

#### 出稿口径卡（原来那句「一句话说明」的位置）

早期版本这里放的是一句机制说明（「预览墙内是 iframe 实时渲染的真实页面（393 × 852 等比缩放），
点预览卡即可进入全屏页面」），出稿口径另挂在墙的 `annopanel` 里靠标注开关点开。**这个组合是错的**：
铁律 5 不许墙挂 devbar，没了开关那块 annopanel 就永远打不开；而那句机制说明评审第二次进来就不看了。

现在的规格：**这个位置直接放出稿口径清单**，机制说明降级到页尾的「使用与口径说明」。

| 项 | 规格 |
| --- | --- |
| 位置 | 紧跟 H1，在 KPI 胶囊行**之前**；`head()` 的 `desc` 形参直接收这一块 HTML |
| 形态 | **通栏卡**（宽度跟内容区，不设 `max-width`）+ 磨砂玻璃底，标题行下一道分隔线，条目用小圆点不用 `list-style` |
| 标题 | `出稿口径 · 依据 {PRD 文件名}` —— 把「依据哪份 PRD」并进标题，不再单独占一句 |
| 条目 | `<b>要点</b> — 说明`，8–10 条。**每条都是评审会真被问到的口径**：页面口径与编号对齐关系、弹窗/浮层数与可达性、红线（零付费点、数值零泄漏之类）、安全区与触控、状态与流程到达口径、占位资源 |
| 不放什么 | 不放"怎么用这张墙"（挪页尾）、不放 PRD 版本号与设计系统 slug（KPI 行都不配放的东西，这里更不配） |
| 别做成 | 别做成需要开关的浮层，别做成 `annopanel` —— 墙上没有开关可以开它 |

`index_shared.py` 里配一个 `spec(title, items, inhead=True)` 出这块，`head()` 的 `desc`
判一下入参是不是以 `<` 开头：是就原样渲染，否则按老的一行副标题（`.ihead__s`）渲染，两种都留着。

**磨砂底怎么做**（四条，踩过）：

1. 底色用**主题令牌兑透明度**（`color-mix(in srgb, var(--surface) 62%, transparent)`），
   **不要**用纯黑叠透明（`rgba(0,0,0,.22)`）。纯黑底在浅色墙上必须加重到 `.5` 才压得住，
   于是卡内文字得写死成白色、还要为浅色墙单独覆盖一遍——一块卡拖出四条主题覆盖，且两张墙从此不同色。
   走令牌就没有这些：文字沿用 `--text` / `--text-2`，两张墙各自对比度自洽。
   细节见 `references/surface/pitfalls.md`「二·五」。
2. 磨砂要有东西可糊。墙底是平色，`blur()` 糊平色等于没糊——铺柔光
   （两团 `radial-gradient`，品牌色 16–26% 透明度，`pointer-events:none; z-index:-1`）。
   **页头与页尾各铺一层**：两张玻璃卡一张在最上、一张在最下，只给页头铺的话底部那张糊的还是平色。
3. 玻璃的厚度感来自**顶边一道高光**（`::after` 1px 渐变），不是来自阴影。别加纯黑投影。
   `@supports not (backdrop-filter…)` 里退回 `var(--surface)` 实底，别留一块糊不掉的半透明。
4. **墙上两张说明卡（出稿口径 / 使用与口径说明）用同一套玻璃，且写成一条共享规则**：

   ```css
   .ihead__spec,.note{ position:relative; border-radius:16px; overflow:hidden;
     background:color-mix(in srgb, var(--surface) 62%, transparent);
     border:1px solid color-mix(in srgb, var(--border) 70%, transparent);
     -webkit-backdrop-filter:blur(20px) saturate(140%);
             backdrop-filter:blur(20px) saturate(140%) }
   .ihead__spec::after,.note::after{ /* 顶边高光，同上 */ }
   @supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
     .ihead__spec,.note{ background:var(--surface); border-color:var(--border-subtle) }
   }
   .ihead__spec{ margin-top:16px; padding:18px 22px }   /* 各自只留排版差异 */
   .note{ padding:20px 24px; font-size:13px; line-height:1.9; color:var(--text-2) }
   ```

   各写一份底色/描边/blur 必然漂——改了一张忘了另一张，评审时两张卡不同质感。
   两张卡的差异只允许出现在排版（padding、字号、行高、`h3` 与列表样式）。

#### 页尾「使用与口径说明」卡

被出稿口径卡挤下来的那些机制说明落在这里，**页尾一张卡**，5–6 条：

- 墙内是 iframe 实时渲染的真实页面（写清尺寸与等比缩放），点卡进全屏；墙内不注入工具条、全屏页才有
- 主题切换有几档、选择写进 `localStorage` 并带进墙内 iframe 的 URL
- 卡片上的「N 流程」= 该页能走通的完整交互路径数，路径清单见 `FLOWS.md`；全屏页右下角能开标注面板、能重置演示进度
- 设计令牌取自哪份 MASTER、偏离记录在哪
- 图形全是内联 SVG，零外链，每一页双击都能打开
- 重建命令 `python3 _src/build.py`，**手改根目录 `.html` 会被覆盖**

它与出稿口径卡的分工是固定的：**页头那张回答「这稿按什么口径出的」，页尾这张回答「这稿怎么看、怎么改」**。
别把口径写进页尾（评审第一屏就要看到），也别把操作说明塞进页头（评审第二次进来就不看了）。
两张卡视觉上是同一套玻璃，见下面第 4 条。

#### 墙底：整屏固定背景

玻璃卡要磨砂，墙底就必须有层次（纯色底上 `blur()` 糊出来还是同一片纯色）。这一层的**唯一正确挂法**：

```css
body.is-index::before{ content:""; position:fixed; inset:0; z-index:0; pointer-events:none; … }
.is-index .wrap{ position:relative; z-index:1 }   /* 内容压在背景之上 */
```

**别挂在 `.ihead` / `.wrap` 这类内容元素上。** 踩过的两条：`.wrap` 有 `max-width:1240px`，
背景就跟着那个盒子走 —— 宽屏上背景在 1240px 处**突然断掉**；高度又写死 `520px`，
**一改窗口尺寸就露边**。`fixed + inset:0` 按定义等于视口，缩放不重排、滚动不位移，且不需要任何 JS。

尺寸单位一律用 `vmax`：百分比在极端宽高比（如 2200×700）下会把光斑压成细条。

**图层顺序不能动**（CSS 里第一个在最上）：

| 层 | 内容 | 为什么 |
| --- | --- | --- |
| ① 上 | 几团品牌柔光 `radial-gradient` | 给磨砂制造可糊的层次，也给整屏定调 |
| ② 中 | **压色层** `--wall-scrim` | 把位图压到只剩氛围。**这一层不能省** |
| ③ 下 | 位图 `--wall-img`，`cover + center` | 任意窗口比例都不变形 |

省掉压色层、把位图放最上的后果是**浅色档正文对比度直接掉**（踩过）。压色层取 80–92% 不透明度的
主题底色，效果是「合成底色仍在设计令牌附近」，于是正文色不用为背景重新调。

**位图与压色层都要按 `data-theme` 分档，不能只按 `.t-admin` 判**：

```css
body.is-index                    { --wall-img:url(images/wall-dark.jpg);  --wall-scrim:linear-gradient(rgba(8,11,20,.80),rgba(8,11,20,.86)) }
body.is-index[data-theme="light"]{ --wall-img:url(images/wall-light.jpg); --wall-scrim:linear-gradient(rgba(244,246,252,.86),rgba(244,246,252,.90)) }
body.t-admin.is-index            { --wall-img:url(images/wall-light.jpg); --wall-scrim:linear-gradient(rgba(245,247,251,.88),rgba(245,247,251,.92)) }
```

移动墙自己有浅/深两档，只按 `.t-admin` 判会让**浅色档的移动墙套上深色图**（也踩过）。

#### KPI 胶囊（`键 + 粗体值`，一行 5 个左右）

按墙取值，写评审真会看的数——别写"形态""PRD 版本""设计系统 slug"这类看了不影响判断的：

| 墙 | KPI 胶囊 |
| --- | --- |
| 移动墙 | `页面 31` / `交互流程 58` / `视口 393 × 852` / `安全区 顶 44 / 底 34` / `依赖 0` |
| 官网墙 | `页面 N` / `交互流程 N` / `预览视口 1280 × 900` / `断点 4` / `依赖 0` |
| 后台墙 | `页面 N` / `功能模块 N` / `角色类型 N` / `画布 1440 × 900` / `依赖 0` |

`交互流程` 是全墙 `flows` 之和（与卡片上的「N 流程」同源）；**`依赖 0` 必须有**——它是「零依赖独立 HTML」这条铁律的自证。

另外两条，都是踩过的：

- **别放 `PRD 20260908 · APP` 这类版本/日期胶囊。** 依据哪份 PRD 已经写在出稿口径卡的标题里，
  KPI 行只留评审会拿来数的数（页面 / 交互流程 / 弹窗或浮层 / 视口 / 依赖）。
- **每个数都必须是实测值，不能手维护。** `GROUPS` 里那一列「N 流程」写死之后，页面加了路径不会跟着变——
  实际踩到的是墙上写 141、产物里数出来 240。改完页面务必回头校准，或者直接从 build 产物里数：

  ```bash
  # 每页的交互流程数 = 该页 data-flow="流程名" 的去重起点数（一条路径一个起点，不按步骤数）
  python3 - <<'EOF'
  import glob, re, io
  for f in sorted(glob.glob('*.html')):
      n = len(set(re.findall(r'data-flow="([^"]+)"', io.open(f, encoding='utf-8').read())))
      if n: print(f, n)
  EOF
  ```

#### 跨墙互跳胶囊（不可省）

三张墙是同一条评审动线，每张墙都要能一键跳到另外两张：

| 项 | 规格 |
| --- | --- |
| 位置 | 内联进**页头 KPI 行右侧**的 `.kpis__tools`，与主题切换同一行；**不要**单独占一块，也不要塞页尾 |
| 数量 | **只渲染另外两张**，当前墙自己不出现（`if k != active`） |
| 标签 | `图标 + 墙名 + →`，墙名 = 产品线全称直接接「设计稿」（**不加中点、不加空格**）：`移动端APP设计稿` / `WEB端官网设计稿` / `WEB端运营管理系统设计稿` |
| 样式 | 复用 KPI 的 `.kpi-chip` 再加 `--go` 变体做高亮，和 KPI 行视觉连贯，不另起一套按钮样式 |
| href | **裸文件名**（`web-index.html`），**不拼 `?theme=`**——跨墙主题靠 `localStorage` 继承（见下一节）；只有**墙内 iframe 的 src** 才需要带 theme 参数，两者别搞混 |
| 缺墙 | 项目不含某形态时该胶囊不渲染，不留死链 |

**互跳胶囊跟着 KPI 行走，不单独占一行、不另起一个区块。** 三张墙共用同一个渲染函数，靠「当前是哪张墙」
这一个参数决定不自指，别为每张墙各写一份。

### URL 参数与主题继承

- 索引页支持 `?theme=light|dark&lang=zh|en`；读到就应用并写入 `localStorage`（键名如 `kk-theme`）。
- 墙内 iframe 的 `src` 要**带上当前 theme 参数**（`withThemeParam()`），换主题时重载墙内 iframe，
  保证墙上看到的和全屏打开的是同一套配色。
- 跨标签页用 `window.addEventListener('storage', …)` 同步。

### 卡片结构

```html
<article class="pv">
  <div class="pv__frame" data-w="393" data-src="app-01-login.html">
    <span class="pv__skel" aria-hidden="true"></span>
    <a class="pv__hit" href="app-01-login.html" aria-label="打开 登录页 全屏页面">
      <span>打开全屏</span></a>
  </div>
  <div class="pv__cap"><span class="pv__no">01</span><b>登录页</b><em>3 流程</em></div>
  <div class="pv__d">钱包/手机双通道登录，含授权中与失败态。<br>
    <code>PRD 6.1.2 · app-01-login.html</code></div>
</article>
```

**点预览卡即进入全屏**——`.pv__hit` 是铺满预览框的 `<a>`，同窗口打开，不开新标签、不做 modal。

### 三种墙尺寸

| 墙 | 形态 | iframe 固定尺寸 | 容器 `aspect-ratio` | `data-w` |
| --- | --- | --- | --- | --- |
| `.wall--app` | APP / H5 / 小程序 | 393 × 852 | `393/852`（圆角 22px） | 393 |
| `.wall--web` | 官网 | 1280 × 900 | `1280/900` | 1280 |
| `.wall--adm` | 后台管理 | 1440 × 900 | `1440/900` | 1440 |

**等比缩放**：iframe 用**固定像素宽高**渲染真实页面，再整体缩放，不改布局：

```css
.pv__frame{position:relative;width:100%;overflow:hidden}
.pv__frame iframe{position:absolute;top:0;left:0;border:0;transform-origin:top left}
.wall--app .pv__frame iframe{width:393px;height:852px}
```

```js
window.fitWall = function(){                       /* resize 时重算 */
  qa('.pv__frame').forEach(function(f){
    var w = parseFloat(f.dataset.w || '393'), i = f.querySelector('iframe');
    if(i) i.style.transform = 'scale(' + (f.clientWidth / w) + ')';
  });
};
```

### 懒挂载（不可省）

后台墙动辄二三十个 1440×900 的重页面，一次性挂载会把渲染进程拖死：

```js
window.mountWall = function(){
  var slots = qa('.pv__frame[data-src]');
  if(!slots.length) return;
  var mount = function(el){
    if(el.dataset.mounted) return;
    el.dataset.mounted = '1';
    var i = document.createElement('iframe');
    i.setAttribute('scrolling','no'); i.setAttribute('tabindex','-1');
    i.setAttribute('aria-hidden','true'); i.setAttribute('title','设计稿 预览');
    i.addEventListener('load', function(){
      el.classList.add('is-on');                    /* 去骨架屏 */
      i.style.transform = 'scale(' + (el.clientWidth / parseFloat(el.dataset.w||'393')) + ')';
    });
    i.src = withThemeParam(el.dataset.src, currentTheme());
    el.insertBefore(i, el.firstChild);
  };
  if(!('IntersectionObserver' in window)){ slots.forEach(mount); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ mount(e.target); io.unobserve(e.target); } });
  }, {rootMargin:'600px 0px'});
  slots.forEach(function(el){ io.observe(el); });
};
```

未挂载时显示 `.pv__skel` 骨架，`load` 后加 `.is-on` 隐藏骨架——空白卡片会被当成页面坏了。

## 位图资源（`images/`）

设计稿默认用内联 SVG 渐变占位就够了。**用户要求「用真实图片」时**按这一节做 —— 别为了省事在 HTML 里写 CDN 地址。

**做法：从图源下载到本地 `images/`，用相对路径引。** 产物里外链为 0，双击 `file://` 照样有图。

```
design-system/<项目slug>/
├── images/                    ← 纯 ASCII 文件名
│   ├── cover-00…NN.jpg        竖版封面 9:16（按墙内最大显示宽取，360×640 一般够）
│   ├── face-00…NN.jpg         头像 160×160
│   └── wall-dark.jpg / wall-light.jpg   墙底 1600×900，**预先模糊过**
└── _src/fetch_images.py       一次性下载脚本，随包走
```

`fetch_images.py` 要能重跑：默认「缺哪张下哪张」，`--force` 全部重下。图源用公开占位服务
（`picsum.photos` 给封面与墙底、`i.pravatar.cc` 给人像头像），下载后就地重压控体积
（本机常没有 `cwebp` / Pillow，`sips -s format jpeg -s formatOptions 60` 够用）。

**五条必须遵守的：**

| 条 | 说明 |
| --- | --- |
| **选图走确定性散列** | `cover-{_seed(i) % PH_N}` / `face-{_seed(seed) % AVA_N}`，`_seed` 用 `zlib.crc32` 不用内建 `hash()`。同一个 `i`、同一个人名**永远同一张图**：跨页一致（评审不会看错人），两次 build 不漂（diff 不出噪音）。图池张数要有常量（`PH_N` / `AVA_N`）并与下载数一致，改一边不改另一边会 404 出空图 |
| **兜底不许去掉** | `.ph` / `.ava` 容器保留原来的渐变底；头像再用 `data-ch` + `::before` 把首字垫在 `<img>` 下面。图缺失时退回「渐变 + 首字」，不是空圆或一块白 —— 头像是「谁在说话」的唯一标识 |
| **人像必须人工挑** | 占位头像服务里混着**小孩、吐舌、瞪眼、黄瓜片敷眼**这类图。拿它当「某个克制、寡言的角色」的头像是**内容错配**，评审会当成设计错误。做法：批量拉候选 → 拼一张 contact sheet 一次看完 → 把挑中的索引写死成 `FACE_IDS` 列表并注释「别改回 `range(N)`」 |
| **懒加载** | `<img loading="lazy" decoding="async">`。一页几十个头像时首屏只载可见的那几张 |
| **交付时说清这是占位** | 这些是**通用风景/人像**，不是本项目的成片剧照与角色定妆照。README 与评审说明都要写「正式上线须换成有授权素材」，别让人误以为是终稿视觉 |

想看图是否真的加载出来，**不能只在预览面板里看**：面板把本地文件当 `data:` 快照渲染，CSP 只允许
`img-src data: blob:`，相对路径的 jpg 必然显示破图。起个静态服务用真实 HTTP 验：

```bash
python3 -m http.server 8932 --directory design-system/<项目slug>
# 然后在页面里数：document.images 里 complete && naturalWidth>0 的比例
```

## 墙内 vs 全屏：同一份 HTML 两种表现

页面 JS 在**首帧前**（`<script>` 位于 body 末尾即可）判定自己是否在 iframe 里：

```js
var INFRAME = (function(){ try{ return window.self !== window.top; }catch(e){ return true; } })();
if(INFRAME && document.body) document.body.classList.add('in-frame');
```

```css
body.in-frame{padding:0!important}
.in-frame .devbar,.in-frame .theme-switch{display:none!important}  /* 墙内不注入工具条 */
.in-frame .screen{border-radius:0;border:0;box-shadow:none}        /* 脱掉手机机架，屏幕铺满 */
.in-frame .view > *{animation:none}                                /* 墙上不放入场动画 */
```

墙内也不要放主题切换按钮——主题由索引页决定，经 URL 参数与 `localStorage` 带过来。

## 全屏页右下角工具条（devbar）

```
position:fixed; right:16px; bottom:16px; z-index:80
折叠态：一个圆角 toggle 按钮（`aria-label="设计稿工具（非产品 UI）"`）
展开态：面板 = 「需求标注」开关 + 「重置演示进度」按钮，顶部一行 caption 写 "设计稿工具 · PROTOTYPE ONLY"
```

- **没有切帧按钮**（铁律 8）：面板里不放任何 `data-setframe`。多态节点仍写
  `data-state="idle|连接中|失败"` 供标注与自查识别，但**切换它的只有页面自己的交互脚本**——
  状态由真实操作推进，不由工具条指定。状态名用业务语义，不要 `state1/state2`。
- **重置演示进度**：清掉 `localStorage` / `sessionStorage` 里 `proto:` 前缀的演示键再 `location.reload()`，
  让只在首次进入才出现的层（注册墙、权限申请卡、一次性动效）回到流程起点重走一遍。
  它**不是**跳到某个状态，而是让流程从头再走 —— 这是它与切帧的本质区别。
- **需求标注开关**：`[data-anno]` 切 `body.anno-on`，显示 `.annopanel`；本页没有面板时给一条 toast「本页暂无需求标注」。
- **产物内可见文案统一用「设计稿」**，一律不写"原型"（PRD 里那张静态图才叫「页面原型图」，别混）。逐项照这张表：

| 位置 | 文案 |
| --- | --- |
| 三墙互跳按钮 | `图标` + `移动端APP设计稿` / `WEB端官网设计稿` / `WEB端运营管理系统设计稿` + `→`（连写，不加中点或空格） |
| **墙名的四处一致** | 上面那三个名字不只用在互跳按钮上：**互跳胶囊 / 页头 badge / 页头 H1 / `<title>` 四处必须同名**。踩过的是互跳按钮写 `WEB端运营管理系统设计稿`、落地页 badge 与 H1 却只写「运营管理系统」——点过去像换了个站 |
| 索引墙页头 H1 与 `<title>` | `{品牌} 移动端APP 设计稿`（官网 / 后台同理；读起来是一句话，**不加任何分隔符**）。**H1 里不挂计数**——`26 个页组` 这类数字归 KPI 胶囊行，塞进 H1 会让标题每次改页数都要改一遍 |
| 页面 `<title>` | `{序号} {页面名}｜{品牌}`，后台再加线别：`用户管理｜{品牌} 运营后台`。分隔用**全角竖线 `｜`（两侧不留空格）**，不用中点、不用裸空格 |
| 索引页 `desc` | `… App 静态设计稿索引 · PRD 第 6 章` / `官网设计稿页面索引` |
| 索引页说明段 | 「点预览卡即可进入全屏 设计稿页面」/「官网设计稿说明」/「后台设计稿说明」 |
| annopanel 标题 | 页面：`{页面名} 需求要点（PRD x.y.z）`——**不加中点**。**索引墙没有 annopanel**（墙不挂开关，见铁律 5）；墙的出稿口径走页头的出稿口径卡，标题写 `出稿口径 · 依据 {PRD 文件名}` |
| 预览卡 `aria-label` | `打开 {页面名} 全屏页面` |
| iframe `title` | `设计稿 预览` |
| 工具条 `aria-label` | `设计稿工具（非产品 UI）` |
| 演示性 toast | 「…（设计稿演示不真实扣减）」这类括注写"设计稿演示" |

  CSS/JS 里的**代码注释**不用改。caption 的 `PROTOTYPE ONLY` 是英文安全标记，保留不动——
  它进了 i18n 字典（现在是 `'设计稿工具 · PROTOTYPE ONLY'`），改这条 key 要中英两侧一起改；
  改完 `grep -rn '出稿帧' design-system/<项目slug>/` 必须为空，否则会断英文切换或留下旧字样。

#### 分隔符规则（别再逐处拍脑袋）

判据只有一条：**看这个符号两边是不是两个独立字段。**

| 情形 | 怎么写 | 例 |
| --- | --- | --- |
| 两个独立字段，且其中一个是**品牌/线别**（只出现在 `<title>`） | **全角竖线 `｜`**，两侧不留空格 | `01 钱包授权登录｜KiraKira`、`用户管理｜KiraKira 运营后台` |
| 两个独立字段（其余场合） | **中点 ` · `**，两侧各一个空格 | `PRD 6.1.2 · app-01-login.html`（出处 \| 文件名）、`匹配层 · Tab1 / 匹配 FAB`（组名 \| 归属）、`MOBILE APP · PRD 第 6 章`、`White · 白岩`（令牌 \| 中文名）、`设计稿工具 · PROTOTYPE ONLY` |
| 页面名**内部**的层级 | 保留中点 | `03 首页 · 推荐列表`、`31 星域 · WebView 容器` |
| 读起来本来就是**一句话的两半** | **不加分隔符**，直接空格或连写 | `KiraKira 移动端APP 设计稿`、`登录授权页 需求要点（PRD 6.1.2）`、`移动端APP设计稿`（互跳按钮，连写） |

新增页面套这张表判一次即可，不用回来问。
- 工具条是**非产品 UI**，必须一眼可辨（灰底 + 酸色描边 + caption 里写 PROTOTYPE ONLY），
  评审时不能让人误认为是产品功能。

### 标注面板

```html
<aside class="annopanel">
  <h3>登录授权页 · 需求要点（PRD 6.1.2）</h3>
  <ol>
    <li><b>钱包登录</b>：仅支持 MetaMask / OKX / TokenPocket 三家，其余灰显。<code>PRD 6.1.2 表2</code></li>
    <li><b>签名超时</b>：60s 未签名视为失败，文案"授权超时，请重新连接钱包"。<code>SRS 3.5.1-R04</code></li>
  </ol>
</aside>
```

- 底部抽屉（移动端 `position:absolute` 贴在机身内，桌面页 `position:fixed` 贴底），最大高度 62%，可滚动，带关闭按钮。
- **逐条**列该页规则：字段限制、校验文案、枚举、状态流转、权限隐藏、埋点、异常兜底。
- **每条末尾必须带出处**：`PRD x.y.z` / `SRS 3.5.x-Rnn`（表格/图号也写）。这是这份设计稿能当评审依据的唯一原因。

## 完整流程的动态交互（取代出稿帧）

早期版本把"用户点不出来的状态"挂在 devbar 的**出稿帧**上：切一下按钮，注册墙 / 权限卡 / 失败态就出现。
**这条路已经废除。** 原因是它在开发那头会漏：开发照着设计稿写代码，只会实现自己点得到的那些，
藏在切帧按钮后面的状态与分支既不在流程里、也不在页面上，**评审看得到、开发看不到**，上线必然缺。

现在的规格：**交付的是一套能从头走到尾的动态流程，不是一组静态帧。**

### 每一类状态怎么到达

| 状态类型 | 到达方式（唯一合法路径） |
| --- | --- |
| **流程态**（连接中 / 提交中 / 成功 / 失败 / 审核中） | 真实动作触发 + **确定性延时**（`setTimeout` 800–1500ms）推进；成功与失败**两条分支都要走得到**。分支由**演示数据**定死（钱包列表里 TokenPocket 固定失败、订单列表第 2 行固定超时），**禁止 `Math.random()`** —— 评审两次点出不同结果就没法复现，开发也不知道该实现哪条 |
| **页签 / 筛选态** | 点得到且**真的换内容**；只换高亮不换内容 = 不合格 |
| **数据态**（空 / 加载 / 错误 / 无权限 / 额度用尽 / 已下架） | 预置**演示数据入口**，摆在页面正文的真实位置：空态给一个空分类或新账号、错误态给「注定失败的那一条」、额度用尽给「已用完的演示账号」、无权限用**登录页的多个演示账号**（不同角色各进一个）。入口是产品 UI 里本来就有的那一行 / 那张卡，**不是**一排「打开 XX 状态」的按钮 |
| **自动触发层**（注册墙 / 权限申请卡 / 一次性动效 / 系统级权限层） | 按真实触发条件自动弹：首次进入用 `localStorage` 的 `proto:seen:*` 记标志；系统级权限用**仿真层**在真实触发点弹出，且「允许 / 拒绝」**两个分支各自通向后续页面**。复看走产品内合法路径（设置 → 权限管理、退出重进）或工具条的「重置演示进度」 |

**判定口诀**：问一句「真实用户靠自己的操作能不能到达这个状态？」——**答案必须都是能**。
到不了的，说明流程缺了一环（少一个入口、少一条演示数据、少一个分支），**补流程，不补开关**。

### 流程清单 `FLOWS.md`（必交）

生成器里每页声明 `flows=[...]` 取代原来的 `frames=[...]`，build 时汇总出
`design-system/<项目slug>/FLOWS.md` —— 这是给**开发和评审**照着走的那张单子，
也是"开发不再漏状态"的抓手（原来漏的正是只挂在帧上、没写进任何清单的那些）：

| 列 | 内容 |
| --- | --- |
| 流程名 | 业务语义（`钱包登录失败重试`、`首次进入授予麦克风权限`），不要 `flow1` |
| 起点 | 页面文件 + 那个控件（`app-01-login.html · 【连接钱包】`） |
| 步骤 | 每一步写「操作 → 界面变化」，**含中间态**（按钮 loading、遮罩、Toast） |
| 分支 | 成功 / 失败 / 取消各自走到哪一页的哪一态 |
| 终态 | 停在哪个页面的哪个状态 |
| 出处 | `PRD x.y.z` / `SRS 3.5.x-Rnn` |

产物里每条流程的起点控件写 `data-flow="流程名"`（KPI 的 `交互流程 N` 就是数它的去重值），
流程中的关键节点写 `data-flow-step="流程名:2"`，便于自查与走查对表。

### 流程完整性自查（build 后跑）

```bash
python3 - <<'EOF'
import glob, re, io
bad = False
for f in sorted(glob.glob('*.html')):
    s = io.open(f, encoding='utf-8').read()
    if 'data-setframe' in s:                       # 铁律 8：不许有帧开关
        print('残留切帧', f); bad = True
    if re.search(r'Math\.random\(', s):            # 分支必须确定、可复现
        print('随机分支', f); bad = True
    for name in set(re.findall(r'data-flow="([^"]+)"', s)):
        if not re.search(r'data-flow-step="%s:' % re.escape(name), s):
            print('流程无步骤', f, name); bad = True
print('OK' if not bad else '不合格')
EOF
```

再对着 `FLOWS.md` **逐条真人走一遍**：每条流程的成功分支与失败分支都要亲手点到终态，
中间态（loading、遮罩、Toast）要真出现。这一步不能用脚本代替，也不能用"出稿方演示一遍"代替
（判据见 `pm-master/references/prototype-review.md` 阶段二；未装 pm-skills 时按本节自查即可）。

## 真实交互的下限

全屏页必须是**真能点**的，不是截图：

| 形态 | 至少要真的能用 |
| --- | --- |
| APP / H5 / 小程序 | Tab 切换、底部导航跳转、半屏/抽屉/弹窗开合、表单校验与错误提示、Toast、列表空态/加载态切换 |
| 官网 | FAQ 折叠、Tab 切换、登录方式切换、锚点导航、定价周期切换、留资表单校验 |
| 后台管理 | 侧栏菜单跳转、筛选区交互、表格行操作与二次确认弹窗、分页、Tab 切换、权限隐藏态，**加下面三条 WEB端运营管理系统专项** |

脚手架（Toast / 半屏 / 抽屉 / 模态 / 单选组 / 流程状态机 / 标注）用**零依赖原生 JS** 写一份，所有页面共用同一段内联脚本。

**横滑行的裁切线**：信息流里的横滑行（好友在看、题材 chips、相关推荐…）左右要与页面其余区块对齐同一条竖线，
间距必须写在 **`margin`** 上而不是 `padding` —— `overflow` 裁的是 padding box 外沿，写 padding 时
**静止时首卡对齐、一滑动就越过内容栏右边界**。两端都要验（`scrollLeft=0` 首卡贴左线、滑到底末卡贴右线），
已经嵌在有边距的盒子里的那些则把自己的 padding 清零、别再加 margin。
规则与验证脚本见 `references/pro-rules.md`「横滑行要收进内容栏」。

### 弹窗与浮层：PRD 点名的一个都不能少，且都得点得到

这是设计稿最容易缺的一块 —— 页面都建了，PRD 里点名的弹窗只建了几个代表性的。
两份 PRD 通常各自点名几十个层（后台的「编辑」小节 = 一批表单弹窗；C 端页面清单的「关联浮层」列 = 一批浮层），
**逐个建、逐个接入口**，不许挑。

| 项 | 规格 |
| --- | --- |
| 清单来源 | 后台：各页「编辑 / 危险操作」小节里的每一个表单与确认层。C 端：页面清单「关联浮层」列 —— 注意那一列**会把多个层合并计数**（「麦克风权限层 ×3 态」是 3 层、「通知权限卡」可能含申请卡与拒绝后的弱化条两层），照展开后的数做，不照格子数 |
| 用户触发的层 | 真实入口：表格「操作」列、页面按钮、行内链接。**不许**为了凑数在页面上加一排「打开 XX 弹窗」的按钮 —— 那是工具条，不是产品 UI |
| 自动触发的层 | 注册墙、权限申请卡、一次性动效、系统级权限层这些用户点不出来的，**按真实触发条件在流程里自动弹**（生成器写 `modal(..., auto="first-visit")` → 产物写 `data-auto="first-visit"`，首次进入用 `localStorage` 的 `proto:seen:*` 记标志）；系统级权限用仿真层在真实触发点弹出，「允许 / 拒绝」两个分支各自通向后续页面。复看走产品内合法路径（设置 → 权限管理、退出重进）或工具条的「重置演示进度」。**不许挂帧** |
| 层类型 | 全站收敛成固定几种（底部升起层 / 居中弹层 / 吸底条 / 行内卡 / 遮罩层），别一页一个新形态。每种的关闭方式写进契约：危险操作确认与合规遮罩**点遮罩不关**，其余点遮罩关 |
| 同时只允许一层 | 触发第二层先关第一层。例外要在 PRD 里有明文（如"解锁确认层叠在选集抽屉之上"），不许自行叠 |

**build 后必须跑这段自查，三项都得是 0**：

```bash
python3 - <<'EOF'
import glob, re, io
WALLS = ("index.html", "web-index.html", "admin-index.html")
for f in sorted(glob.glob("*.html")):
    if f in WALLS: continue
    s = io.open(f, encoding="utf-8").read()
    opens  = set(re.findall(r'data-open="([^"]+)"', s))
    ids    = set(re.findall(r'class="(?:modal|scrim)[^"]*" id="([^"]+)"', s))
    auto   = set(re.findall(r'class="(?:modal|scrim)[^"]*" id="([^"]+)" data-auto=', s))
    dead, orphan = opens - ids, ids - opens - auto
    if dead:   print("死按钮", f, dead)     # 有入口没层：点了没反应
    if orphan: print("孤层",  f, orphan)    # 有层没入口也不自动弹：评审永远看不到
    if "data-setframe" in s: print("残留切帧", f)   # 铁律 8：产物里不许有帧开关
EOF
```

**死按钮**比缺层更糟 —— 缺层评审会问，死按钮评审以为做了。
如果某个层由外壳给每页自动挂（例如后台的「申请解密」），把它的 id 加进这段脚本的白名单，别为了消警告给它硬加入口。

### 页面之间要闭环：进得去，也出得来

页面都建了、墙上也点得到，不等于闭环。**逐页检查「进去之后能不能出来」**，
build 后跑这段（三项都必须为空）：

```bash
python3 - <<'EOF'
import glob, re, io, collections
WALLS = {"index.html", "web-index.html", "admin-index.html"}
S = {f: io.open(f, encoding="utf-8").read() for f in glob.glob("*.html")}
out, dead = collections.defaultdict(set), collections.defaultdict(set)
for f, s in S.items():
    for m in re.findall(r'href="([^"]+\.html[^"]*)"', s):
        t = m.split("?")[0].split("#")[0]
        (out[f] if t in S else dead[f]).add(t)
    for m in re.findall(r'data-src="([^"]+\.html[^"]*)"', s):   # 墙内 iframe 的懒挂载
        t = m.split("?")[0]
        if t in S: out[f].add(t)
inn = collections.defaultdict(set)
for a, ts in out.items():
    for t in ts: inn[t].add(a)
print("死链  :", dict(dead) or "无")
print("无入链:", [f for f in S if f not in WALLS and not inn[f]] or "无")   # 评审点不到
print("无出链:", [f for f in S if f not in WALLS and not out[f]] or "无")   # 进去出不来
EOF
```

`data-src` 那一行别漏 —— 墙内 iframe 是懒挂载的，`src` 要等滚动才写上去，
只扫 `href` 会把整墙的页面误判成「无入链」。

**三类实际踩到的断点**（都不是死链，所以只查 `href` 查不出来）：

| 症状 | 长什么样 | 修法 |
| --- | --- | --- |
| 裸图标当返回键 | 顶部返回箭头是 `{icon("back")}` 直接输出的 `<svg>`，**没有 `<a>` 包着** | 包成 `<a href="上一级页面">` 并给 `aria-label` |
| 关闭按钮没去向 | 面板/详情页的关闭按钮是 `<button aria-label="关闭">`，既无 `data-close` 也无 `href` —— 该页整页出链为 0 | 层内的关闭用 `data-close`；**整页就是一个面板**时用 `<a href="来源页">` |
| 主 CTA 不落地 | 登录页的【登录】、引导页的主按钮是纯 `<button>` | 可用态换成 `<a href="登录后的第一屏">`；锁定/加载态保持 `<button disabled>`（这两态本来就不该可点） |

> 产品页**不该**链回评审墙（墙是评审入口不是产品的一部分），回墙靠浏览器返回。
> 所以「出链里不含任何墙」是正常的，不要为了闭环给产品页加一个回墙的按钮。

### WEB端运营管理系统专项（三条，缺一即不合格）

**1. 顶栏三件套必须真能点开**

| 入口 | 展开内容 | 点击行为 |
| --- | --- | --- |
| **通知铃铛** | 下拉列**待办型**消息，不是流水日志：交易失败率飙升 / 高危风控预警 / 成就审核超时 / 紧急工单 / 解密审批 / 退款复核 | 每条**直达对应模块**（跳到该模块页面，不是只关掉下拉） |
| **账号区** | 个人信息、修改密码、我的权限、我的操作日志、退出登录 | 五项都要在，退出登录放最后并与上面分隔 |
| **全局搜索** | 搜索域写清是 **用户 / 订单 / 工单** 三类 | 输入后给结果态或空态，不能是死输入框 |

铃铛未读数与下拉条数要对得上；条目文案照抄 PRD 的告警口径，别自造指标名。

**2. 抽屉与弹窗的开合契约**

- **怎么开**：点表格「操作」列或页面按钮；不要靠悬停或双击。
- **怎么关**：`Esc` 与**点遮罩**都要关，且关闭按钮同时保留。
- **同时只允许一层**：已开一层时再触发另一层，先关旧的再开新的——禁止抽屉里再叠抽屉、弹窗上再压弹窗。
- 层内的 Tab 切换、筛选芯片、开关、单选组**都要真能切**，状态留在层内；数据是静态 Mock，不接接口。

**3. 敏感数据一律脱敏出稿**

- 钱包地址、联系方式、消息正文**在设计稿里就按脱敏展示**（`0x7a3f…9c21`、`138****6021`、`消息正文已脱敏`），不要先放明文再说"上线会脱敏"。
- 每处脱敏旁保留**「申请解密」审批入口**（点开是审批抽屉：填申请理由 → 提交 → Toast「已提交，等待风控审批」）。
- 标注面板里写明**审计留痕**：谁在什么时候申请了什么、审批人是谁、留痕存哪，并标 PRD 出处。

## 清单反查：设计稿自己必须做到的九条

`HANDOFF.md` 是**写下来**的交付物，这九条是**做出来**的前提 —— 没做到，那份文档只能靠编。
按工程师对接清单逐条反查得出，每条都给了可机检的判据。

### 1 组件八态齐全，且都到得了

每个组件在产物里必须真能呈现八态：默认 · hover · active · focus · disabled · loading · error · selected。
hover / active / focus 走**真实 CSS 伪类**（不是另画一个节点）；disabled / loading / error / selected 由流程或演示数据走到（铁律 8）。
**每类组件至少有一处实例把八态全暴露过**：表单里放一个禁用项、列表里放一条加载中、校验区放一个错误态。
「只画默认态」是设计稿最常见的欠交付 —— 工程师照着写完，一交互就没有样式。

### 2 响应式断点真的重排

官网页面必须在**四个断点**下真重排（KPI 胶囊里那个 `断点 4` 就是它）。断点值写进 `tokens.json` 的 `breakpoint` 组，
每档**写明布局变化**（几栏 → 几栏、导航折成汉堡、侧栏收起），不是只给宽度。
验法：`resize_window` 或浏览器逐档拉过去，看每档都换了布局且无横向滚动。
**H5 另有自己的四档 320 / 375 / 414 / 768**（320 是底线，不许横向滚动），项目含 H5 时这四档也要逐档验。
官网还要**叠栅格线检查**：12 列（内容站）或 24 列（信息密集），最大内容宽 1200–1440。
移动墙（393）与后台墙（1440）是固定画布，不要求断点，但**后台表格必须给窄屏下的横向滚动容器**。
各端断点与栅格的完整规则见 `platform-rules.md` 第 6、7 节。

### 3 动效走令牌，不裸写魔数

时长与缓动全部取自 `tokens.json` 的 `motion` 组（至少三档：`fast 120ms` / `base 200ms` / `slow 320ms`，
各带 `easing`），页面里写 `var(--motion-base)`，**禁止 `transition: .25s` 这类裸数字**。
必须带 `@media (prefers-reduced-motion: reduce)` 降级（位移与缩放归零，只留透明度）。
其余动效规则见 `references/pro-rules.md`「视觉与交互」。

### 4 `tokens.json` 是产物，不是附件

由 build 从 `MASTER.md` 生成，**页面 CSS 变量与它一一对应**（key `color.brand.500` → 变量 `--color-brand-500`）。
八组固定：`color`（含浅深双档）/ `type` / `space` / `radius` / `shadow` / `icon` / `motion` / `breakpoint`。
判据：产物里 `var(--x)` 用到的每个变量都能在 `tokens.json` 里找到来源 —— 找不到就是有人手写了魔数，令牌表必然与实现对不上。

### 5 文案集中管理，页面不写裸中文

所有界面文案进 `_src/copy.py` 的字典（key 即多语言 key，命名 `<页面>.<区块>.<用途>`，如 `login.wallet.timeout`），
页面模板只引 key。`HANDOFF.md` 第 6 节由这份字典导出 —— 这是「产物与文案清单逐字一致」唯一可验的做法，
散落在模板里的中文串迟早和清单漂移。变量文案写成 `共 {n} 条`，占位符保持一致。

### 6 表单字段必带校验规则

每个可输入字段写 `data-rule='{"re":"^1[3-9]\\d{9}$","on":"blur","msg":"请输入 11 位手机号","src":"PRD 6.3.1"}'`：
**正则 + 触发时机（blur / submit / input）+ 错误文案 + 出处**，四样缺一不可，且与标注面板同源。
没有校验的只读展示项写 `readonly`，别留空。

### 7 极限数据必须在演示数据里

每个列表、每个文本位都要有一条**极限样本**：最长标题（顶到截断）、最多条目（触发分页或虚拟列表）、
最大数值（触发千分位或单位换算）、空字符串（触发兜底）。截断规则进 `tokens.json` 的 `type` 组
（`clamp` 行数 + 方式），页面用同一个类实现，不要一页一个写法。
只用"刚好放得下"的假数据出稿，等于把溢出问题留给工程师现场发明规则。

### 8 图标与位图同时导出到 `assets/`

图标在页面里是内联 SVG symbol，build **同时**把每个 symbol 导出成 `assets/icons/<symbol-id>.svg`；
位图给 `@1x` / `@2x` 两档进 `assets/images/`。命名一律 `<类别>-<语义>[@2x].<ext>`（`icon-wallet.svg`、`cover-01@2x.jpg`）。
`HANDOFF.md` 第 7 节写相对路径 —— **不许写「找设计师要」**，交付包里必须真有文件。

### 9 `HANDOFF.md` 第 2–4 节由 `_src/handoff.py` 生成

数据来源写死，避免与产物漂移：第 2 节读 `MASTER.md` + `tokens.json`；第 3 节扫产物的组件类名与状态属性；
第 4 节读 `PAGES` / `GROUPS` 声明 + `flows` + 各页状态矩阵声明。
生成器随包走（`_src/`），改完页面重跑 build，文档跟着变 —— 手维护的那三节必然过期。

### 九条的机检（build 后跑）

```bash
python3 - <<'EOF'
import glob, re, io, json, os
bad = []
tok = json.load(io.open('tokens.json', encoding='utf-8')) if os.path.exists('tokens.json') else None
if tok is None: bad.append('tokens.json 缺失（第 4 条）')
keys = set()
def walk(d, p=''):
    for k, v in d.items():
        walk(v, p + k + '-') if isinstance(v, dict) else keys.add('--' + p + k)
if tok: walk(tok)
for g in ('motion', 'breakpoint'):
    if tok and g not in tok: bad.append('tokens.json 缺 %s 组' % g)
for f in sorted(glob.glob('*.html')):
    s = io.open(f, encoding='utf-8').read()
    miss = {k for k in re.findall(r'var\((--[a-z0-9-]+)\)', s) if k not in keys}
    if miss: bad.append('%s 变量不在 tokens.json：%s（第 4 条）' % (f, sorted(miss)[:5]))
    if re.search(r'transition:[^;]*?[\d.]+m?s', s): bad.append('%s 动效裸写数字（第 3 条）' % f)
    if not re.search(r'prefers-reduced-motion', s): bad.append('%s 无 reduced-motion 降级（第 3 条）' % f)
    for inp in re.findall(r'<input\b[^>]*>', s):
        if 'data-rule=' not in inp and 'readonly' not in inp and 'hidden' not in inp:
            bad.append('%s 有输入框没带 data-rule（第 6 条）' % f); break
print('\n'.join(bad) or 'OK')
EOF
ls assets/icons/*.svg >/dev/null 2>&1 || echo "assets/icons 为空（第 8 条）"
```

## 工程师对接交付清单（`HANDOFF.md`）

只交 HTML 不算交付完 —— 工程师还得问令牌、问状态、问文案、问切图。
**每个设计稿包必须同时交一份 `HANDOFF.md`**，目标是**零追问**。
标注原则：**能给数值不给描述，能给规则不给感觉** —— 「留白大一点」不算交付，`padding: 24px` 才算。

八节固定，缺一节即不合格。**第 2–4 节由 build 从 `MASTER.md` 与 `_src/` 自动生成**（不手维护，避免和产物漂移），
第 1、5–8 节人工补。

### 1 交付信息头

需求名称与版本号 / 设计稿包路径 / PRD 与 SRS 链接（写到章节号）/ 设计师与前端负责人 /
交付日期与更新记录 / 适配范围（APP · H5 · 小程序 · 官网 · 后台）/ **设计基准宽度**（393 / 1280 / 1440）。
存量项目若有多份形态 MASTER，这一节写明各自路径。

### 2 全局基础规范（Design Tokens）

**正文给表，同时落一份 `tokens.json`** 给前端直接吃；两者同源于 `MASTER.md`，不许各写一套（结构见反查第 4 条）。

| 组 | 必须给到的字段 |
| --- | --- |
| 色彩 | 用途 / 令牌名 / 色值 / 透明度 / 使用场景；主色须给 **hover · active · disabled 三档**；浅色与深色主题各一列 |
| 字体 | 层级 / 字号 / 字重 / 行高 / 字间距 / 颜色 / 用途；字体族分中文 · 英文 · 数字（注明是否等宽数字）；**超长文本规则**（截断方式 + 最大行数）|
| 间距布局 | 基础栅格（4 或 8）/ 间距阶梯 / 页面安全边距 / 栅格列数与槽宽 |
| 圆角 · 阴影 · 边框 | 卡片 · 按钮 · 输入框 · 弹窗四档；阴影写全 `x / y / blur / spread / color` |
| 图标 | 尺寸档（16 / 20 / 24 / 32）/ 线宽 / 线性或面性 / 来源与命名 |
| 断点 | Mobile · Tablet · Desktop 的宽度与**布局变化**（不是只给宽度） |

### 3 组件清单

命名与产物里的类名一致。逐个给：组件名 / **复用还是新增**（工程师靠这条判断要不要写新代码，最容易漏）/
变体 / 尺寸（宽高 · 内边距 · 最小最大宽）/ **八态齐全**（默认 · hover · active · focus · disabled · loading · error · selected）/
交互行为 / 动效（时长 ms + 缓动 + 延迟）/ 特殊说明。

**覆盖面照 `design-system.md` 第二节那 30 件五类**：基础 8（Button · Input · Select · Checkbox · Radio · Switch · Tag · Badge）、
导航 5（Navbar · TabBar · Sidebar · Breadcrumb · Steps）、数据 5（Table · List · Card · Statistic · Chart）、
反馈 7（Toast · Modal · Drawer · Popover · Loading · Empty · Skeleton）、
**业务 5**（登录 · 支付 · 上传 · 搜索 · 筛选 —— 这五件是组合件，各占 `FLOWS.md` 一条完整流程，成功与失败分支都要走得到）。

八态不是「文档里列出来」就算，**产物里得真到得了**（反查第 1 条）。

### 4 信息架构、页面与状态矩阵

**先给信息架构**：一张 Mermaid 站点地图（`graph TD`，按一级 / 二级 / 三级分层）+ 一份分级页面清单。
站点地图的节点数必须等于页面清单条数，页面清单条数必须等于产物 HTML 数（平台变体算一条，注明变体数）——
三个数对不上，说明有页面没建、或建了没进架构。

再给页面表，每页一行：页面名 / 前端路由 / 入口来源 / 权限要求 / 产物文件名 / PRD 出处。后面跟一张**状态矩阵**——
七态逐页打勾，**这是最易漏的一块**：

正常 · 加载中（写明骨架屏还是转圈）· 空（文案 + 插图 + 出口按钮）· 错误（网络 / 接口 / 重试）·
无权限 · 部分字段缺失 · 超长超多数据（滚动 / 分页 / 虚拟列表）。

每一态都必须在流程里走得到（铁律 8），所以矩阵里**同时写明走到它的那条演示数据路径**——
这一列与 `FLOWS.md` 对得上，工程师照着就能复现，不必猜。

字段表照 PRD 抄：字段名 / 类型 / 必填 / 默认值 / 格式（日期 · 金额 · 单位）/ 来源。
**前端路由取自 SRS**（PRD 未写路由时以 SRS 为准）；两份都没写的填 `TBD` 并进待确认项，**不许自己编一个**。

### 5 交互细节

触发规则（「输入 3 位实时搜索」「滚到底加载」）/ 表单校验（**正则 + 错误文案 + 触发时机**：失焦 / 提交 / 实时）/
滚动行为（吸顶 · 懒加载 · 分页 · 回顶）/ 手势（滑动删除 · 下拉刷新 · 长按）/
键盘（Tab 顺序 · 快捷键 · 回车提交）/ **动效参数**（时长 ms + easing + 延迟 + 进出场方式）/
防抖节流的频率上限 / Loading 策略（按钮是否禁用、骨架屏还是转圈）。

### 6 文案清单

全部界面文案（**含标点与大小写**）/ 多语言 key 命名 / 变量文案（`共 {n} 条`、`剩余 {n} 天`）/
空态 · 错误 · 成功提示 / 按钮用词（「确认」还是「确定」照 PRD 抄）。
**产物里的文案与这份清单必须逐字一致** —— 做法是文案集中在 `_src/copy.py`、本节由它导出（反查第 5 条），不靠人工对齐。

### 7 资源交付

切图（格式 SVG · PNG · WebP / **倍率 @1x · @2x · @3x 三档**（Android 另给 hdpi…xxxhdpi 对应关系）/ 命名规范）/
**能矢量就矢量**（图标一律 SVG，位图才给多倍率）/ **Android 可拉伸背景给 9-patch**（写明拉伸区与内容区）/
图片（尺寸 · 压缩要求 · 占位图 · 圆角处理）/
非系统字体文件 / 图标来源与命名 / 动画（Lottie · GIF · 视频，写明帧率与体积）。
文件放包内 `assets/`（墙内用的位图仍在 `images/`），清单里写相对路径，不写「找设计师要」；导出方式与命名见反查第 8 条。

### 8 协作与验收

标注查看方式（全屏页右下角标注面板）/ 图层与文件命名规范 / 版本号与更新记录 /
改稿怎么通知前端 / **验收标准与允许偏差**（像素级还是 ±2px —— 写死数值，不写「基本一致」）。

### 9 多端适配与平台差异

项目覆盖多端时必写，逐端一段，内容取 `platform-rules.md` 对应节的「必须做到」：

- **原生三端**：导航模式（TabBar / BottomNav / 卡片）· 返回逻辑 · 权限弹窗时机与拒绝后路径 ·
  通知（Snackbar 还是 Toast）· 深色模式 · 折叠屏与平板。每项写明**哪几个页面因此出了多版**。
- **两个小程序**：组件基线（WeUI / Ant Design Mini）· 胶囊避让或导航栏高度 · 分包与首屏 ·
  授权时机与降级 · 支付三态 · 分享卡片规格。
- **H5**：四档断点 · 字体缩放上限 · 安全区 · 横屏结论 · 弱网兜底 · 无原生能力的三条降级（分享 / 支付 / 登录）。
- **官网 / 后台**：栅格与最大宽 · SEO 与性能要点 / 信息密度 · 快捷键 · 多标签页 · **RBAC 三级权限矩阵**。

另交 `CONSISTENCY.md`（≥2 端时必交）：一致性矩阵 + 差异合理性判定 + 改进三件，规格见 `platform-rules.md` 第 9 节。
**判据一句话：说不出平台规范条款或能力限制的差异，一律按冲突处理，必须统一。**

### 高频漏项自查（交付前逐条过，十条全绿才算交付）

- [ ] 1 所有异常 / 空 / 加载状态都有稿，且**都能在流程里走到**（与状态矩阵、`FLOWS.md` 对得上）
- [ ] 2 文案齐全、含标点，产物与 `HANDOFF.md` 第 6 节逐字一致
- [ ] 3 动效都给了**具体时长与缓动曲线**，没有「快一点」「柔和一些」
- [ ] 4 超长文本 / 极限数据有处理规则（截断方式 + 最大行数 + 虚拟列表阈值）
- [ ] 5 组件八态完整，没有只画默认态的组件
- [ ] 6 表单校验规则（正则）与错误文案明确，触发时机写死
- [ ] 7 跳转路由与返回逻辑清晰（与「页面之间要闭环」那段脚本的结果一致）
- [ ] 8 响应式断点写明**布局变化**，不是只给宽度
- [ ] 9 切图命名规范、倍率齐全，文件真的在 `assets/` 里
- [ ] 10 每个组件标了**新增还是复用**

## 一套设计系统，四层内容

设计侧**只有 `ui-ux-pro-max` 一个技能**，链路里它一个人负责四层，不外挂材质皮肤：

| 层 | 内容 | 读哪儿 |
| --- | --- | --- |
| 品牌层 | 色阶与派生态、字阶、间距、圆角阴影、图标与插画、动效原则 | `design-system.md` 一 |
| 组件层 | 30 件五类（含业务五件），每件变体 / 尺寸 / 八态 | `design-system.md` 二 |
| 表面与材质层 | 三种表面（`.t-app` / `.t-web` / `.t-admin`）、材质六条、z 轴契约、双主题与密度、降级三级 | `design-system.md` 四 + `references/surface/` |
| 多端层 | 八端硬规则与跨端一致性审查 | `platform-rules.md` |

材质的**默认参考实现**在 `assets/surface/`（`frosted.css` / `tokens.json` / `glass-tier.js` / `spec-sheet.html`），
直接**内联**进外壳（零依赖铁律），路径用 `resolve_skill ui-ux-pro-max` 解析后取 `assets/surface/`，别硬编码技能库根。
换材质时替换这些文件的内容，材质六条规则不变。

顺序：读 PRD/SRS → 定设计系统（品牌 + 组件 + 表面材质）→ 按端补 `platform-rules.md` → 写 `_src/` 生成器 → build → 自查。

`design-system/<项目slug>/MASTER.md` 已存在就**沿用不覆盖**。设计稿包与母版现在同在 `design-system/<项目slug>/` 下，
所以**包用项目 slug，不带形态后缀**（三张墙同属一个包）。存量项目已按形态分了 slug（`zymix-app` / `zymix-admin`）的**沿用不动**：
包落 `design-system/<项目slug>/`，并在 `HANDOFF.md` 第 1 节写明各形态 MASTER 分别在哪。

## 交付前自查

- [ ] PRD 与 SRS 都已通读；页面清单与文档一致，没有文档里没有的页面，也没有漏 🔴/MVP 模块
- [ ] 真源优先级按本契约执行：内容取自 PRD，仅在 PRD 缺项时取 SRS；冲突处标注面板写明取了哪一份
- [ ] 可见文案按「产物内可见文案」表与「分隔符规则」过一遍：不写"原型"、`<title>` 用全角竖线、字段分隔用中点、一句话的两半不加分隔符
- [ ] 产物在 `design-system/<项目slug>/`；生成器在其 `_src/`；README 写明"手改产物会被覆盖"
- [ ] **多端**（覆盖 ≥2 端时）：平台差异走独立页面与独立卡片、没有切帧；六类差异之外无漂移；
      `CONSISTENCY.md` 已交且每条差异注明依据（平台规范条款 / 能力限制），冲突项已统一；
      多端走查清单逐格 `通过 / 不通过`，无「基本一致」
- [ ] **信息架构**：Mermaid 站点地图节点数 = 分级页面清单条数 = 产物 HTML 数（平台变体计一条并注明变体数）
- [ ] **九条反查全过**：跑「九条的机检」输出 OK；另人工验三条脚本查不了的 ——
      组件八态在产物里逐个到过、官网四个断点逐档拉过且真重排、每个列表都有极限样本（最长标题 / 最多条目 / 最大数值 / 空串）
- [ ] **`HANDOFF.md` 八节齐全**（第 2–4 节由 build 生成，与 `MASTER.md`/产物不漂移），`tokens.json` 已落盘且与 `MASTER.md` 同源；
      末尾「高频漏项自查」十条全绿
- [ ] 随便挑三页双击打开：能渲染、能交互、控制台零报错、无外链请求
- [ ] **页面闭环**：跑上面那段脚本，死链 / 无入链 / 无出链三项都为空；返回箭头、关闭按钮、主 CTA 逐个点过
- [ ] **位图**（用了真实图才查）：`images/` 里每个被引用的文件都存在；`grep 'src="https\?://' *.html` 为空；
      起 `python3 -m http.server` 用真实 HTTP 数一遍 `document.images` 的加载比例（预览面板的 CSP 会让本地 jpg 全破图，别在那里看）；
      墙底位图与压色层按 `data-theme` 分档正确；人像是人工挑过的（无小孩、无搞怪表情）
- [ ] 三张墙齐全（移动 / 官网 / 后台，项目不含某形态时该墙可缺）；移动墙内 APP / H5 / 小程序 分组清楚；卡片数 = 实际页面数；每张卡片图注带 `PRD 章节号 · 文件名`
- [ ] 三种墙的缩放正确：`iframe` 实际渲染宽 = `data-w`，缩放后无横向滚动、无裁切、无空白卡
- [ ] 墙内（iframe）**看不到** devbar 与主题切换；全屏页右下角**看得到**；
      **墙页面自己也没有 devbar**（`grep -c '<div class="devbar"' index.html` 必须是 0，三张墙都验）
- [ ] 每张墙页头都有**出稿口径卡**（通栏、磨砂、常驻正文），标题写 `出稿口径 · 依据 {PRD 文件名}`；
      页面上没有 `.ihead__s` 那句机制说明残留，机制说明在页尾「使用与口径说明」卡里
- [ ] 页头与页尾两张说明卡**同一套玻璃**（底色/描边/blur 取自同一条共享规则，不是各写一份）；
      页头与页尾**各有一层柔光**，两张卡的磨砂都看得出来（糊平色等于没糊）
- [ ] **墙名四处一致**：互跳胶囊 / 页头 badge / 页头 H1 / `<title>` 都是 `移动端APP设计稿` 这一套；H1 里没挂计数
- [ ] KPI 胶囊逐个核对是**实测值**（尤其 `交互流程`：与 build 产物里 `data-flow` 去重起点数一致），没有 PRD 版本/日期胶囊
- [ ] **弹窗与浮层清单逐条点过**：PRD 点名的每一个都建了；跑「死按钮 / 孤层」脚本两项都是 0；
      自动触发的层（注册墙、权限层、一次性动效）都按真实触发条件自动弹（`data-auto`），且有产品内复看路径
- [ ] 与 PRD 对不上的地方**已经改稿**（不是只写标注）：枚举、分档口径、按钮数与去向、二次确认文案的业务后果
- [ ] **流程完整性**：`FLOWS.md` 已生成，并逐条真人走过（成功分支与失败分支都点到终态，中间态真出现）；
      `grep -l 'data-setframe' *.html` 为空、无 `Math.random(`；六类数据态（空 / 加载 / 错误 / 无权限 / 额度用尽 / 已下架）
      各有一条演示数据路径能走到
- [ ] 标注开关能开合、面板逐条带出处；「重置演示进度」点过 —— 首次层（注册墙 / 权限卡 / 一次性动效）能重新走出来
- [ ] **横滑行两端都验过**：静止时首卡贴内容栏左线、滑到底时末卡贴右线；同屏多个横滑行写法一致
      （间距在 `margin` 不在 `padding`；已在有边距盒子里的那些是清零 padding，不是再加 margin）
- [ ] 索引页 `?theme=light` 与 `?theme=dark` 都试过，墙内 iframe 跟随换色；`?lang=en` 不报错
- [ ] 每张墙页头都有**另外两张**墙的互跳胶囊（不自指、无死链），逐个点过去：能到、主题不丢、KPI 行不换行错位
- [ ] 后台墙滚到底：懒挂载生效（不是一次性挂满），滚动不卡
- [ ] 后台专项过一遍：铃铛/账号/全局搜索都点开过且铃铛条目能跳模块；抽屉用 `Esc` 与点遮罩都关得掉、开第二层时旧层自动关；钱包地址与联系方式已脱敏且「申请解密」能提交出 Toast
- [ ] 两个主题下正文对比度 ≥ 4.5:1；`setGlass('off')` 后无残留模糊（见 `references/surface/degradation.md`）

## 目录骨架与一致性要求

三张索引墙固定为 `index.html`（移动端）/ `web-index.html`（官网）/ `admin-index.html`（后台），
页面文件与生成脚本各自成目录。**一套结构贯穿三张墙，不要每张墙另起一套。**

下面几样在三张墙与全屏页之间必须完全一致，写法以本契约正文为准：

| 零件 | 一致性要求 |
| --- | --- |
| 卡片与页头零件 | 卡片、KPI 行、互跳胶囊三张墙共用同一套结构与类名 |
| `.pv__frame` | 墙内 iframe 的尺寸、缩放与裁切规则三张墙同源，只有画布尺寸不同 |
| `fitWall` / `mountWall` | 挂载与懒加载逻辑共用；后台墙靠它做滚动懒挂 |
| `in-frame` 判定 | 唯一决定 devbar 出不出——墙内隐藏、全屏页显示 |
| devbar / annopanel | 结构、样式与开关行为共用，只有内容按页不同 |
