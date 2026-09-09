# 两层结构与豁免清单

## 为什么分两层

一刀切给所有元素挂 22px 模糊，既没必要也很贵。
实测每页模糊元素 **24–63 个**，其中大半径只占 **9–14 个** —— 剩下的都是 chip / 输入框 / 次要按钮。

| 层 | 元素 | 模糊 | 底色 | 描边 |
|---|---|---|---|---|
| **面板层** | `.card` `.ucard` `.post` `.grouplist` `.tbl-wrap` `.kpi` `.sheet` `.dd__panel` `.toast` | `--glass-blur`（22px） | `--glass-bg` | `--glass-border` |
| **控件层** | `.chip` `.input` `.textarea` `.select` `.stat` `.btn--secondary/outline/ghost` 来信气泡 | `--glass-blur-sm`（~10px） | `--glass-ctl` | `--glass-ctl-bd` |

面板层额外挂顶边高光与投影：

```css
.card{
  border:1px solid var(--glass-border);
  box-shadow:var(--sh-card), var(--glass-hl);
}
```

## 必须保持实心的元素（豁免清单）

这些元素的对比度是**靠实心底保证**的，透明化会直接击穿：

```css
.chip[aria-selected="true"], .chip.is-on,
.btn--primary, .btn--danger, .badge,
.msg--out .msg__b{
  -webkit-backdrop-filter:none; backdrop-filter:none;
}
```

判断标准很简单：**这个元素上的文字是不是 `--on-brand` / 白字压色块？**
是的话就不能透明。显式写 `none` 还能省掉一次无谓合成，并避免选中态被背景透出来。

媒体占位（`.ph`）、头像（`.ava`）同样不套玻璃 —— 它们本身就是图像层。

## 嵌套：只留一层模糊

面板套面板会越嵌越浑，内层退回实心：

```css
.card .card, .card .grouplist, .card .tbl-wrap, .grouplist .card{
  -webkit-backdrop-filter:none; backdrop-filter:none;
  background:var(--surface-soft);
}
```

控件层在面板内不需要特殊处理 —— 它模糊的是面板已渲染的内容，结果是一层更亮的着色，不浑。

## 平面主题（不套玻璃的产品线）

同一套组件规则要在「玻璃」和「扁平」两条产品线共用时，**不要写作用域选择器**
（`.t-app .card` 那种，漏一个就串味）。做法是在扁平主题里把玻璃令牌映射回实心值：

```css
.t-admin{
  --glass-bg:var(--surface);
  --glass-blur:none;
  --glass-border:var(--border-subtle);
  --glass-hl:inset 0 0 0 0 transparent;
  --glass-ctl:var(--surface-soft);
  --glass-ctl-bd:var(--border);
  --glass-blur-sm:none;
  --amb-tex:none;
}
```

组件规则一行不用改，扁平主题下算出来就是原来的实心面。
这与「性能降级」用的是同一招，见 `degradation.md`。

## 一个容易忽略的收尾

预览墙 / 缩略图容器这类**没有玻璃面板**的页面，纹理要单独关掉 ——
留着只会把底提亮，白白吃掉对比度余量（实测让某处文字从 4.95 掉到 4.51）。

```css
body.is-index{ background-image:none }
```

注意特异性：若 `body.t-web` 在样式表中更靠后，`body.is-index` 同为 (0,1,1) 会输。
写成 `body.t-web.is-index` 才压得住。
