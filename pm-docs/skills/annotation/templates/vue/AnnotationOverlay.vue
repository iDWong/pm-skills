<!-- 标注覆盖层：全局挂载，整合标注点、详情面板、编辑器 -->
<template>
  <div class="annotation-overlay">
    <!-- 浮动控制按钮（可拖动，鼠标离开后半透明） -->
    <div
      class="annotation-fab"
      :class="{ 'annotation-fab-idle': fabIdle }"
      :style="{ bottom: fabPos.bottom + 'px', right: fabPos.right + 'px' }"
      @pointerdown.stop="handleFabDragStart"
      @mouseenter="fabIdle = false"
      @mouseleave="startFabIdleTimer"
      @click.stop="handleFabClick"
    >
      <span class="fab-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
        </svg>
      </span>
      <span v-if="annotations.length > 0" class="fab-badge">{{ annotations.length }}</span>
    </div>

    <!-- 标注点：每个 dot 自己决定是否显示及渲染到哪个容器 -->
    <template v-if="visible">
      <AnnotationDot
        v-for="(ann, idx) in annotations"
        :key="ann.id"
        :annotation="ann"
        :index="idx"
        :is-active="activeId === ann.id"
        :edit-mode="editMode"
        :modal-open="modalOpen"
        :drawer-open="drawerOpen"
        @click="handleDotClick"
        @move="handleDotMove"
      />
    </template>

    <!-- 详情面板：teleport 到 body -->
    <Teleport to="body">
      <AnnotationPanel
        :annotation="activeAnnotation"
        :index="activeIndex"
        :edit-mode="editMode"
        @close="activeId = ''"
        @edit="openEditor"
        @delete="handleDelete"
      />
    </Teleport>

    <!-- 编辑模式工具栏 -->
    <div v-if="editMode" class="annotation-toolbar">
      <span class="toolbar-label">标注编辑模式</span>
      <span class="toolbar-hint">点击页面添加标注</span>
      <button class="toolbar-btn toolbar-btn-exit" @click="toggleEditMode">退出</button>
    </div>

    <!-- 点击页面添加标注（编辑模式下）-->
    <!-- 无弹窗/抽屉时：全屏覆盖层，点击任意位置添加标注 -->
    <div
      v-if="editMode && !editorVisible && !modalOpen && !drawerOpen"
      class="annotation-click-layer"
      @click="handleAddClick"
    ></div>
    <!-- 有弹窗时：click-layer teleport 到弹窗内容区，避免遮挡弹窗外的标注点交互 -->
    <Teleport v-if="editMode && !editorVisible && (modalOpen || drawerOpen)" :to="overlayClickTarget || 'body'">
      <div
        class="annotation-click-layer annotation-click-layer-inset"
        @click="handleAddClick"
      ></div>
    </Teleport>

    <!-- 编辑器弹窗：teleport 到 body，避免被 overlay stacking context 限制 -->
    <Teleport to="body">
      <AnnotationEditor
        :visible="editorVisible"
        :edit-item="editorItem"
        @save="handleEditorSave"
        @cancel="editorVisible = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 标注覆盖层组件
 * 全局挂载在 MainLayout 中，提供标注查看和编辑功能
 * 快捷键 Ctrl+Shift+U 切换编辑模式
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AnnotationDot from './AnnotationDot.vue'
import AnnotationPanel from './AnnotationPanel.vue'
import AnnotationEditor from './AnnotationEditor.vue'
import { useAnnotation } from './useAnnotation'
import { subscribe, unsubscribe } from './annotationTracker'
import type { AnnotationItem, AnnotationCategory } from './types'

const {
  visible, editMode, activeId, annotations,
  addAnnotation, updateAnnotation, removeAnnotation,
  toggleVisible, toggleEditMode
} = useAnnotation()

// FAB 位置（距右下角距离，支持拖动）
const fabPos = ref({ bottom: 24, right: 24 })
// FAB 闲置状态（鼠标离开 2s 后半透明）
const fabIdle = ref(false)
let fabIdleTimer: number | null = null

const startFabIdleTimer = () => {
  if (fabIdleTimer) clearTimeout(fabIdleTimer)
  fabIdleTimer = window.setTimeout(() => { fabIdle.value = true }, 2000)
}

