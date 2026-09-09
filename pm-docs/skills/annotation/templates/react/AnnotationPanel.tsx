import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { AnnotationItem } from './types'

interface AnnotationPanelProps {
  annotation: AnnotationItem | null
  index: number
  editMode: boolean
  onClose: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const categoryMap: Record<string, string> = {
  filter: '筛选条件', field: '字段说明', action: '操作说明', rule: '业务规则', custom: '自定义标注'
}

const MIN_W = 240
const MIN_H = 160

export function AnnotationPanel({ annotation, index, editMode, onClose, onEdit, onDelete }: AnnotationPanelProps) {
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: 60 })
  const [size, setSize] = useState({ w: 320, h: Math.min(500, window.innerHeight - 80) })
  // 移动端判断：窄屏改为底部抽屉式，禁用拖拽/缩放
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 640px)').matches)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // 切换标注时重置位置（仅桌面端）
  useEffect(() => {
    if (isMobile) return
    setPos({ x: window.innerWidth - 340, y: 60 })
    setSize({ w: 320, h: Math.min(500, window.innerHeight - 80) })
  }, [annotation?.id, isMobile])

  // Esc 关闭
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && annotation) onClose()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [annotation, onClose])

  // 拖动（移动端为底部抽屉，禁用拖动）
  const startDrag = (e: React.MouseEvent) => {
    if (isMobile) return
    if ((e.target as Element).closest('button')) return
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    const onMove = (ev: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - size.w, ev.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - startY))
      })
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Resize（移动端为底部抽屉，禁用缩放）
  const startResize = (dir: string, e: React.MouseEvent) => {
    if (isMobile) return
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    const startPX = pos.x
    const startPY = pos.y

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let newW = startW, newH = startH, newX = startPX, newY = startPY
      if (dir.includes('e')) newW = Math.max(MIN_W, startW + dx)
      if (dir.includes('w')) { newW = Math.max(MIN_W, startW - dx); newX = startPX + startW - newW }
      if (dir.includes('s')) newH = Math.max(MIN_H, startH + dy)
      if (dir.includes('n')) { newH = Math.max(MIN_H, startH - dy); newY = startPY + startH - newH }
      setSize({ w: newW, h: newH })
      setPos({ x: newX, y: newY })
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // 渲染内容（兼容 HTML 和 Markdown）
  const renderedContent = useMemo(() => {
    if (!annotation?.content) return ''
    const c = annotation.content
    const raw = (c.trimStart().startsWith('<') || /<[a-z][^>]*>[\s\S]*<\/[a-z]/i.test(c)) ? c : marked.parse(c) as string
    return DOMPurify.sanitize(raw)
  }, [annotation?.content])

  if (!annotation) return null

  // 移动端：底部抽屉式，全宽贴底，高度自适应（最高 70vh）；桌面端：浮动定位
  const panelStyle: React.CSSProperties = isMobile
    ? { left: 0, right: 0, bottom: 0, top: 'auto', width: '100%', maxHeight: '70vh' }
    : { left: pos.x, top: pos.y, width: size.w, height: size.h }

  return (
    <div className="annotation-panel" style={panelStyle}>
      <div className="panel-header" onMouseDown={startDrag}>
        <div className="panel-title">
          <span className="panel-number">{index + 1}</span>
          {annotation.title}
        </div>
        <button className="panel-close" onMouseDown={e => e.stopPropagation()} onClick={onClose}>&times;</button>
      </div>

      <div className="panel-body">
        <div className="panel-meta">
          <span className={`meta-tag meta-tag-${annotation.category}`}>
            {categoryMap[annotation.category] || '标注'}
          </span>
          {annotation.source && <span className="meta-source">{annotation.source}</span>}
        </div>
        <div className="panel-content" dangerouslySetInnerHTML={{ __html: renderedContent }} />
      </div>

      {editMode && (
        <div className="panel-footer">
          <button className="panel-btn" onMouseDown={e => e.stopPropagation()} onClick={() => onEdit(annotation.id)}>编辑</button>
          <button className="panel-btn panel-btn-danger" onMouseDown={e => e.stopPropagation()} onClick={() => onDelete(annotation.id)}>删除</button>
        </div>
      )}

      {['n','s','e','w','ne','nw','se','sw'].map(dir => (
        <div key={dir} className={`resize-handle resize-${dir}`} onMouseDown={e => startResize(dir, e)} />
      ))}
    </div>
  )
}
