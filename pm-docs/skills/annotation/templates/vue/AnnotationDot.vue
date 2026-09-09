<!-- 标注圆点：显示在页面上的编号标记，支持 page/modal/drawer 三种宿主容器 -->
<template>
  <!-- 根据 container 决定渲染到哪个容器 -->
  <Teleport :to="teleportTarget" :disabled="!teleportTarget">
    <!-- position 类型且坐标为 (0,0) 时隐藏，等用户在编辑模式下拖放定位 -->
    <div
      v-if="shouldShow"
      class="annotation-dot"
      :data-annot-id="annotation.id"
      :class="{
        'annotation-dot-active': isActive,
        'annotation-dot-edit': editMode,
        'annotation-dot-dragging': isDragging,
        'annotation-dot-unplaced': isUnplaced
      }"
      :style="{ ...dotStyle, '--dot-color': dotColor }"
      @click.stop="handleClick"
      @pointerdown.stop="handleDragStart"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <span class="dot-number">{{ index + 1 }}</span>

      <!-- hover 摘要气泡 -->
      <div v-if="showTooltip && !isActive" class="dot-tooltip">
        <div class="tooltip-title">{{ annotation.title }}</div>
        <div class="tooltip-category">{{ categoryLabel }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { AnnotationItem } from './types'
import { registerOnElement, unregisterFromElement } from './annotationRegistry'
import { subscribe, unsubscribe } from './annotationTracker'

const props = defineProps<{
  annotation: AnnotationItem
  index: number
  isActive: boolean
  editMode: boolean
  /** 当前是否有弹窗/抽屉打开（由父组件传入） */
  modalOpen: boolean
  drawerOpen: boolean
}>()

const emit = defineEmits<{
  click: [id: string]
  move: [id: string, pos: { x: number; y: number }]
}>()

// ═══ 响应式状态（必须在 computed 使用之前声明）═══
const selectorPos = ref<{ x: number; y: number } | null>(null)
const isDragging = ref(false)
let hasMoved = false
const dragPos = ref<{ x: number; y: number } | null>(null)
const showTooltip = ref(false)
// 当前已登记到的目标元素（用于元素变化时先从旧元素解除登记）
let registeredEl: Element | null = null

const unregisterCurrent = () => {
  if (registeredEl) {
    unregisterFromElement(registeredEl, props.annotation.id)
    registeredEl = null
  }
}

// ═══ 计算属性 ═══
// 宿主容器，默认 page
const container = computed(() => props.annotation.container || 'page')

// 是否为未定位的 position 标注
const isUnplaced = computed(() =>
  props.annotation.type === 'position' &&
  props.annotation.position.x === 0 &&
  props.annotation.position.y === 0
)

// selector 类型但元素还没找到（未完成首次定位）
const isSelectorPending = computed(() =>
  props.annotation.type === 'selector' && selectorPos.value === null
)

/**
 * 当前 dot 的容器是否与页面浮层状态匹配（容器隔离，编辑模式同样生效）：
 * - page 容器：仅在无弹窗/抽屉时显示（弹窗打开时隐藏，避免和弹窗内标注混叠）
 * - modal 容器：仅在弹窗打开时显示
 * - drawer 容器：仅在抽屉打开时显示
 */
const containerMatches = computed(() => {
  if (container.value === 'modal') return props.modalOpen
  if (container.value === 'drawer') return props.drawerOpen
  // page 容器：弹窗或抽屉打开时隐藏
  return !props.modalOpen && !props.drawerOpen
})

/**
 * 决定是否显示：
 * - 容器隔离永远生效（弹窗打开时只显示弹窗内的点，page 点隐藏）——编辑模式也不例外
 * - selector 类型但元素未找到（不在当前 DOM）：任何模式都隐藏，避免跑到 (0,0)
 *   （这是跨容器隔离的关键：炼厂表单标注在人员弹窗里找不到元素，即使都是 modal 容器也不显示）
 * - 编辑模式下，已定位或待拖放(position)的点始终显示（方便调整位置）
 * - 非编辑模式下，未定位的 position 点也隐藏
 */
const shouldShow = computed(() => {
  // 容器不匹配（如弹窗打开时的 page 点）→ 一律隐藏
  if (!containerMatches.value) return false

  // selector 找不到元素 → 任何模式都隐藏（元素不在 DOM，不该显示在 (0,0)）
  if (isSelectorPending.value) return false

  // 编辑模式下，已能定位的点（含待拖放的未定位 position 点）始终显示，方便调整
  if (props.editMode) return true

  if (isUnplaced.value) return false
  return true
})

// Teleport 目标标识（依赖 modalOpen/drawerOpen 变化时重新计算）
const teleportTargetKey = ref(0)

/**
 * 通用浮层容器选择器（按优先级排序，兼容多种 UI 库）
 */
// modal 标注点 Teleport 到弹窗内容区（而非遮罩层），确保 pointer-events 不被遮罩拦截
const MODAL_SELECTORS = [
  '.ant-modal-content',   // Ant Design Vue（内容区，不含遮罩）
  '.el-dialog',           // Element Plus
  '.van-dialog',          // Vant
  '.t-dialog',            // TDesign
  '.n-dialog',            // Naive UI
  '[class*="modal-content"]',
  '[class*="dialog-content"]'
]

const DRAWER_SELECTORS = [
  '.ant-drawer-body',     // Ant Design Vue
  '.el-drawer__body',     // Element Plus
  '.van-popup',           // Vant（用作抽屉时）
  '.t-drawer__body',      // TDesign
  '.n-drawer-body-content',  // Naive UI
  '[class*="drawer-body"]',
  '[class*="drawer-content"]'
]

/**
 * Teleport 目标：根据 container 类型查找可用的浮层容器
 * 多弹窗共存时（如一个页面挂了多个 ElDialog），querySelector 取第一个会选到隐藏的容器，
 * 导致标注点 teleport 进 display:none 的弹窗里整个看不见。
 * 因此返回「当前可见的」浮层容器 DOM 元素（直接给 Teleport :to，避免选择器歧义），而非第一个匹配。
 */
const teleportTarget = computed<Element | null>(() => {
  void teleportTargetKey.value
  void props.modalOpen
  void props.drawerOpen

  const selectors = container.value === 'modal' ? MODAL_SELECTORS
                  : container.value === 'drawer' ? DRAWER_SELECTORS
                  : null

  if (!selectors) return null

  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel))
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      // 跳过隐藏/零尺寸的容器，只命中当前真正展示的弹窗/抽屉
      if (rect.width > 0 && rect.height > 0) return node
    }
  }
  return null
})

