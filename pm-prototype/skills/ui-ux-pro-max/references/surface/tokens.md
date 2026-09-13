# 令牌全表

玻璃令牌**引用**底层表面令牌（`--surface` / `--surface-soft` / `--bg` / `--border` / `--border-subtle`），
所以它可以套在任何已有主题之上，降级时只需把它们指回实心值。

## 玻璃材质

| 令牌 | 深色 | 浅色 | 降级态 |
|---|---|---|---|
| `--glass-bg` | `rgba(30,30,30,.55)` | `rgba(252,251,247,.50)` | `var(--surface)` |
| `--glass-blur` | `blur(22px) saturate(1.35)` | `blur(20px) saturate(1.6) brightness(1.02)` | `none` |
| `--glass-border` | `rgba(255,255,255,.09)` | `rgba(43,42,38,.09)` | `var(--border-subtle)` |
| `--glass-hl` | `inset 0 1px 0 rgba(255,255,255,.05)` | `inset 0 1px 0 rgba(255,255,255,.85)` | `inset 0 0 0 0 transparent` |
| `--glass-ctl` | `rgba(255,255,255,.055)` | `rgba(255,255,255,.46)` | `var(--surface-soft)` |
| `--glass-ctl-bd` | `rgba(255,255,255,.12)` | `rgba(43,42,38,.11)` | `var(--border)` |
| `--glass-blur-sm` | `blur(10px) saturate(1.2)` | `blur(9px) saturate(1.4) brightness(1.02)` | `none` |

**浅色为什么多一个 `brightness(1.02)`**：浅色底本身就亮，只加 `saturate` 会让面发闷；
抬 2% 亮度让玻璃「透」起来。深色不需要。

**浅色 `--glass-hl` 高达 .85**：浅色玻璃的顶边高光要接近纯白才看得出来，
深色只要 .05 —— 这不是笔误，是两种底色下高光的可见阈值差异。

## 画布折射纹理

磨砂的可见性完全依赖这一层。**不要用大色斑光晕代替**（见 `pitfalls.md`）。

| 令牌 | 深色 | 浅色 | 降级态 |
|---|---|---|---|
| `--amb-tex` | `repeating-linear-gradient(45deg, rgba(255,255,255,.035) 0 1.5px, transparent 1.5px 7px)` | `repeating-linear-gradient(45deg, rgba(43,42,38,.05) 0 1.5px, transparent 1.5px 7px)` | `none` |

用法：铺在**滚动容器的背景板**上（不是滚动层本身），卡片滑过时磨砂才会跟着变化。

```css
.screen{ background-color:var(--bg); background-image:var(--amb-tex) }
.view  { background:transparent; overflow-y:auto }   /* 滚动层透明，透出下面的纹理 */
```

长页面（官网那种）用 `background-attachment:fixed`，纹理不随滚动跑掉。

**纹理幅度不能贪大**。浅色曾用过「墨 .085 + 80% 白条」的双色纹，
画布被拉成明显条纹，且把三阶文字压到 **3.97:1**。现值是单道极淡墨纹。

## 材质条（顶栏 / Dock）

这类 chrome 自带半透明 + blur，降级时要一并转实心 ——
没有模糊的半透明只会让滚动内容在栏后拖出一片脏影。

| 令牌 | 深色 | 浅色 | 降级态 |
|---|---|---|---|
| `--material-nav` | `rgba(10,10,10,.86)` | `rgba(243,242,238,.88)` | `var(--bg)` |
| `--material-dock` | `rgba(26,26,26,.95)` | `rgba(251,250,246,.95)` | `var(--surface)` |

## 卡片投影（**不属于玻璃，降级时保留**）

投影是主题的「浮起来」分离机制，与玻璃无关。降级后靠它维持卡片边界。

| 令牌 | 深色 | 浅色 |
|---|---|---|
| `--sh-card` | `0 20px 25px -5px rgb(0 0 0/.35), 0 8px 10px -6px rgb(0 0 0/.30)` | `0 10px 28px rgba(43,42,38,.08), 0 2px 6px rgba(43,42,38,.05)` |

## 底层表面令牌（本套的参考值）

| 令牌 | 深色 | 浅色 |
|---|---|---|
| `--bg` | `#0A0A0A` | `#F3F2EE` |
| `--surface` | `#1A1A1A` | `#FBFAF6` |
| `--surface-soft` | `#121212` | `#F2EEE8` |
| `--border` | `rgba(255,255,255,.10)` | `#D8D7D3` |
| `--border-subtle` | `rgba(255,255,255,.05)` | `#D5D5CB` |

## 中性阶（被磨砂压过一轮的结果）

半透明 + 纹理会吃掉对比度余量。这两个值是**实测反推**出来的，不是设计偏好：

| 令牌 | 深色 | 浅色 | 说明 |
|---|---|---|---|
| `--text-3` | `#8E97A3` | `#67665C` | 浅色比无纹理时深一档 |
| `--text-inactive` | `#838C99` | `#67665C` | |

浅色三阶在**纯色底**上可以是 `#6E6D63`（4.65:1）；
加上斜纹后最暗处掉到 **4.25:1**，故压到 `#67665C`（**4.60:1**）。
若你不用纹理，可以退回 `#6E6D63`。
