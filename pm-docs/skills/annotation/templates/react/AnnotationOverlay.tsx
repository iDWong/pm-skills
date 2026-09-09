import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnnotationDot } from './AnnotationDot'
import { AnnotationPanel } from './AnnotationPanel'
import { AnnotationEditor } from './AnnotationEditor'
import { useAnnotation } from './useAnnotation'
import { subscribe, unsubscribe } from './annotationTracker'
import type { AnnotationItem, AnnotationCategory, AnnotationContainer } from './types'
import './annotation.css'

const BODY_MODAL_SIGNALS = ['ant-scrolling-effect', 'el-popup-parent--hidden', 'van-overflow-hidden', 't-overflow-hidden', 'overflow-hidden']
const BODY_DRAWER_SIGNALS = ['ant-drawer-open']
const DRAWER_VISIBLE_SELECTORS = ['.ant-drawer-open .ant-drawer-content-wrapper', '.el-drawer__body', '.van-popup--left, .van-popup--right', '.t-drawer__body', '.n-drawer-body-content']
const MODAL_VISIBLE_SELECTORS = ['.ant-modal-wrap:not([style*="display: none"])', '.el-overlay-dialog', '.van-dialog', '.t-dialog__wrap', '.n-modal-container']

const OVERLAY_CLICK_MODAL_SELECTORS = ['.ant-modal-content', '.el-dialog', '.van-dialog', '.t-dialog', '.n-dialog', '[class*="modal-content"]']
const OVERLAY_CLICK_DRAWER_SELECTORS = ['.ant-drawer-body', '.el-drawer__body', '.van-popup', '.t-drawer__body', '.n-drawer-body-content', '[class*="drawer-body"]']

function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const style = window.getComputedStyle(el as HTMLElement)
  return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0
}

