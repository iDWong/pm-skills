import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { useLocation, useMatches } from 'react-router-dom'
import type { AnnotationItem, PageAnnotation } from './types'

// 模块级全局状态（跨组件共享）
let _visible = true
let _editMode = false
let _activeId = ''
let _annotations: AnnotationItem[] = []
let _pageTitle = ''

// 快照缓存：保证 useSyncExternalStore 引用稳定
let _snapshot = { visible: _visible, editMode: _editMode, activeId: _activeId, annotations: _annotations, pageTitle: _pageTitle }
const getSnapshot = () => _snapshot

// 订阅机制：通知所有消费者重渲染
const listeners = new Set<() => void>()
const notify = () => {
  _snapshot = { visible: _visible, editMode: _editMode, activeId: _activeId, annotations: _annotations, pageTitle: _pageTitle }
  listeners.forEach(fn => fn())
}
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }

const setVisible = (v: boolean) => { _visible = v; notify() }
const setEditMode = (v: boolean) => { _editMode = v; notify() }
const setActiveId = (v: string) => { _activeId = v; notify() }
const setAnnotations = (v: AnnotationItem[]) => { _annotations = v; notify() }
const setPageTitle = (v: string) => { _pageTitle = v; notify() }

const pathToFileName = (path: string) =>
  path.replace(/^\//, '').replace(/\//g, '-') || 'index'

const routeToFileName = (pathname: string, matches: { pathname: string; id: string }[]): string => {
  if (matches.length === 0) return pathToFileName(pathname)
  const lastMatch = matches[matches.length - 1]
  const routePath = lastMatch.id || lastMatch.pathname
  const normalized = routePath
    .replace(/^\//, '')
    .replace(/\/:id$/, '-detail')
    .replace(/\/:id\//, '-detail-')
    .replace(/:[^/]+/g, 'detail')
    .replace(/\//g, '-')
  return normalized || 'index'
}

export function useAnnotation() {
  const location = useLocation()
  const matches = useMatches() as { pathname: string; id: string }[]

  // 订阅全局状态变化
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const fileName = routeToFileName(location.pathname, matches)

  const loadAnnotations = useCallback(async () => {
    try {
      const base = import.meta.env.BASE_URL || '/'
      const res = await fetch(`${base}annotations/${fileName}.json?t=${Date.now()}`)
      if (res.ok) {
        const data: PageAnnotation = await res.json()
        setAnnotations(data.annotations || [])
        setPageTitle(data.title || '')
      } else {
        setAnnotations([])
      }
    } catch {
      setAnnotations([])
    }
  }, [fileName])

  const saveAnnotations = useCallback(async () => {
    const data: PageAnnotation = {
      page: fileName,
      title: _pageTitle || fileName,
      updatedAt: new Date().toISOString().split('T')[0],
      annotations: _annotations
    }
    await fetch('/__annotation_save__', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }, [fileName])

  const addAnnotation = useCallback((item: AnnotationItem) => {
    setAnnotations([..._annotations, item])
    setTimeout(saveAnnotations, 0)
  }, [saveAnnotations])

  const updateAnnotation = useCallback((id: string, updates: Partial<AnnotationItem>) => {
    const idx = _annotations.findIndex(a => a.id === id)
    if (idx > -1) {
      const next = [..._annotations]
      next[idx] = { ...next[idx], ...updates }
      setAnnotations(next)
      setTimeout(saveAnnotations, 0)
    }
  }, [saveAnnotations])

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(_annotations.filter(a => a.id !== id))
    setTimeout(saveAnnotations, 0)
  }, [saveAnnotations])

  const toggleVisible = useCallback(() => setVisible(!_visible), [])
  const toggleEditMode = useCallback(() => setEditMode(!_editMode), [])

  // 路由变化时重新加载标注
  useEffect(() => {
    setActiveId('')
    setAnnotations([])
    const timer = setTimeout(loadAnnotations, 400)
    return () => clearTimeout(timer)
  }, [location.pathname, loadAnnotations])

  return {
    visible: snapshot.visible,
    editMode: snapshot.editMode,
    activeId: snapshot.activeId,
    annotations: snapshot.annotations,
    pageTitle: snapshot.pageTitle,
    setActiveId,
    loadAnnotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    toggleVisible,
    toggleEditMode,
  }
}
