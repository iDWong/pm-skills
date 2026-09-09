# 移动端专业规则与交付检查表

交付 iOS、Android、React Native 或 Flutter 界面前读取本文件。Web/桌面端通用交互规则使用 `quick-reference.md`。

## 移动端特有补充

- iOS 触控区域至少 44×44pt，Android 至少 48×48dp；视觉图标可以更小，但命中区域必须扩展。
- 固定标题栏、底部导航和 CTA 必须避开刘海、状态栏、系统导航栏及手势区域。
- 使用平台原生交互语义和控件；每个区域只保留一个主要手势，避免点击、拖拽与系统返回手势冲突。
- 在手机横屏、平板、Dynamic Type/最大系统字号下验证布局，不能只缩放桌面断点。
- 按压反馈应使用不改变布局边界的颜色、透明度或 elevation 变化。
- 明暗主题需分别测量真实组合后的文字、图标、边框、遮罩和交互状态对比度。

## 横滑行要收进内容栏：用 margin，不是 padding

信息流里的横滑行（好友在看、题材 chips、相关推荐、出场角色…）左右两侧要与页面其余区块
（搜索栏、卡片、区块标题）**对齐到同一条竖线**。写法只有一种是对的：

```css
.hscroll      { display:flex; gap:12px; overflow-x:auto }
.hscroll--col { margin:0 16px; padding:2px 0 4px }   /* ✓ 间距写在 margin 上 */
```

**不能写成 `padding:2px 16px 4px`。** 原因：`overflow` 裁切的是 **padding box 的外沿**，
16px 写成 padding 时那 16px 仍在裁切区域内 —— 卡片会滑进去并显示出来，
于是**静止时首卡对齐、一滑动就越过内容栏右边界**，和上下区块错开一截。
padding 只管得住静止位置，管不住裁切线；margin 是把滚动视口本身收窄，裁切线才落在内容栏上。

判据（两端都要验，不能只看静止态）：

| 状态 | 期望 |
| --- | --- |
| `scrollLeft = 0` | 首个卡片左沿 == 容器左沿 == 内容栏左线 |
| `scrollLeft = scrollWidth - clientWidth` | 末个卡片右沿 == 容器右沿 == 内容栏右线 |

```js
// 逐个横滑容器验一遍；内容没溢出（scrollWidth-clientWidth ≤ 1）时右端判据不适用
for (const h of document.querySelectorAll('.hscroll')) {
  const V = h.getBoundingClientRect(), ov = h.scrollWidth - h.clientWidth;
  h.scrollLeft = 0;
  const l = h.children[0].getBoundingClientRect().left;
  h.scrollLeft = h.scrollWidth;
  const r = h.children[h.children.length - 1].getBoundingClientRect().right;
  console.log(h.className, '左线', Math.abs(l - V.left) < 1.5,
              '右线', ov <= 1 ? '不适用' : Math.abs(r - V.right) < 1.5);
  h.scrollLeft = 0;
}
```

**已经嵌在有边距的盒子里的横滑行不要再加 margin**，把它自己的 `padding-left/right` 清零即可
（半屏内的横滑同理，裁切线交给半屏的内容盒）。一屏里两种写法混用是这类错位最常见的来源 ——
改之前先看清这一行的父级有没有给过边距。

`scroll-snap-align:start` 配 `margin` 版本才对得准；用 padding 版本时 snap 落点会带上那 16px 偏移。

## 交付前检查表

### 流程与适配

- [ ] 仅运行了与当前界面有关的搜索，并复查 `quick-reference.md` 中适用的高优先级规则
- [ ] 已在小屏手机、横屏、较大手机和平板上验证
- [ ] 已启用 reduced motion 和 Dynamic Type/最大系统字号验证
- [ ] 明暗主题分别验证，未从单一主题推断另一主题
- [ ] 所有触控区域满足平台最小尺寸，内容不被安全区域或固定栏遮挡

### 视觉与交互

- [ ] 不使用 emoji 充当结构图标，图标家族、描边和层级一致
- [ ] 使用官方品牌资源，比例和留白正确
- [ ] 按压状态不引起布局偏移或抖动
- [ ] 使用语义主题令牌，没有页面级随意硬编码颜色
- [ ] 可点击元素有清晰反馈，禁用状态清楚且不可交互
- [ ] 动效使用共享的、符合平台和情境的时长令牌
- [ ] 手势区域不存在点击、拖拽、返回滑动等嵌套冲突
- [ ] 横滑行**两端都验过**：静止时首卡贴内容栏左线、滑到底时末卡贴右线（间距写在 `margin` 而非 `padding`，否则一滑动就越界）；同屏多个横滑行写法一致

### 对比度与布局

- [ ] 普通文字在明暗主题下均达到 4.5:1；有意义的图标和控件边界达到 3:1
- [ ] 分隔线、边框和交互状态在两种主题下均可辨认
- [ ] 弹窗/抽屉遮罩基于真实背景测量并保证前景可读
- [ ] 标题栏、底部导航、CTA 和滚动内容遵守安全区域
- [ ] 横向留白随设备和方向自适应，并保持 4/8dp 间距节奏
- [ ] 平板上的长文本行宽仍然易读

### 无障碍

- [ ] 装饰图标从无障碍树隐藏；有意义图标有替代文本
- [ ] 图标按钮有可访问名称，并正确播报选中、按下或展开状态
- [ ] 阅读器焦点顺序与视觉顺序一致，固定层不遮挡焦点
- [ ] 表单有标签、提示和清晰错误；多错误表单保留行内错误并聚焦可链接的错误摘要
- [ ] 颜色不是唯一的信息载体
- [ ] 拖拽和仅滑动交互具有按钮或键盘替代方式
- [ ] 身份验证允许密码管理器和粘贴，并提供非认知型替代方案
- [ ] 自动轮播内容提供暂停/停止控件，并在焦点进入或 reduced motion 下停止
