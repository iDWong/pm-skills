---
name: ui-frosted-gradient-clear-sleeve
description: "适用于磨砂玻璃、深浅主题、设计令牌、组件与层级体系、响应式表单、导航、仪表盘，以及 backdrop-filter 性能与无障碍降级。触发词：磨砂、玻璃、毛玻璃、透明套层、clear sleeve、glassmorphism、backdrop-filter、设计系统、运营后台、官网、移动端。"
argument-hint: "[要生成的页面/组件，或 tokens|tailwind|swiftui|flutter|check]"
license: MIT
metadata:
  author: Wong
  version: "1.1"
  reviewed: "2026-09-12"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# 透明套层磨砂玻璃

该体系有三种明确区分的产品表面：

| 产品表面 | 视觉语言 | 材质规则 |
|---|---|---|
| 移动端 App（`.t-app`） | 黑布罗／白岩主题、酸绿色强调、圆润触控控件 | 双层磨砂玻璃 |
| 公开官网（`.t-web`） | 与 App 共用令牌，采用编辑式排版与响应式网格 | 面板或固定 Chrome 跨越纹理画布时使用玻璃 |
| 运营管理系统（`.t-admin`） | SemiDesign 浅色体系、蓝色强调、更高的数据控件密度 | 紧凑的单层磨砂玻璃；沿用蓝色状态语义 |

## 先选择正确的产品表面

1. 编写 CSS 前先确认交付的产品表面。
2. App、官网与运营后台的玻璃效果使用 `assets/frosted.css`；组件基础规则只能使用语义化 `--glass-*` 令牌。
3. 运营后台使用 `.t-admin` 专属的紧凑玻璃映射，以及 `references/kirakira-surfaces.md` 中的密度／圆角规则；保持蓝色状态语义，不要加入与信息层级无关的装饰性模糊。
4. 需要 KiraKira 配色、表单、布局、组件形态与 z 层级契约时，阅读 `references/kirakira-surfaces.md`。
5. 仅在需要时阅读对应参考：
   - 令牌数值与对比度安全的中性色阶：`references/tokens.md`
   - 玻璃嵌套、实心豁免与组件角色：`references/layering.md`
   - 运行时／无障碍／不支持引擎的降级：`references/degradation.md`
   - 特异性与对比度审计：`references/pitfalls.md`

## 不可违背的材质规则

1. 在 App／官网玻璃层背后铺设高频纹理。1.5px 斜纹能让模糊可见，平滑光晕不能。
2. 移动端 App 的画布必须叠加 45°、1.5px 的细斜纹，并以语义令牌实现：浅色主题映射为低对比灰纹，深色主题映射为低对比白纹。纹理应位于玻璃层之后，不能影响文字对比度或实心控件。
3. 主按钮、危险按钮、选中 Chip、徽章和发出的消息气泡必须保持不透明。它们承载 `--on-brand` 文字，必须显式使用 `backdrop-filter:none`。
4. 面板模糊与控件模糊必须分层：App／官网面板约 22px、控件约 10px；`.t-admin` 使用更紧凑的面板约 16px、控件约 8px。内层面板应改为实心，而非嵌套大半径模糊。
5. `.t-admin` 的页面、导航、筛选区、卡片、表单控件与表格外框均使用其玻璃令牌；数据单元格、选中态、状态色块、主／危险操作与可读性优先的密集区域保持实心。
6. 低端设备、减少透明度设置与不支持的引擎都通过令牌重映射处理。禁止逐个组件覆盖来关闭玻璃效果。
7. App／官网及后台的扁平降级态必须保留卡片投影；投影是分离机制，不是玻璃效果。

## 实现约定

- 在组件基础规则中使用语义变量（`--glass-bg`、`--glass-ctl`、`--material-nav`、`--brand`）。组件变体中禁止硬编码 `rgba()`。
- 语义变体的特异性必须低于基础规则：`.chip{…}` 有效；`.t-app .chip{…}` 会覆盖 `chip--ok/warn/danger` 变体。
- App 使用最小 44px 的触控控件；官网保留同等可访问触控目标；运营后台使用带 `--glass-ctl` 的紧凑 32px 控件。
- 媒体、头像、选中态和状态色块属于图像／实心层，不属于玻璃层。
- 使用约定的 z 轴层级：内容 0 → 吸顶层 10 → Chrome 16 → FAB 18 → 遮罩 39 → 半屏／弹窗 40 → Toast 60 → 开发工具 80。

## 交付前验证

1. 在两个主题下检查每种文字颜色与其最终合成底色；正文必须达到 WCAG AA 4.5:1。
2. 确认画布纹理在面板外可见、在面板内被模糊；移动端浅色主题为低对比灰色 45° 细斜纹，深色主题为低对比白色 45° 细斜纹。
3. 测试 `setGlass('off')`、减少透明度和无 `backdrop-filter` 的情况：不得残留模糊或半透明 Chrome。
4. 确认 `.t-admin` 的页面、导航、筛选区、卡片、表单控件与表格外框使用紧凑玻璃；数据单元格和蓝色状态语义保持实心、清晰可读。
5. 检查 App 的 375–393px 宽度、官网的 680px／980px 断点，以及后台表格／侧栏溢出。

## 资源

- `assets/frosted.css` — 可复用的 App／官网玻璃层与后台紧凑玻璃映射。
- `assets/tokens.json` — 平台无关的材质、品牌、形态、密度与层级令牌。
- `assets/glass-tier.js` — 触控设备分级与 `setGlass()` 人工覆盖。
- `assets/spec-sheet.html` — 材质视觉样例与降级开关。

## 高保真原型交付（PRD/SRS → `Prototype/`）

被叫来给"根据 PRD/SRS 出的高保真原型"上材质时，**先读跨技能权威契约再动手**：

```bash
for R in "$HOME/.claude/skills" "${CODEX_HOME:-$HOME/.codex}/skills" "$HOME/.cursor/skills"; do
  [ -f "$R/ui-ux-pro-max/references/prototype-delivery.md" ] && { echo "$R/ui-ux-pro-max/references/prototype-delivery.md"; break; }
done
```

本技能在这条链路里只负责**三种产品表面的材质、令牌、层级与降级**（`.t-app` / `.t-web` / `.t-admin`），
`assets/frosted.css`、`assets/tokens.json`、`assets/glass-tier.js` **内联**进原型外壳（原型必须零依赖，不许外链）。
契约规定的落盘位置（`Prototype/<项目slug>/`）、索引预览墙（393×852 / 1280×900 / 1440×900 的 iframe 等比缩放）、
墙内不注入工具条、全屏页右下角出稿帧与需求标注开关，都以那份契约为准，本技能不另立规则。

两条与材质直接相关的坑：

- **预览墙容器没有玻璃面板**，画布纹理要单独关掉（见 `references/layering.md`）——否则缩放后的纹理会摩尔纹。
- 墙内 iframe 是缩放渲染，`backdrop-filter` 成本会乘上卡片数量；后台墙用紧凑玻璃映射，并确认懒挂载生效。