const dotColor = computed(() => props.annotation.color || '#1677ff')

const categoryMap: Record<string, string> = {
  filter: '筛选', field: '字段', action: '操作', rule: '规则', custom: '自定义'
}
const categoryLabel = computed(() => categoryMap[props.annotation.category] || props.annotation.category)

// ═══ 拖拽逻辑 ═══
// 编辑模式下拖拽移动（用 Pointer Events 统一鼠标 + 触摸，移动端同样可拖）
const handleDragStart = (e: PointerEvent) => {
  if (!props.editMode) return
  const startX = e.clientX
  const startY = e.clientY
  hasMoved = false

  const onMove = (ev: PointerEvent) => {
    if (!hasMoved && (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3)) {
      isDragging.value = true
      hasMoved = true
    }
    if (hasMoved) {
      ev.preventDefault()  // 拖动时阻止页面滚动（触屏）
      dragPos.value = { x: ev.clientX, y: ev.clientY }
    }
  }
  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.removeEventListener('pointercancel', onUp)
    if (hasMoved && dragPos.value) {
      emit('move', props.annotation.id, { x: dragPos.value.x, y: dragPos.value.y })
    }
    isDragging.value = false
    dragPos.value = null
  }
  document.addEventListener('pointermove', onMove, { passive: false })
  document.addEventListener('pointerup', onUp)
  document.addEventListener('pointercancel', onUp)
}

