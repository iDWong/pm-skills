# 陷阱与对比度审计

## 一、磨砂看不见？背后没东西可折射

**模糊一片纯色的结果还是同一片纯色。** 模糊一片平滑渐变的结果，也还是那片渐变。
所以在纯色画布或大色斑光晕上做磨砂，**肉眼完全分辨不出**。

有效的只有**高频细节**：一道 1.5px 斜纹。判据是「纹在卡外清晰、进卡被抹平」。

走过的弯路（别重复）：

1. 先加了三段大色斑 radial 光晕 → 看不出磨砂，只是底色脏了
2. 又加了手机外围两枚 42vw 光球 → 同样无效，纯装饰
3. 最后才是斜纹 → 一次到位

顺带的结论：**大色斑光晕对磨砂零贡献**，如果只为磨砂而加，直接删。

## 二、玻璃底色写错位置 → 语义色被整个盖掉

玻璃底色必须写在组件的**基础规则**里：

```css
.chip{ background:var(--glass-ctl); backdrop-filter:var(--glass-blur-sm) }  /* ✓ */
```

**不要**写成作用域选择器：

```css
.t-app .chip{ background:var(--glass-ctl) }   /* ✗ (0,2,0) */
```

因为 `.chip--ok` / `--warn` / `--danger` / `--marked` 这些语义变体是 (0,1,0)，
作用域写法特异性更高，会把**状态底色整个盖掉** —— 成功 / 警告 / 危险 chip 全变成一样的玻璃底。

同理，降级时也不要用 `.chip{background:var(--surface-soft)}` 这种组件级覆盖去关背景
（它同样会盖掉语义变体），**只能走令牌重映射**。

## 二·五、纯黑叠透明当玻璃 → 一块卡拖出四条主题覆盖

想要「深色玻璃」时最顺手的写法是纯黑叠透明：

```css
.card{ background:rgba(0,0,0,.22); backdrop-filter:blur(20px) }        /* ✗ */
body.t-admin .card{ background:rgba(0,0,0,.5) }                        /* ✗ 越补越多 */
```

它在深色墙上看着没问题，**到浅色墙就开始连锁**：

1. `.22` 在亮底上压不住 → 加重到 `.5`；
2. 底变黑了，卡内文字沿用 `--text`（浅色主题里是深色）**直接看不见** → 把文字写死成 `#fff`；
3. 白字得配白描边、白项目符号、亮一档的 `code` 色 → 又是三条覆盖；
4. 于是这一块卡有了两套底色 + 两套文字色，**和两张墙的主题都不一致**，
   降级态还得单独给一个实底黑（`#141821`）。

正确做法是**用主题令牌兑透明度**，让玻璃跟着主题走：

```css
.card{
  background:color-mix(in srgb, var(--surface) 62%, transparent);
  border:1px solid color-mix(in srgb, var(--border) 70%, transparent);
  -webkit-backdrop-filter:blur(20px) saturate(140%);
          backdrop-filter:blur(20px) saturate(140%);
}
/* 玻璃的厚度感来自顶边一道高光，不是来自纯黑投影 */
.card::after{ content:""; position:absolute; left:0; right:0; top:0; height:1px;
  background:linear-gradient(90deg,transparent,
    color-mix(in srgb, var(--text) 20%, transparent) 22%,
    color-mix(in srgb, var(--text) 20%, transparent) 78%,transparent) }
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .card{ background:var(--surface); border-color:var(--border-subtle) }
}
```

这样卡内文字继续用 `--text` / `--text-2` / `--text-3`，**两张墙各自对比度自洽，零主题覆盖**，
降级也只有一条（回 `--surface` 实底）。

判据：如果你为了让某块玻璃可读，开始给它写第二套文字颜色 —— 那就是底色写错了，不是文字写错了。

**顺带一条：同页多块玻璃要写成一条共享规则。**

```css
.cardA,.cardB{ background:color-mix(…); border:…; backdrop-filter:… }   /* ✓ 一处定义 */
.cardA{ padding:18px 22px }                                            /* 各自只留排版差异 */
.cardB{ padding:20px 24px; font-size:13px }
```

各写一份底色/描边/blur 必然漂 —— 改了一张忘了另一张，同一屏上两块玻璃质感不同。
另外**每块玻璃背后都要有纹理或柔光**：一张在首屏、一张在页尾时，只给首屏铺的话
页尾那块糊的还是平色（见本文第一条）。

## 二·六、玻璃背后放位图 → 少一层压色层，浅色主题直接失守

给磨砂垫一张真实照片是最省事的「有东西可糊」，但**图层顺序错一次就把对比度赔掉**。

错的写法：位图放最上、直接叠在渐变之上。

```css
.wall::before{ background-image:var(--img), <品牌柔光…> }   /* ✗ 图在最上，全强度 */
```

