# UI/UX设计稿交付：PRD/SRS → `Prototype/`

本文件是**跨宿主唯一权威契约**。`ui-ux-pro-max`（设计智能）与
`ui-frosted-gradient-clear-sleeve`（材质皮肤）在"根据 PRD/SRS 出设计稿"这件事上都读它，
`pm-prd-spec` / `req-doc` 交付后路由到它。目录骨架与一致性要求见文末。

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
2. **落盘 `Prototype/<项目slug>/`**（项目根下；目录不存在先 `mkdir -p`）。不要落 `pages/`、`docs/`、`dist/`。
3. **每页零依赖独立 HTML**：CSS/JS 全部内联，不引任何 CDN、不用 ES module `import`、
   不 `fetch` 本地文件——**每一页双击都能直接打开并正常交互**。
   图片有两条合法路径：**内联 SVG / `data:` URI**，或**放进 `images/` 用相对路径引**（见「位图资源」一节）。
   「零依赖」禁的是**运行时的外部请求**，不是禁位图 —— 从 CDN **下载到本地**再相对引用不违反本条，
   判据是 `grep 'src="https\?://' *.html` 必须为空。
4. **必须生成索引页，共三张墙**：移动墙（APP / H5 / 小程序 共用一张）、官网墙、后台墙，规格见下。索引页是评审入口，不是文件列表。
5. **墙内不注入工具条**；出稿帧切换与需求标注开关**只在全屏页**出现，位置固定右下角。
   「只在全屏页」是字面意思：**墙页面自己也不许挂 devbar**，不只是 iframe 里看不见。
   连带后果是墙上不能有任何「要点开关才看得到」的内容 —— 墙的出稿口径必须**常驻正文**，见「页头」一节。
6. **标注面板逐条列出该页规则，每条标明 PRD/SRS 出处**（章节号）。没出处的规则不要写进面板。
7. 形态判定沿用 PRD 的五形态（APP / H5 / 小程序 / 后台管理 / 官网），但**墙只按画布尺寸分三张**：
   三种移动形态画布相同（393×852），共用移动墙，靠卡片分组区分（组头写"APP" / "H5" / "小程序" + PRD 章节号）；
   官网与后台画布不同，各自独立一张。**不要把 1280 或 1440 的页面混进移动墙**，也不要给 H5、小程序各建一张空墙。

## 目录与命名

```
Prototype/<项目slug>/
├── index.html            ← 移动端墙（APP / H5 / 小程序，393×852）
├── web-index.html        ← 官网墙（1280×900）
├── admin-index.html      ← 后台墙（1440×900）
├── app-01-login.html     ← 移动端页面（app- / h5- / mp- 前缀 + 两位序号 + slug）
├── web-home.html         ← 官网页面
├── admin-dashboard.html  ← 后台页面
├── images/               ← 真实位图（封面 / 头像 / 墙底）；文件名纯 ASCII，见「位图资源」一节
└── _src/                 ← 生成器（Python），产物由它构建；下载脚本 fetch_images.py 也在这里
```

- 文件名一律**纯 ASCII 小写连字符**。中文只出现在页面内容、卡片图注与标注面板里。
- **生成器落 `Prototype/<项目slug>/_src/`**，随设计稿包整体迁移；`tools/` 只放 PRD/SRS 阶段的一次性脚本（原型图生成等），两者不要混。
- 根目录 `.html` 是 `python3 _src/build.py` 的产物，**手改会被覆盖**——改动一律落 `_src/` 再 build。
  这句必须写进 `Prototype/<项目slug>/README.md`（设计稿包内那一份），否则下一个人会手改产物。
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
| 条目 | `<b>要点</b> — 说明`，8–10 条。**每条都是评审会真被问到的口径**：页面口径与编号对齐关系、弹窗/浮层数与可达性、红线（零付费点、数值零泄漏之类）、安全区与触控、出稿帧口径、占位资源 |
| 不放什么 | 不放"怎么用这张墙"（挪页尾）、不放 PRD 版本号与设计系统 slug（KPI 行都不配放的东西，这里更不配） |
| 别做成 | 别做成需要开关的浮层，别做成 `annopanel` —— 墙上没有开关可以开它 |

`index_shared.py` 里配一个 `spec(title, items, inhead=True)` 出这块，`head()` 的 `desc`
判一下入参是不是以 `<` 开头：是就原样渲染，否则按老的一行副标题（`.ihead__s`）渲染，两种都留着。

**磨砂底怎么做**（四条，踩过）：