// FAB 拖动
let fabMoved = false

const handleFabDragStart = (e: PointerEvent) => {
  fabMoved = false
  fabIdle.value = false
  if (fabIdleTimer) clearTimeout(fabIdleTimer)

  const startX = e.clientX
  const startY = e.clientY
  const startRight = fabPos.value.right
  const startBottom = fabPos.value.bottom

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    if (!fabMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) fabMoved = true
    if (fabMoved) {
      ev.preventDefault()  // 拖动时阻止页面滚动（触屏）
      fabPos.value = {
        right: Math.max(8, startRight - dx),
        bottom: Math.max(8, startBottom - dy)
      }
    }
  }
  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.removeEventListener('pointercancel', onUp)
    startFabIdleTimer()
  }
  document.addEventListener('pointermove', onMove, { passive: false })
  document.addEventListener('pointerup', onUp)
  document.addEventListener('pointercancel', onUp)
}

// 点击 FAB（非拖动时才切换显隐）
const handleFabClick = () => {
  if (!fabMoved) toggleVisible()
}

// 当前选中的标注
const activeAnnotation = computed(() =>
  annotations.value.find(a => a.id === activeId.value) || null
)
const activeIndex = computed(() =>
  annotations.value.findIndex(a => a.id === activeId.value)
)

// 点击标注点
const handleDotClick = (id: string) => {
  activeId.value = activeId.value === id ? '' : id
}

// 编辑模式下 click-layer 的 Teleport 目标（弹窗/抽屉打开时定位到浮层内容区）
const OVERLAY_CLICK_MODAL_SELECTORS = [
  '.ant-modal-content', '.el-dialog', '.van-dialog', '.t-dialog', '.n-dialog',
  '[class*="modal-content"]', '[class*="dialog-content"]'
]
const OVERLAY_CLICK_DRAWER_SELECTORS = [
  '.ant-drawer-body', '.el-drawer__body', '.van-popup', '.t-drawer__body',
  '.n-drawer-body-content', '[class*="drawer-body"]', '[class*="drawer-content"]'
]
// 多弹窗共存时取第一个匹配会选到隐藏容器，需返回当前可见的浮层容器 DOM 元素
const overlayClickTarget = computed<Element | null>(() => {
  void modalOpen.value
  void drawerOpen.value
  const selectors = drawerOpen.value ? OVERLAY_CLICK_DRAWER_SELECTORS : OVERLAY_CLICK_MODAL_SELECTORS
  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel))
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return node
    }
  }
  return null
})

// 拖拽移动标注点：直接存屏幕坐标
const handleDotMove = (id: string, pos: { x: number; y: number }) => {
  updateAnnotation(id, { position: pos, type: 'position', selector: '' })
}

// 编辑器状态
const editorVisible = ref(false)
const editorItem = ref<AnnotationItem | null>(null)
const pendingPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
// 新建标注 ID 自增计数器：避免同一毫秒连续添加时 Date.now() 撞 ID
let idCounter = 0

// 编辑模式下点击页面添加标注
const handleAddClick = (e: MouseEvent) => {
  pendingPosition.value = { x: e.clientX, y: e.clientY }
  // 记录当前容器上下文：弹窗/抽屉打开时新建的标注归属对应容器
  pendingContainer.value = drawerOpen.value ? 'drawer' : modalOpen.value ? 'modal' : 'page'
  editorItem.value = null
  editorVisible.value = true
}

const pendingContainer = ref<'page' | 'modal' | 'drawer'>('page')

// 打开编辑器（编辑已有标注）
const openEditor = (id: string) => {
  editorItem.value = annotations.value.find(a => a.id === id) || null
  editorVisible.value = true
}

// 编辑器保存
const handleEditorSave = (data: { title: string; content: string; category: AnnotationCategory; source: string; color: string }) => {
  if (editorItem.value) {
    updateAnnotation(editorItem.value.id, data)
  } else {
    const newItem: AnnotationItem = {
      id: `ann-${Date.now()}-${++idCounter}`,
      type: 'position',
      selector: '',
      position: pendingPosition.value,
      title: data.title,
      content: data.content,
      category: data.category,
      source: data.source,
      color: data.color || undefined,
      container: pendingContainer.value !== 'page' ? pendingContainer.value : undefined,
      createdAt: new Date().toISOString().split('T')[0]
    }
    addAnnotation(newItem)
  }
  editorVisible.value = false
}

