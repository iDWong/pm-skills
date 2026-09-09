// 标注状态管理
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import type { AnnotationItem, PageAnnotation } from './types'

// 全局状态
const visible = ref(true)
const editMode = ref(false)
const activeId = ref<string>('')
const annotations = ref<AnnotationItem[]>([])
const pageTitle = ref('')

// 路由路径转文件名
// 优先用路由模板路径（去掉动态参数，如 /inspection/task/:id → inspection-task-detail）
// 避免 /inspection/task/1 和 /inspection/task/2 生成不同文件
const pathToFileName = (path: string) =>
  path.replace(/^\//, '').replace(/\//g, '-') || 'index'

const routeToFileName = (route: ReturnType<typeof useRoute>): string => {
  // 取 matched 中最后一个路由的 path（模板路径，含 :id 占位符）
  const matched = route.matched
  if (matched.length === 0) return pathToFileName(route.path)

  const routePath = matched[matched.length - 1].path
  // 将动态参数段替换为语义化名称，如 :id → detail
  const normalized = routePath
    .replace(/^\//, '')
    .replace(/\/:id$/, '-detail')      // /task/:id → task-detail
    .replace(/\/:id\//, '-detail-')    // /task/:id/sub → task-detail-sub
    .replace(/:[^/]+/g, 'detail')      // 其他动态参数兜底
    .replace(/\//g, '-')

  return normalized || 'index'
}

export function useAnnotation() {
  const route = useRoute()

  /** 加载当前页面标注数据（直接 fetch 静态文件，Vite dev server 提供） */
  const loadAnnotations = async () => {
    const fileName = routeToFileName(route)
    try {
      const base = import.meta.env.BASE_URL || '/'
      const res = await fetch(`${base}annotations/${fileName}.json?t=${Date.now()}`)
      if (res.ok) {
        const data: PageAnnotation = await res.json()
        annotations.value = data.annotations || []
        pageTitle.value = data.title || ''
      } else {
        annotations.value = []
      }
    } catch {
      annotations.value = []
    }
  }

  /** 保存标注数据到文件（通过 viteAnnotationPlugin 中间件写入磁盘） */
  const saveAnnotations = async () => {
    const fileName = routeToFileName(route)
    const data: PageAnnotation = {
      page: fileName,
      title: pageTitle.value || fileName,
      updatedAt: new Date().toISOString().split('T')[0],
      annotations: annotations.value
    }
    await fetch('/__annotation_save__', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  const addAnnotation = (item: AnnotationItem) => {
    annotations.value.push(item)
    saveAnnotations()
  }

  const updateAnnotation = (id: string, updates: Partial<AnnotationItem>) => {
    const idx = annotations.value.findIndex(a => a.id === id)
    if (idx > -1) {
      annotations.value[idx] = { ...annotations.value[idx], ...updates }
      saveAnnotations()
    }
  }

  const removeAnnotation = (id: string) => {
    annotations.value = annotations.value.filter(a => a.id !== id)
    saveAnnotations()
  }

  const toggleVisible = () => { visible.value = !visible.value }
  const toggleEditMode = () => { editMode.value = !editMode.value }

  // 路由变化时重新加载：先清空标注，等页面组件渲染完再加载
  watch(() => route.path, () => {
    activeId.value = ''
    annotations.value = []  // 先清空，避免旧标注点在新页面短暂显示
    // nextTick 等 Vue 路由组件挂载，再延迟 400ms 等页面内容（表格、卡片等）渲染完成
    nextTick(() => {
      setTimeout(() => {
        loadAnnotations()
      }, 400)
    })
  }, { immediate: true })

  return {
    visible, editMode, activeId, annotations, pageTitle,
    loadAnnotations, addAnnotation, updateAnnotation,
    removeAnnotation, toggleVisible, toggleEditMode
  }
}
