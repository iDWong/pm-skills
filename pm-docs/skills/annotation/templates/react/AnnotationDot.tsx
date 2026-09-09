import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { AnnotationItem } from './types'
import { registerOnElement, unregisterFromElement } from './annotationRegistry'
import { subscribe, unsubscribe } from './annotationTracker'

interface AnnotationDotProps {
  annotation: AnnotationItem
  index: number
  isActive: boolean
  editMode: boolean
  modalOpen: boolean
  drawerOpen: boolean
  onClick: (id: string) => void
  onMove: (id: string, pos: { x: number; y: number }) => void
}

const MODAL_SELECTORS = [
  '.ant-modal-content', '.el-dialog', '.van-dialog', '.t-dialog', '.n-dialog',
  '[class*="modal-content"]', '[class*="dialog-content"]'
]
const DRAWER_SELECTORS = [
  '.ant-drawer-body', '.el-drawer__body', '.van-popup', '.t-drawer__body',
  '.n-drawer-body-content', '[class*="drawer-body"]', '[class*="drawer-content"]'
]

const categoryMap: Record<string, string> = {
  filter: '筛选', field: '字段', action: '操作', rule: '规则', custom: '自定义'
}

const getFallbackSelectors = (category: string): string[] => {
  if (category === 'filter') return ['[class*="filter"]', '[class*="search"]', 'form:first-of-type']
  if (category === 'action') return ['[class*="action"]', '[class*="toolbar"]', '[class*="operate"]']
  if (category === 'field') return ['[class*="table"]', '[class*="list"]', '[class*="form"]', 'table', 'form']
  if (category === 'rule') return ['[class*="table"]', '[class*="filter"]', 'main']
  return []
}