const handleClick = () => {
  if (!hasMoved) emit('click', props.annotation.id)
}

// ═══ 选择器定位 ═══
/**
 * 正式标注使用注入的 .annot-xxx class 精确定位，selector 永远命中。
 * 以下 fallback 仅在用户手动写标注但 selector 找不到时兜底，使用通用语义 class 匹配。
 * 严禁出现任何 UI 库专属选择器（如 .ant-table、.el-table）。
 */
const getFallbackSelectors = (): string[] => {
  const { category } = props.annotation
  // 通用语义类（项目可能自定义的布局容器）
  if (category === 'filter') return ['[class*="filter"]', '[class*="search"]', 'form:first-of-type']
  if (category === 'action') return ['[class*="action"]', '[class*="toolbar"]', '[class*="operate"]']
  if (category === 'field')  return ['[class*="table"]', '[class*="list"]', '[class*="form"]', 'table', 'form']
  if (category === 'rule')   return ['[class*="table"]', '[class*="filter"]', 'main']
  return []
}

/**
 * 查找元素并更新位置
 * 返回值：true 表示本次找到了稳定元素，可以停止高频轮询
 */
const updateSelectorPos = (): boolean => {
  if (props.annotation.type !== 'selector') return true

  /**
   * 计算标注点位置
   * 策略：贴在目标元素"内部左上角"，点直接覆盖在元素上
   * - 默认：rect 内部左上角（x = rect.left + 2, y = rect.top + 2）
   * - 堆叠错位：同一元素上有多个标注点时，按登记顺序 X 方向累加 28px（按钮通常比较矮，横向错开更好看）
   */
  const computePos = (rect: DOMRect, el: Element): { x: number; y: number } => {
    const INSIDE_GAP = 2
    const STEP = 20

    // 登记到目标元素，拿到在组内的索引（单点 → 0）
    const stackIndex = registerOnElement(el, props.annotation.id)

    // 贴元素内部左上角
    const x = rect.left + INSIDE_GAP + stackIndex * STEP
    const y = rect.top + INSIDE_GAP

    return { x, y }
  }

  // 第一步：直接用 selector 查
  if (props.annotation.selector) {
    // 缓存命中：上次找到的元素仍在 DOM 中 → 复用，跳过 querySelector（每帧省一次查询）
    let el = (registeredEl && document.contains(registeredEl))
      ? (registeredEl as HTMLElement)
      : (document.querySelector(props.annotation.selector) as HTMLElement | null)
    if (el) {
      const rect = el.getBoundingClientRect()
      // 元素 display:none（offsetParent 为 null）或尺寸为 0 → 元素被隐藏，标注点也隐藏
      if (rect.width === 0 && rect.height === 0) {
        unregisterCurrent()
        selectorPos.value = null
        return false
      }
      // 目标元素变化 → 从旧元素解除登记
      if (registeredEl && registeredEl !== el) unregisterCurrent()
      registeredEl = el
      selectorPos.value = computePos(rect, el)
      return true
    }
    // 元素不在 DOM 中：清空位置（可能是路由已切换或条件渲染关闭）
    unregisterCurrent()
    selectorPos.value = null
    return false
  }

  // 第二步：selector 找不到，根据 category + title 动态推断
  const fallbacks = getFallbackSelectors()
  for (const sel of fallbacks) {
    const el = document.querySelector(sel) as HTMLElement | null
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        unregisterCurrent()
        selectorPos.value = null
        continue
      }
      if (registeredEl && registeredEl !== el) unregisterCurrent()
      registeredEl = el
      selectorPos.value = computePos(rect, el)
      return true
    }
  }

  // 都找不到：清空位置，标注点隐藏
  unregisterCurrent()
  selectorPos.value = null
  return false
}