// 删除标注
const handleDelete = (id: string) => {
  removeAnnotation(id)
  activeId.value = ''
}

// 快捷键 Ctrl+Shift+U 切换编辑模式（e.code === 'KeyU'，与键盘布局无关）
const handleKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyU') {
    e.preventDefault()
    toggleEditMode()
  }
}

// 弹窗/抽屉状态检测：随全局 tracker 触发，区分 modal 和 drawer
// 支持 Ant Design（ant-scrolling-effect）和 Element Plus（el-popup-parent--hidden）
const modalOpen = ref(false)
const drawerOpen = ref(false)

/**
 * 通用 overlay 检测：不绑定任何具体 UI 库
 *
 * 策略（双重检测，任一命中即判定为打开）：
 * 1. body class 信号：各 UI 库在弹窗打开时会给 body 加特征 class
 *    - Ant Design Vue: ant-scrolling-effect
 *    - Element Plus: el-popup-parent--hidden
 *    - Vant: van-overflow-hidden
 *    - TDesign: t-overflow-hidden
 * 2. DOM 可见元素检测：在 body 子树中找到可见的弹窗/抽屉容器
 *    - 判断可见：元素有实际尺寸 + opacity > 0 + 不是 mask 遮罩
 *
 * 抽屉优先于弹窗：同时存在时，drawerOpen=true，modalOpen=false
 */

// body class 信号（各 UI 库在弹窗打开时给 body 加的 class）
const BODY_MODAL_SIGNALS = [
  'ant-scrolling-effect',       // Ant Design Vue modal
  'el-popup-parent--hidden',    // Element Plus
  'van-overflow-hidden',        // Vant
  't-overflow-hidden',          // TDesign
  'overflow-hidden',            // 通用（shadcn/ui 等）
]

const BODY_DRAWER_SIGNALS = [
  'ant-drawer-open',            // Ant Design Vue drawer（body 上的标记）
]

// DOM 元素选择器（找到可见元素即判定打开）
const DRAWER_VISIBLE_SELECTORS = [
  '.ant-drawer-open .ant-drawer-content-wrapper',  // Ant Design Vue
  '.el-drawer__body',                               // Element Plus（2.x 抽屉可见时内容区即存在，无 is-visible 类）
  '.van-popup--left, .van-popup--right, .van-popup--top, .van-popup--bottom',  // Vant
  '.t-drawer__body',                                // TDesign
  '.n-drawer-body-content',                         // Naive UI
]

const MODAL_VISIBLE_SELECTORS = [
  '.ant-modal-wrap:not([style*="display: none"])',  // Ant Design Vue
  '.el-overlay-dialog',                              // Element Plus
  '.van-dialog',                                     // Vant
  '.t-dialog__wrap',                                 // TDesign
  '.n-modal-container',                              // Naive UI
]

const isElementVisible = (el: Element): boolean => {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const style = window.getComputedStyle(el as HTMLElement)
  return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0
}

const checkOverlayState = () => {
  const bodyClass = document.body.className || ''

  // 1. body class 信号检测
  const bodySignalsDrawer = BODY_DRAWER_SIGNALS.some(c => bodyClass.includes(c))
  const bodySignalsModal = !bodySignalsDrawer && BODY_MODAL_SIGNALS.some(c => bodyClass.includes(c))

  // 2. DOM 可见元素检测
  let domFoundDrawer = false
  let domFoundModal = false

  for (const sel of DRAWER_VISIBLE_SELECTORS) {
    const el = document.querySelector(sel)
    if (el && isElementVisible(el)) { domFoundDrawer = true; break }
  }

  if (!domFoundDrawer) {
    for (const sel of MODAL_VISIBLE_SELECTORS) {
      const el = document.querySelector(sel)
      if (el && isElementVisible(el)) { domFoundModal = true; break }
    }
  }

  const foundDrawer = bodySignalsDrawer || domFoundDrawer
  const foundModal = !foundDrawer && (bodySignalsModal || domFoundModal)

  drawerOpen.value = foundDrawer
  modalOpen.value = foundModal
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  startFabIdleTimer()
  document.addEventListener('click', handleOutsideClick, true)

  // 复用全局 tracker 的单例 observer：弹窗/抽屉状态检测随 DOM 变化触发，
  // 且自动获得 rAF 防抖（避免每次 mutation 同步跑重排密集的 checkOverlayState）
  checkOverlayState()
  subscribe('__overlay_state__', checkOverlayState)
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (fabIdleTimer) clearTimeout(fabIdleTimer)
  document.removeEventListener('click', handleOutsideClick, true)
  unsubscribe('__overlay_state__')
})