1. 底色用**主题令牌兑透明度**（`color-mix(in srgb, var(--surface) 62%, transparent)`），
   **不要**用纯黑叠透明（`rgba(0,0,0,.22)`）。纯黑底在浅色墙上必须加重到 `.5` 才压得住，
   于是卡内文字得写死成白色、还要为浅色墙单独覆盖一遍——一块卡拖出四条主题覆盖，且两张墙从此不同色。
   走令牌就没有这些：文字沿用 `--text` / `--text-2`，两张墙各自对比度自洽。
   细节见 `ui-frosted-gradient-clear-sleeve/references/pitfalls.md`「二·五」。
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
- 带「N 帧」标记的页面，右下角能切帧、能开标注面板
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
| 移动墙 | `页面 31` / `出稿帧 58` / `视口 393 × 852` / `安全区 顶 44 / 底 34` / `依赖 0` |
| 官网墙 | `页面 N` / `出稿帧 N` / `预览视口 1280 × 900` / `断点 4` / `依赖 0` |
| 后台墙 | `页面 N` / `功能模块 N` / `角色类型 N` / `画布 1440 × 900` / `依赖 0` |

`出稿帧` 是全墙 `frames` 之和（与卡片上的「N 帧」同源）；**`依赖 0` 必须有**——它是「零依赖独立 HTML」这条铁律的自证。

另外两条，都是踩过的：

- **别放 `PRD 20260908 · APP` 这类版本/日期胶囊。** 依据哪份 PRD 已经写在出稿口径卡的标题里，
  KPI 行只留评审会拿来数的数（页面 / 出稿帧 / 弹窗或浮层 / 视口 / 依赖）。
- **每个数都必须是实测值，不能手维护。** `GROUPS` 里那一列「N 帧」写死之后，页面加了帧不会跟着变——
  实际踩到的是墙上写 `出稿帧 141`、产物里数出来 240。改完页面务必回头校准，或者直接从 build 产物里数：

  ```bash
  # 每页的出稿帧数 = 该页 devbar 里 data-setframe 按钮数
  python3 - <<'EOF'
  import glob, re, io
  for f in sorted(glob.glob('*.html')):
      n = len(re.findall(r'class="devbar__btn" data-setframe=', io.open(f, encoding='utf-8').read()))
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
  <div class="pv__cap"><span class="pv__no">01</span><b>登录页</b><em>3 帧</em></div>
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
Prototype/<项目slug>/
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
python3 -m http.server 8932 --directory Prototype/<项目slug>
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
展开态：面板 = 「出稿帧」按钮组 + 「需求标注」开关，顶部一行 caption 写 "出稿帧 · PROTOTYPE ONLY"
```

- **出稿帧切换**：页面里的多态节点写 `data-frame="idle connecting failed"`，按钮写 `data-setframe="connecting"`；
  切帧时给 `body` 打 `data-frame-now`，同帧的遮罩/抽屉/弹窗按 `data-frame-open` 决定是否展开。
  帧命名用业务语义（`idle` / `连接中` / `失败`），不要 `state1/state2`。
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
  它进了 i18n 字典（`'出稿帧 · PROTOTYPE ONLY'`），改了会断英文切换。

#### 分隔符规则（别再逐处拍脑袋）

判据只有一条：**看这个符号两边是不是两个独立字段。**

| 情形 | 怎么写 | 例 |
| --- | --- | --- |
| 两个独立字段，且其中一个是**品牌/线别**（只出现在 `<title>`） | **全角竖线 `｜`**，两侧不留空格 | `01 钱包授权登录｜KiraKira`、`用户管理｜KiraKira 运营后台` |
| 两个独立字段（其余场合） | **中点 ` · `**，两侧各一个空格 | `PRD 6.1.2 · app-01-login.html`（出处 \| 文件名）、`匹配层 · Tab1 / 匹配 FAB`（组名 \| 归属）、`MOBILE APP · PRD 第 6 章`、`White · 白岩`（令牌 \| 中文名）、`出稿帧 · PROTOTYPE ONLY` |
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

## 真实交互的下限

全屏页必须是**真能点**的，不是截图：

| 形态 | 至少要真的能用 |
| --- | --- |
| APP / H5 / 小程序 | Tab 切换、底部导航跳转、半屏/抽屉/弹窗开合、表单校验与错误提示、Toast、列表空态/加载态切换 |
| 官网 | FAQ 折叠、Tab 切换、登录方式切换、锚点导航、定价周期切换、留资表单校验 |
| 后台管理 | 侧栏菜单跳转、筛选区交互、表格行操作与二次确认弹窗、分页、Tab 切换、权限隐藏态，**加下面三条 WEB端运营管理系统专项** |

脚手架（Toast / 半屏 / 抽屉 / 模态 / 单选组 / 出稿帧 / 标注）用**零依赖原生 JS** 写一份，所有页面共用同一段内联脚本。

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
| 自动触发的层 | 注册墙、权限申请卡、一次性动效、系统级权限层这些用户点不出来的，挂**出稿帧**（`modal(..., frame="xxx", open_=True)`），并把帧名加进该页 `frames` 列表。这是它们唯一的可达路径 |
| 层类型 | 全站收敛成固定几种（底部升起层 / 居中弹层 / 吸底条 / 行内卡 / 遮罩层），别一页一个新形态。每种的关闭方式写进契约：危险操作确认与合规遮罩**点遮罩不关**，其余点遮罩关 |
| 同时只允许一层 | 触发第二层先关第一层。例外要在 PRD 里有明文（如"解锁确认层叠在选集抽屉之上"），不许自行叠 |

