/* ============================================================
   Frosted Gradient Clear Sleeve —— 机型判定与人工覆盖
   配合 frosted.css 的 data-glass 入口使用。

   建议在 <head> 内联执行（首屏渲染前打上属性）：
   部分渲染环境下运行时改属性后已代入的 var() 不会失效，
   表现为「令牌翻了但 backdrop-filter 没动」。
   ============================================================ */
(function (w, d) {
  'use strict';

  var KEY = 'glass';

  /* 只在触屏设备上自动降级。
     评审 / 演示用的桌面机始终保持完整效果 ——
     免得有人打开原型看到降级版，还以为做坏了。 */
  function glassTier() {
    var saved = null;
    try { saved = w.localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'on' || saved === 'off') return saved;

    if (!w.matchMedia('(pointer:coarse)').matches) return 'on';

    /* deviceMemory 不是标准属性，只有 Chromium 系有；
       iOS Safari 读不到，会落到 hardwareConcurrency 这条。
       上真机前应在目标机型实测一次判定档位。 */
    var mem = w.navigator.deviceMemory;
    var cpu = w.navigator.hardwareConcurrency;
    if (typeof mem === 'number' && mem <= 4) return 'off';
    if (typeof cpu === 'number' && cpu <= 4) return 'off';
    return 'on';
  }

  function applyGlass() {
    d.documentElement.setAttribute('data-glass', glassTier());
    return d.documentElement.getAttribute('data-glass');
  }

  /* setGlass('off' | 'on' | 'auto') —— 人工覆盖，写入 localStorage。
     'on' 能压过系统的「减少透明度」设置（CSS 侧用了 :not([data-glass="on"])）。 */
  w.setGlass = function (v) {
    try {
      if (v === 'auto') w.localStorage.removeItem(KEY);
      else w.localStorage.setItem(KEY, v === 'off' ? 'off' : 'on');
    } catch (e) {}
    return applyGlass();
  };

  w.getGlass = function () {
    return d.documentElement.getAttribute('data-glass');
  };

  applyGlass();
})(window, document);