// 点击外部关闭详情面板（标注点、面板本身、编辑器弹窗打开时除外）
const handleOutsideClick = (e: MouseEvent) => {
  if (!activeId.value) return
  if (editorVisible.value) return  // 编辑器弹窗打开时不关闭详情面板
  const target = e.target as Element
  if (
    target.closest('.annotation-panel') ||
    target.closest('.annotation-dot') ||
    target.closest('.annotation-fab')
  ) return
  activeId.value = ''
}
</script>

<style scoped>
/* 覆盖层：fixed 覆盖整个视口，pointer-events: none 不阻断页面交互 */
/* AnnotationDot 的 position: absolute 相对此容器定位，坐标用视口百分比 */
.annotation-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9980;
}

/* 需要响应点击的子元素单独开启 pointer-events */
.annotation-fab,
.annotation-toolbar,
.annotation-click-layer {
  pointer-events: auto;
}

/* 浮动按钮 */
.annotation-fab {
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.3s, transform 0.2s, box-shadow 0.2s;
  user-select: none;
  /* 用指针拖拽，禁用触屏默认手势，否则移动端 FAB 拖不动 */
  touch-action: none;
}

.annotation-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
  opacity: 1 !important;
}

.annotation-fab:active {
  cursor: grabbing;
}

/* 闲置状态：透明度降低，不干扰页面 */
.annotation-fab-idle {
  opacity: 0.25;
}

.fab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.fab-icon svg {
  width: 18px;
  height: 18px;
}

.fab-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #ff4d4f;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

/* 编辑模式工具栏 */
.annotation-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #262626;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9999;
  font-size: 13px;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.toolbar-label {
  font-weight: 600;
  flex-shrink: 0;
  color: #262626;
}

.toolbar-hint {
  color: #8c8c8c;
  font-size: 12px;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-btn {
  padding: 3px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #595959;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.toolbar-btn:first-of-type {
  margin-left: auto;
}

.toolbar-btn:hover {
  background: #f5f5f5;
  border-color: #bfbfbf;
  color: #262626;
}

.toolbar-btn-exit {
  border-color: #ff4d4f;
  color: #ff4d4f;
  background: #fff;
}

.toolbar-btn-exit:hover {
  background: #fff1f0;
  border-color: #ff4d4f;
  color: #ff4d4f;
}

/* 编辑模式点击层（全屏，无弹窗时使用） */
.annotation-click-layer {
  position: fixed;
  inset: 0;
  z-index: 9989;
  cursor: crosshair;
}

/* 弹窗/抽屉内的点击层（相对容器定位，不遮挡弹窗外的标注点） */
.annotation-click-layer-inset {
  position: absolute;
  inset: 0;
  z-index: 1050;
}

/* 移动端适配：窄屏下编辑工具栏底部贴边横向铺满 */
@media (max-width: 640px) {
  .annotation-toolbar {
    bottom: 16px;
    left: 12px;
    right: 12px;
    transform: none;
    max-width: none;
    justify-content: space-between;
    padding: 8px 12px;
    gap: 8px;
    font-size: 12px;
  }
  /* 空间有限，隐藏提示文字，保留标题和操作按钮 */
  .toolbar-hint {
    display: none;
  }
  .annotation-fab {
    width: 36px;
    height: 36px;
  }

  .fab-icon svg {
    width: 16px;
    height: 16px;
  }
}
</style>
