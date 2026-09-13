# 性能降级与无障碍回退

`backdrop-filter` 在低端移动设备上有真实成本。磨砂必须是**可整体关掉**的。

降级用**令牌重映射**实现 —— 把 `--glass-*` 指回实心值，组件规则一行都不用改。

## 三个入口

| 入口 | 触发 |
|---|---|
| `data-glass="off"` | 运行时按机型判定，或人工指定 |
| `@media (prefers-reduced-transparency: reduce)` | 系统「减少透明度」无障碍设置 |
| `@supports not (backdrop-filter)` | 引擎不支持 |

```css
:root[data-glass="off"], :root[data-glass="off"] > body{ /* 见下方「必须带 body」 */
  --glass-bg:var(--surface);
  --glass-blur:none;
  --glass-border:var(--border-subtle);
  --glass-hl:inset 0 0 0 0 transparent;
  --glass-ctl:var(--surface-soft);
  --glass-ctl-bd:var(--border);
  --glass-blur-sm:none;
  --amb:none;
  --amb-tex:none;
  --material-nav:var(--bg);
  --material-dock:var(--surface);
}
@media (prefers-reduced-transparency: reduce){
  :root:not([data-glass="on"]), :root:not([data-glass="on"]) > body{ /* 同上 */ }
}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  :root, :root > body{ /* 同上 */ }
}
```

`prefers-reduced-transparency` 那条用 `:not([data-glass="on"])`，
这样人工 `setGlass('on')` 仍能覆盖系统设置。

## ⚠️ 必须带 `> body`，否则降级静默失效

**这是本套踩过的最贵的坑。**

很多主题实现会把 `data-theme` **同时打在 `<html>` 和 `<body>` 上**（为了让 `body` 也能被主题选择器命中）。
而主题令牌块通常写作 `.theme[data-theme="light"]` —— 它**同样命中 body**，
于是 body 把玻璃令牌**重新声明了一遍**。

只作用于 `:root` 的降级会被 body 挡在外面：

```
<html> 上 --glass-blur: none        ✓ 降级生效
<body> 上 --glass-blur: blur(20px)  ✗ 卡片从这里继承 → 照旧模糊
```

现象极具迷惑性：**选择器匹配、令牌确实翻了、`getComputedStyle(html)` 读出来就是 `none`**，
但卡片纹丝不动。加 `> body` 一档（特异性 (0,3,1)）才压得住。

排查方法：从目标元素**逐级向上打印** `--glass-blur`，看它在哪一层变回旧值。

```js
let n = document.querySelector('.card');
while (n) {
  console.log(n.tagName, getComputedStyle(n).getPropertyValue('--glass-blur'));
  n = n.parentElement;
}
```

## ⚠️ chrome 的 blur 是写死的字面值

顶栏 / Dock / 遮罩这类元素通常直接写 `backdrop-filter:blur(18px)`，**不走玻璃令牌**，
所以令牌降级碰不到它们。实测降级后仍剩 4 处模糊，
而 nav 与 dock 是**常驻可见**的 —— 留着等于降级没做干净。

按选择器单独关掉：

```css
:root[data-glass="off"] .nav,
:root[data-glass="off"] .dock__inner,
:root[data-glass="off"] .scrim,
:root[data-glass="off"] .ph__tag,
:root[data-glass="off"] .topbar::before{
  -webkit-backdrop-filter:none; backdrop-filter:none;
}
```

## 机型判定

只在**触屏设备**上自动降级。评审 / 演示用的桌面机始终保持完整效果，
免得有人打开原型看到降级版，还以为做坏了。

```js
function glassTier(){
  var saved = null;
  try{ saved = localStorage.getItem('glass'); }catch(e){}
  if(saved === 'on' || saved === 'off') return saved;
  if(!matchMedia('(pointer:coarse)').matches) return 'on';   // 桌面不降级
  var mem = navigator.deviceMemory, cpu = navigator.hardwareConcurrency;
  if(typeof mem === 'number' && mem <= 4) return 'off';
  if(typeof cpu === 'number' && cpu <= 4) return 'off';
  return 'on';
}
```

**注意** `navigator.deviceMemory` 不是标准属性，只有 Chromium 系有；
iOS Safari 读不到，会落到 `hardwareConcurrency` 那条。
上真机前应在目标机型上实测一次判定档位。

完整实现见 `assets/glass-tier.js`（含 `setGlass('on'|'off'|'auto')`）。

## 降级后应该长什么样

- 面与控件转实心、纹理关闭、顶栏 / Dock 材质转实心
- **卡片投影保留** —— 那是主题的分离机制，与玻璃无关

降级态应当看起来是**一套刻意的扁平设计**，而不是坏掉的玻璃设计。
若降级后卡片和背景糊在一起，说明你把投影也一起关了。

## 实测参考（单页，浅色）

| 状态 | 模糊元素数 | 卡片背景 | 对比度最小余量 |
|---|---|---|---|
| `glass=on` | 63 | `rgba(252,251,247,.50)` | 4.5 **+0.11** |
| `glass=off` | **0** | `rgb(251,250,246)` 实心 | 4.5 **+0.50** |

降级态对比度反而更宽松 —— 纹理关了、面变实心。