export function AnnotationDot({ annotation, index, isActive, editMode, modalOpen, drawerOpen, onClick, onMove }: AnnotationDotProps) {
  const [selectorPos, setSelectorPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const registeredElRef = useRef<Element | null>(null)
  const hasMovedRef = useRef(false)
  const dragPosRef = useRef<{ x: number; y: number } | null>(null)
  const rafIdRef = useRef<number | null>(null)

  const container = annotation.container || 'page'
  const isUnplaced = annotation.type === 'position' && annotation.position.x === 0 && annotation.position.y === 0
  const isSelectorPending = annotation.type === 'selector' && selectorPos === null

  // 容器隔离（编辑模式同样生效）：弹窗打开时只显示对应容器的点，page 点隐藏
  const containerMatches = container === 'modal' ? modalOpen
                         : container === 'drawer' ? drawerOpen
                         : !modalOpen && !drawerOpen  // page

  const shouldShow = useMemo(() => {
    // 容器不匹配（如弹窗打开时的 page 点）→ 一律隐藏
    if (!containerMatches) return false
    // selector 找不到元素 → 任何模式都隐藏（元素不在 DOM，不该显示在 (0,0)）
    // 这是跨容器隔离的关键：炼厂表单标注在人员弹窗里找不到元素，即使都是 modal 容器也不显示
    if (isSelectorPending) return false
    // 编辑模式下，已能定位的点（含待拖放的未定位 position 点）始终显示
    if (editMode) return true
    if (isUnplaced) return false
    return true
  }, [containerMatches, editMode, isUnplaced, isSelectorPending])

  // Teleport 目标：多弹窗共存时取第一个匹配会选到隐藏容器，需返回当前可见的浮层容器
  const teleportTarget = useMemo(() => {
    const selectors = container === 'modal' ? MODAL_SELECTORS
                    : container === 'drawer' ? DRAWER_SELECTORS
                    : null
    if (!selectors) return null
    for (const sel of selectors) {
      const nodes = Array.from(document.querySelectorAll(sel))
      for (const node of nodes) {
        const rect = node.getBoundingClientRect()
        // 跳过隐藏/零尺寸容器，只命中当前真正展示的弹窗/抽屉
        if (rect.width > 0 && rect.height > 0) return node as Element
      }
    }
    return null
  }, [container, modalOpen, drawerOpen])

  const dotColor = annotation.color || '#1677ff'

  // 选择器定位
  const updateSelectorPos = useCallback((): boolean => {
    if (annotation.type !== 'selector') return true

    const computePos = (rect: DOMRect, el: Element) => {
      const stackIndex = registerOnElement(el, annotation.id)
      return { x: rect.left + 2 + stackIndex * 20, y: rect.top + 2 }
    }

    if (annotation.selector) {
      // 缓存命中：上次找到的元素仍在 DOM 中 → 复用，跳过 querySelector（每帧省一次查询）
      const el = (registeredElRef.current && document.contains(registeredElRef.current))
        ? registeredElRef.current
        : document.querySelector(annotation.selector)
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) {
          if (registeredElRef.current) { unregisterFromElement(registeredElRef.current, annotation.id); registeredElRef.current = null }
          setSelectorPos(null)
          return false
        }
        if (registeredElRef.current && registeredElRef.current !== el) {
          unregisterFromElement(registeredElRef.current, annotation.id)
        }
        registeredElRef.current = el
        setSelectorPos(computePos(rect, el))
        return true
      }
      if (registeredElRef.current) { unregisterFromElement(registeredElRef.current, annotation.id); registeredElRef.current = null }
      setSelectorPos(null)
      return false
    }

    const fallbacks = getFallbackSelectors(annotation.category)
    for (const sel of fallbacks) {
      const el = document.querySelector(sel)
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        if (registeredElRef.current && registeredElRef.current !== el) {
          unregisterFromElement(registeredElRef.current, annotation.id)
        }
        registeredElRef.current = el
        setSelectorPos(computePos(rect, el))
        return true
      }
    }
    if (registeredElRef.current) { unregisterFromElement(registeredElRef.current, annotation.id); registeredElRef.current = null }
    setSelectorPos(null)
    return false
  }, [annotation.type, annotation.selector, annotation.id, annotation.category])

  // 初始定位轮询 + 订阅全局 tracker（不再各自挂 scroll/resize/MutationObserver）
  useEffect(() => {
    if (annotation.type !== 'selector') return
    let attempts = 0
    const tick = () => {
      attempts++
      const found = updateSelectorPos()
      if (found || attempts >= 300) { rafIdRef.current = null; return }
      rafIdRef.current = requestAnimationFrame(tick)
    }
    rafIdRef.current = requestAnimationFrame(tick)

    // 订阅全局单例：scroll/resize/DOM 变化时由 tracker 统一批量通知
    subscribe(annotation.id, updateSelectorPos)

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
      unsubscribe(annotation.id)
      if (registeredElRef.current) unregisterFromElement(registeredElRef.current, annotation.id)
    }
  }, [annotation.type, annotation.selector, annotation.id, updateSelectorPos])

  // 容器状态变化时重新定位
  useEffect(() => {
    setSelectorPos(null)
    if (annotation.type === 'selector') {
      setTimeout(() => updateSelectorPos(), 50)
    }
  }, [modalOpen, drawerOpen, annotation.container])

  // 拖拽（用 Pointer Events 统一鼠标 + 触摸，移动端同样可拖）
  const handleDragStart = (e: React.PointerEvent) => {
    if (!editMode) return
    const startX = e.clientX
    const startY = e.clientY
    hasMovedRef.current = false
    dragPosRef.current = null

    const onPointerMove = (ev: PointerEvent) => {
      if (!hasMovedRef.current && (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3)) {
        setIsDragging(true)
        hasMovedRef.current = true
      }
      if (hasMovedRef.current) {
        ev.preventDefault()  // 拖动时阻止页面滚动（触屏）
        const pos = { x: ev.clientX, y: ev.clientY }
        dragPosRef.current = pos
        setDragPos(pos)
      }
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      if (hasMovedRef.current && dragPosRef.current) onMove(annotation.id, dragPosRef.current)
      setIsDragging(false)
      setDragPos(null)
      dragPosRef.current = null
    }
    document.addEventListener('pointermove', onPointerMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  const handleClick = () => { if (!hasMovedRef.current) onClick(annotation.id) }

  // 位置样式
  const dotStyle = useMemo((): React.CSSProperties => {
    const isInContainer = container !== 'page'
    if (dragPos) return { position: 'fixed', left: dragPos.x - 9, top: dragPos.y - 9, zIndex: 9999, transition: 'none' }
    if (annotation.type === 'selector' && selectorPos) {
      return { position: 'fixed', left: selectorPos.x, top: selectorPos.y, zIndex: isInContainer ? 1100 : 9990 }
    }
    return { position: 'fixed', left: annotation.position.x - 9, top: annotation.position.y - 9, zIndex: isInContainer ? 1100 : 9990 }
  }, [dragPos, annotation.type, selectorPos, annotation.position, container])

  if (!shouldShow) return null

  const className = [
    'annotation-dot',
    isActive && 'annotation-dot-active',
    editMode && 'annotation-dot-edit',
    isDragging && 'annotation-dot-dragging',
    isUnplaced && 'annotation-dot-unplaced',
  ].filter(Boolean).join(' ')

  const dot = (
    <div
      className={className}
      data-annot-id={annotation.id}
      style={{ ...dotStyle, '--dot-color': dotColor } as React.CSSProperties}
      onClick={handleClick}
      onPointerDown={handleDragStart}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="dot-number">{index + 1}</span>
      {showTooltip && !isActive && (
        <div className="dot-tooltip">
          <div className="tooltip-title">{annotation.title}</div>
          <div className="tooltip-category">{categoryMap[annotation.category] || annotation.category}</div>
        </div>
      )}
    </div>
  )

  if (teleportTarget) return createPortal(dot, teleportTarget)
  return dot
}