export function AnnotationOverlay() {
  const {
    visible, editMode, activeId, annotations, setActiveId,
    addAnnotation, updateAnnotation, removeAnnotation,
    toggleVisible, toggleEditMode,
  } = useAnnotation()

  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fabPos, setFabPos] = useState({ bottom: 24, right: 24 })
  const [fabIdle, setFabIdle] = useState(false)
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorItem, setEditorItem] = useState<AnnotationItem | null>(null)
  const [pendingPosition, setPendingPosition] = useState({ x: 0, y: 0 })
  const [pendingContainer, setPendingContainer] = useState<AnnotationContainer>('page')

  const fabIdleTimerRef = useRef<number | null>(null)
  const fabMovedRef = useRef(false)
  // 新建标注 ID 自增计数器：避免同一毫秒连续添加时 Date.now() 撞 ID
  const idCounterRef = useRef(0)

  const startFabIdleTimer = useCallback(() => {
    if (fabIdleTimerRef.current) clearTimeout(fabIdleTimerRef.current)
    fabIdleTimerRef.current = window.setTimeout(() => setFabIdle(true), 2000)
  }, [])

  // 弹窗/抽屉状态检测
  const checkOverlayState = useCallback(() => {
    const bodyClass = document.body.className || ''
    const bodySignalsDrawer = BODY_DRAWER_SIGNALS.some(c => bodyClass.includes(c))
    const bodySignalsModal = !bodySignalsDrawer && BODY_MODAL_SIGNALS.some(c => bodyClass.includes(c))

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
    setDrawerOpen(bodySignalsDrawer || domFoundDrawer)
    setModalOpen(!bodySignalsDrawer && !domFoundDrawer && (bodySignalsModal || domFoundModal))
  }, [])

  // 快捷键 + 弹窗状态检测（复用全局 tracker 单例，自动 rAF 防抖）
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyU') { e.preventDefault(); toggleEditMode() }
    }
    document.addEventListener('keydown', handleKeydown)
    startFabIdleTimer()

    // 复用全局 tracker 的单例 observer：避免每次 mutation 同步跑重排密集的 checkOverlayState
    checkOverlayState()
    subscribe('__overlay_state__', checkOverlayState)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      if (fabIdleTimerRef.current) clearTimeout(fabIdleTimerRef.current)
      unsubscribe('__overlay_state__')
    }
  }, [toggleEditMode, startFabIdleTimer, checkOverlayState])

  // 点击外部关闭面板
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!activeId) return
      if (editorVisible) return
      const target = e.target as Element
      if (target.closest('.annotation-panel') || target.closest('.annotation-dot') || target.closest('.annotation-fab')) return
      setActiveId('')
    }
    document.addEventListener('click', handleOutsideClick, true)
    return () => document.removeEventListener('click', handleOutsideClick, true)
  }, [activeId, editorVisible, setActiveId])

  // FAB 拖动
  const handleFabDragStart = (e: React.PointerEvent) => {
    fabMovedRef.current = false
    setFabIdle(false)
    if (fabIdleTimerRef.current) clearTimeout(fabIdleTimerRef.current)
    const startX = e.clientX
    const startY = e.clientY
    const startRight = fabPos.right
    const startBottom = fabPos.bottom

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!fabMovedRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) fabMovedRef.current = true
      if (fabMovedRef.current) { ev.preventDefault(); setFabPos({ right: Math.max(8, startRight - dx), bottom: Math.max(8, startBottom - dy) }) }
    }
    const onUp = () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp); startFabIdleTimer() }
    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  const handleFabClick = () => { if (!fabMovedRef.current) toggleVisible() }

  // 标注点交互
  const handleDotClick = (id: string) => setActiveId(activeId === id ? '' : id)
  const handleDotMove = (id: string, pos: { x: number; y: number }) => updateAnnotation(id, { position: pos, type: 'position', selector: '' })

  // 编辑模式点击添加
  const handleAddClick = (e: React.MouseEvent) => {
    setPendingPosition({ x: e.clientX, y: e.clientY })
    setPendingContainer(drawerOpen ? 'drawer' : modalOpen ? 'modal' : 'page')
    setEditorItem(null)
    setEditorVisible(true)
  }

  const openEditor = (id: string) => {
    setEditorItem(annotations.find(a => a.id === id) || null)
    setEditorVisible(true)
  }

  const handleDelete = (id: string) => { removeAnnotation(id); setActiveId('') }

  const handleEditorSave = (data: { title: string; content: string; category: AnnotationCategory; source: string; color: string }) => {
    if (editorItem) {
      updateAnnotation(editorItem.id, data)
    } else {
      const newItem: AnnotationItem = {
        id: `ann-${Date.now()}-${++idCounterRef.current}`,
        type: 'position',
        selector: '',
        position: pendingPosition,
        title: data.title,
        content: data.content,
        category: data.category,
        source: data.source,
        color: data.color || undefined,
        container: pendingContainer !== 'page' ? pendingContainer : undefined,
        createdAt: new Date().toISOString().split('T')[0]
      }
      addAnnotation(newItem)
    }
    setEditorVisible(false)
  }

  // click-layer teleport 目标：多弹窗共存时取第一个匹配会选到隐藏容器，需返回当前可见的浮层容器
  const overlayClickTarget = useMemo(() => {
    const selectors = drawerOpen ? OVERLAY_CLICK_DRAWER_SELECTORS : OVERLAY_CLICK_MODAL_SELECTORS
    for (const sel of selectors) {
      const nodes = Array.from(document.querySelectorAll(sel))
      for (const node of nodes) {
        const rect = node.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) return node
      }
    }
    return null
  }, [modalOpen, drawerOpen])

  const activeAnnotation = annotations.find(a => a.id === activeId) || null
  const activeIndex = annotations.findIndex(a => a.id === activeId)

  return (
    <div className="annotation-overlay">
      {/* FAB */}
      <div
        className={`annotation-fab ${fabIdle ? 'annotation-fab-idle' : ''}`}
        style={{ bottom: fabPos.bottom, right: fabPos.right }}
        onPointerDown={handleFabDragStart}
        onMouseEnter={() => setFabIdle(false)}
        onMouseLeave={startFabIdleTimer}
        onClick={handleFabClick}
      >
        <span className="fab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </span>
        {annotations.length > 0 && <span className="fab-badge">{annotations.length}</span>}
      </div>

      {/* 标注点 */}
      {visible && annotations.map((ann, idx) => (
        <AnnotationDot
          key={ann.id}
          annotation={ann}
          index={idx}
          isActive={activeId === ann.id}
          editMode={editMode}
          modalOpen={modalOpen}
          drawerOpen={drawerOpen}
          onClick={handleDotClick}
          onMove={handleDotMove}
        />
      ))}

      {/* 详情面板 */}
      {createPortal(
        <AnnotationPanel
          annotation={activeAnnotation}
          index={activeIndex}
          editMode={editMode}
          onClose={() => setActiveId('')}
          onEdit={openEditor}
          onDelete={handleDelete}
        />,
        document.body
      )}

      {/* 编辑模式工具栏 */}
      {editMode && (
        <div className="annotation-toolbar">
          <span className="toolbar-label">标注编辑模式</span>
          <span className="toolbar-hint">点击页面添加标注</span>
          <button className="toolbar-btn toolbar-btn-exit" onClick={toggleEditMode}>退出</button>
        </div>
      )}

      {/* 点击层 */}
      {editMode && !editorVisible && !modalOpen && !drawerOpen && (
        <div className="annotation-click-layer" onClick={handleAddClick} />
      )}
      {editMode && !editorVisible && (modalOpen || drawerOpen) && overlayClickTarget && createPortal(
        <div className="annotation-click-layer annotation-click-layer-inset" onClick={handleAddClick} />,
        overlayClickTarget
      )}

      {/* 编辑器 */}
      {createPortal(
        <AnnotationEditor
          visible={editorVisible}
          editItem={editorItem}
          onSave={handleEditorSave}
          onCancel={() => setEditorVisible(false)}
        />,
        document.body
      )}
    </div>
  )
}