// ═══ 位置样式 ═══
const dotStyle = computed(() => {
  const isInContainer = container.value !== 'page'

  // 拖拽中：跟随鼠标（始终用 fixed）。-9 = 点直径 18px 的半径，让圆心对准鼠标
  if (dragPos.value) {
    return {
      position: 'fixed' as const,
      left: `${dragPos.value.x - 9}px`,
      top: `${dragPos.value.y - 9}px`,
      zIndex: 9999,
      transition: 'none'
    }
  }

  // 选择器定位：selectorPos 已是"圆点左上角坐标"，不需要再减 13
  if (props.annotation.type === 'selector' && selectorPos.value) {
    return {
      position: 'fixed' as const,
      left: `${selectorPos.value.x}px`,
      top: `${selectorPos.value.y}px`,
      zIndex: isInContainer ? 1100 : 9990
    }
  }

  // 手动标注（position 类型）。-9 = 点直径 18px 的半径，让圆心对准坐标点
  return {
    position: 'fixed' as const,
    left: `${props.annotation.position.x - 9}px`,
    top: `${props.annotation.position.y - 9}px`,
    zIndex: isInContainer ? 1100 : 9990
  }
})

// ═══ 定位追踪（订阅全局单例 tracker，不再各自挂监听）═══
let rafId: number | null = null

/**
 * 初始定位：rAF 轮询直到找到稳定元素，然后停止高频轮询
 * 找到后，后续更新交给全局 tracker（scroll/resize/mutation 统一驱动）
 */
const startInitialTracking = () => {
  if (props.annotation.type !== 'selector') return

  let attempts = 0
  const MAX_ATTEMPTS = 300 // 最多轮询 300 帧 ≈ 5 秒

  const tick = () => {
    attempts++
    const found = updateSelectorPos()

    if (found || attempts >= MAX_ATTEMPTS) {
      rafId = null
      return
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

const stopInitialTracking = () => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// 监听 props 变化：annotation 或容器开关状态变化时重新定位
watch(
  () => [props.modalOpen, props.drawerOpen, props.annotation.selector, props.annotation.container],
  () => {
    teleportTargetKey.value++  // 强制 teleportTarget computed 重新求值
    // 容器状态变化可能导致元素位置变化，重新开始轮询
    stopInitialTracking()
    selectorPos.value = null  // 重置为 null，让 shouldShow 正确判断
    nextTick(() => startInitialTracking())
  }
)

onMounted(() => {
  nextTick(() => startInitialTracking())
  // 仅 selector 类型需要随 DOM 变化重新定位；position 类型坐标固定，无需订阅
  if (props.annotation.type === 'selector') {
    subscribe(props.annotation.id, updateSelectorPos)
  }
})

onUnmounted(() => {
  stopInitialTracking()
  unsubscribe(props.annotation.id)
  unregisterCurrent()
})
</script>

<style scoped lang="scss">
.annotation-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dot-color, #1677ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
  pointer-events: auto;
}

.annotation-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
}

.annotation-dot-active {
  --dot-color: #ff4d4f;
  transform: scale(1.1);
}

.annotation-dot-edit {
  cursor: grab;
  /* 编辑模式下用指针拖拽，禁用触屏默认手势（滚动/缩放），否则移动端拖不动 */
  touch-action: none;
}

/* 未定位的 position 标注：编辑模式下固定显示在右下角，虚线边框提示需要拖放 */
.annotation-dot-unplaced {
  position: fixed !important;
  bottom: 80px;
  right: 24px;
  left: auto !important;
  top: auto !important;
  border: 1.5px dashed rgba(255, 255, 255, 0.8) !important;
  opacity: 0.85;
}

.annotation-dot-dragging {
  cursor: grabbing;
  transform: scale(1.15);
}

.dot-number {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.dot-tooltip {
  position: fixed;
  top: -8px;
  left: calc(100% + 8px);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  pointer-events: none;
  z-index: 9999;
}

.tooltip-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.tooltip-category {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
