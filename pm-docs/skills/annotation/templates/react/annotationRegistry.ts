/**
 * 标注点登记表：跟踪每个目标元素上挂载了哪些标注点（按注册顺序）
 * 目的：同一目标元素有多个标注点时，按顺序给每个点分配索引，
 *      AnnotationDot 内据此对 Y 方向做 28px 错位，避免重叠。
 * 跨组件实例共享，用 WeakMap 避免内存泄漏。
 */
const elementRegistry = new WeakMap<Element, string[]>()

/** 将 annotId 登记到目标元素上，返回其在组内的索引（0-based） */
export function registerOnElement(el: Element, annotId: string): number {
  let list = elementRegistry.get(el)
  if (!list) {
    list = []
    elementRegistry.set(el, list)
  }
  let idx = list.indexOf(annotId)
  if (idx < 0) {
    list.push(annotId)
    idx = list.length - 1
  }
  return idx
}

/** 从目标元素的登记表中移除 annotId */
export function unregisterFromElement(el: Element, annotId: string): void {
  const list = elementRegistry.get(el)
  if (!list) return
  const i = list.indexOf(annotId)
  if (i >= 0) list.splice(i, 1)
}
