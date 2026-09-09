// 标注数据类型定义

/** 标注定位方式 */
export type AnnotationType = 'selector' | 'position'

/** 标注分类 */
export type AnnotationCategory = 'filter' | 'field' | 'action' | 'rule' | 'custom'

/**
 * 标注宿主容器
 * - page：默认，渲染在页面层，弹窗打开时自动隐藏
 * - modal：渲染在弹窗层（.ant-modal-wrap），弹窗关闭时自动消失
 * - drawer：渲染在抽屉层（.ant-drawer-body），抽屉关闭时自动消失
 */
export type AnnotationContainer = 'page' | 'modal' | 'drawer'

/** 单个标注项 */
export interface AnnotationItem {
  id: string
  type: AnnotationType
  selector: string
  position: { x: number; y: number }
  title: string
  content: string
  category: AnnotationCategory
  source: string
  createdAt: string
  color?: string            // 自定义颜色，不填则按 category 默认色
  container?: AnnotationContainer  // 宿主容器，不填默认为 page
}

/** 页面标注数据 */
export interface PageAnnotation {
  page: string
  title: string
  updatedAt: string
  annotations: AnnotationItem[]
}