**build 后必须跑这段自查，两项都得是 0**：

```bash
python3 - <<'EOF'
import glob, re, io
WALLS = ("index.html", "web-index.html", "admin-index.html")
for f in sorted(glob.glob("*.html")):
    if f in WALLS: continue
    s = io.open(f, encoding="utf-8").read()
    opens  = set(re.findall(r'data-open="([^"]+)"', s))
    ids    = set(re.findall(r'class="(?:modal|scrim)[^"]*" id="([^"]+)"', s))
    framed = set(re.findall(r'class="(?:modal|scrim)[^"]*" id="([^"]+)" data-frame=', s))
    dead, orphan = opens - ids, ids - opens - framed
    if dead:   print("死按钮", f, dead)     # 有入口没层：点了没反应
    if orphan: print("孤层",  f, orphan)    # 有层没入口也不挂帧：评审永远看不到
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

## 两个技能怎么配合

| 技能 | 在这条链路里负责 |
| --- | --- |
| `ui-ux-pro-max` | 先出/沿用 `design-system/<slug>/MASTER.md`（`--design-system` + 按形态取 variance/motion/density）；提供配色、字体、UX 规则、图表与图标选择；交付前按 `references/pro-rules.md` 走一遍精修与无障碍检查 |
| `ui-frosted-gradient-clear-sleeve` | 提供三种产品表面（`.t-app` / `.t-web` / `.t-admin`）的玻璃材质、令牌、层级契约与降级；其 `assets/frosted.css`、`assets/tokens.json`、`assets/glass-tier.js` 直接内联进外壳（路径用 `resolve_skill ui-frosted-gradient-clear-sleeve` 解析，别硬编码技能库根） |

顺序：读 PRD/SRS → `ui-ux-pro-max` 定设计系统 → `ui-frosted-gradient-clear-sleeve` 定材质与层级 → 写 `_src/` 生成器 → build → 自查。

`design-system/<slug>/MASTER.md` 已存在就**沿用不覆盖**；同一项目多形态各一份 slug（如 `zymix-app` / `zymix-admin`）。

## 交付前自查

- [ ] PRD 与 SRS 都已通读；页面清单与文档一致，没有文档里没有的页面，也没有漏 🔴/MVP 模块
- [ ] 真源优先级按本契约执行：内容取自 PRD，仅在 PRD 缺项时取 SRS；冲突处标注面板写明取了哪一份
- [ ] 可见文案按「产物内可见文案」表与「分隔符规则」过一遍：不写"原型"、`<title>` 用全角竖线、字段分隔用中点、一句话的两半不加分隔符
- [ ] 产物在 `Prototype/<项目slug>/`；生成器在其 `_src/`；README 写明"手改产物会被覆盖"
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
- [ ] KPI 胶囊逐个核对是**实测值**（尤其 `出稿帧`：与 build 产物里 `data-setframe` 按钮数一致），没有 PRD 版本/日期胶囊
- [ ] **弹窗与浮层清单逐条点过**：PRD 点名的每一个都建了；跑「死按钮 / 孤层」脚本两项都是 0；
      自动触发的层（注册墙、权限层、一次性动效）都挂在出稿帧上，帧名进了该页 `frames`
- [ ] 与 PRD 对不上的地方**已经改稿**（不是只写标注）：枚举、分档口径、按钮数与去向、二次确认文案的业务后果
- [ ] 出稿帧按钮逐个点过，每帧都有对应节点；标注开关能开合，面板逐条带出处
- [ ] **横滑行两端都验过**：静止时首卡贴内容栏左线、滑到底时末卡贴右线；同屏多个横滑行写法一致
      （间距在 `margin` 不在 `padding`；已在有边距盒子里的那些是清零 padding，不是再加 margin）
- [ ] 索引页 `?theme=light` 与 `?theme=dark` 都试过，墙内 iframe 跟随换色；`?lang=en` 不报错
- [ ] 每张墙页头都有**另外两张**墙的互跳胶囊（不自指、无死链），逐个点过去：能到、主题不丢、KPI 行不换行错位
- [ ] 后台墙滚到底：懒挂载生效（不是一次性挂满），滚动不卡
- [ ] 后台专项过一遍：铃铛/账号/全局搜索都点开过且铃铛条目能跳模块；抽屉用 `Esc` 与点遮罩都关得掉、开第二层时旧层自动关；钱包地址与联系方式已脱敏且「申请解密」能提交出 Toast
- [ ] 两个主题下正文对比度 ≥ 4.5:1；`setGlass('off')` 后无残留模糊（见 `ui-frosted-gradient-clear-sleeve/references/degradation.md`）

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