深色主题下看着还行，**换到浅色主题就失守** —— 照片自带的高光会把玻璃卡下的正文顶到 3:1 以下。

对的顺序（CSS 里第一个在最上）：

```css
.wall::before{
  background-image:
    <品牌柔光 1>, <品牌柔光 2>,        /* ① 上：给磨砂制造可糊的层次 */
    var(--scrim),                      /* ② 中：压色层，不能省 */
    var(--img);                        /* ③ 下：位图 cover + center */
  background-size:auto,auto,auto,cover;
}
```

压色层取 **80–92% 不透明度的主题底色**，目的是把合成底色压回设计令牌附近 ——
这样正文色**不用为背景重新调**，两个主题各自沿用原本的 `--text` / `--text-2` 就过 AA。

**位图与压色层都要按主题分档。** 只按「哪一个产品表面」判（例如只判 `.t-admin`）不够 ——
同一张墙自己可能有浅/深两档（`data-theme`），漏判的结果是**浅色档套上了深色图**。

```css
.wall              { --img:url(bg-dark.jpg);  --scrim:linear-gradient(rgba(8,11,20,.80),rgba(8,11,20,.86)) }
.wall[data-theme="light"]{ --img:url(bg-light.jpg); --scrim:linear-gradient(rgba(244,246,252,.86),rgba(244,246,252,.90)) }
```

另外：**位图先模糊过再入库**（下载时就带 `blur`）。墙底要托住玻璃卡与正文，
硬细节会抢读；靠 `backdrop-filter` 现场糊只糊得到卡内那一块，卡外照样是清晰的细节。

顺带一条几何上的坑（不是材质问题但每次都一起踩）：**这层背景要挂视口，不要挂内容元素**。
挂在有 `max-width` 的内容容器上时，宽屏下背景会在容器边缘**突然断掉**；写死高度则一改窗口就露边。
`position:fixed; inset:0` 按定义等于视口，缩放不重排、滚动不位移；光斑尺寸用 `vmax`，
百分比在极端宽高比下会被压成细条。

## 三、`:root` 单独覆盖不够 → 见 `degradation.md` 的 `> body` 一节

主题类同时打在 `<html>` 和 `<body>` 上时，body 会把令牌重新声明一遍。
症状是「令牌翻了但样式没动」。

## 四、对比度审计（半透明界面必须做）

半透明改变了**每一处文字的有效底色**，凭眼睛看不出来。必须实测。

审计器要做对四件事，否则会误报或漏报：

1. **逐层按 alpha 合成**，一直合成到第一个不透明层为止
2. **渐变展开为全部色标取最差值** —— 不能只读 `background-color`
3. **`background-image` 与 `background-color` 都要算**（图在上、色在下）
4. 大字号阈值 3:1、正文 4.5:1，`opacity:0` / `visibility:hidden` 要跳过

### 两个真实的审计器 bug（都只会误报，不会漏报）

**① 渐变色标半透明时提前停止向上找底色。**
`rgba(217,255,0,.1)` 这种薄色标若被当作「见底」，会被算成压在白底上，
深色主题下报出大批假阳性。正确做法：**色标全不透明才算见底**。

**② 元素同时有半透明 `background-image` 和不透明 `background-color` 时丢掉了底色。**
`body` / 滚动背景板正是这种结构（纹理 + 底色）。丢掉底色后回落到白色兜底，
报出 `cr = 1.00` 的荒谬值。正确做法：两者各算一层。

`assets/` 未附审计器 —— 它高度依赖宿主项目结构。上面四条 + 两个 bug 足以自己写一个正确的。

### 审计结论怎么用

不达标时**不要直接调透明度**（那会毁掉磨砂），优先按顺序试：

1. 降低纹理幅度（最先做，收益最大）
2. 压深 / 提亮中性阶一档（实测反推目标值，别猜）
3. 才考虑提高 `--glass-bg` 的 alpha

## 五、中性阶要为磨砂让路，但别让崩

实测轨迹（浅色 `--text-3`，阈值 4.5）：

| 状态 | 值 | 比值 |
|---|---|---|
| 纯色底 | `#6E6D63` | 4.65 ✓ |
| 加大色斑 + 强纹理 | `#6E6D63` | **3.97** ✗ |
| 收敛纹理后 | `#6E6D63` | **4.25** ✗ |
| 最终 | `#67665C` | 4.60 ✓ |

曾一度压到 `#636258`，但那已经和二阶 `#5C5B52` 挤到一起，**阶梯塌了**。
遇到这种情况要回头削纹理，而不是继续压文字。

## 六、运行时切换令牌可能不重算

部分渲染环境下，运行时改属性后已代入的 `var()` 不会失效
（表现为「令牌翻了、`backdrop-filter` 没动」）。

若你的降级依赖运行时切换，务必在目标环境实测一次。
稳妥做法是**在首屏渲染前**（`<head>` 内联脚本）就把 `data-glass` 打上，避免依赖重算。
