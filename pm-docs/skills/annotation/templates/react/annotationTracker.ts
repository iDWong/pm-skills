// 标注定位追踪器（全局单例）
// 所有标注点共享一套 MutationObserver + scroll + resize 监听，
// 避免每个 dot 各自挂一套监听导致的性能问题（N 个点 = N×监听）。
// 任何 DOM 变化只触发一次 rAF，批量通知所有订阅者更新位置。

type UpdateFn = () => void

const subscribers = new Map<string, UpdateFn>()

let mutationObserver: MutationObserver | null = null
let scheduled = false
let started = false

/** 单帧防抖：一帧内多次触发只执行一次批量更新 */
function scheduleFlush() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    // 批量调用所有订阅者的位置更新函数
    subscribers.forEach((fn) => fn())
  })
}

/** 首个订阅者加入时启动全局监听 */
function start() {
  if (started) return
  started = true

  window.addEventListener('scroll', scheduleFlush, { passive: true, capture: true })
  window.addEventListener('resize', scheduleFlush, { passive: true })

  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(scheduleFlush)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    })
  }
}

/** 最后一个订阅者离开时停止全局监听，释放资源 */
function stop() {
  if (!started) return
  started = false

  window.removeEventListener('scroll', scheduleFlush, { capture: true })
  window.removeEventListener('resize', scheduleFlush)
  mutationObserver?.disconnect()
  mutationObserver = null
}

/** 订阅位置更新：dot 挂载时调用 */
export function subscribe(id: string, fn: UpdateFn) {
  subscribers.set(id, fn)
  start()
}

/** 取消订阅：dot 卸载时调用 */
export function unsubscribe(id: string) {
  subscribers.delete(id)
  if (subscribers.size === 0) stop()
}

/** 主动触发一次批量更新（如容器开关、内容切换后） */
export function requestUpdate() {
  scheduleFlush()
}
