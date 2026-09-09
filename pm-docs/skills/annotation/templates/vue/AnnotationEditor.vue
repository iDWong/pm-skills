<!-- 标注编辑器：新增/编辑标注内容的弹窗，使用 Tiptap 富文本编辑器 -->
<template>
  <div v-if="visible" class="annotation-editor-mask">
    <div class="annotation-editor">
      <div class="editor-header">
        <span>{{ isEdit ? '编辑标注' : '新增标注' }}</span>
        <button class="editor-close" @click="$emit('cancel')">&times;</button>
      </div>

      <div class="editor-body">
        <div class="editor-field">
          <label>标题</label>
          <input v-model="form.title" placeholder="标注标题" />
        </div>

        <div class="editor-field editor-field-row">
          <div class="editor-field-half">
            <label>分类</label>
            <select v-model="form.category">
              <option value="filter">筛选条件</option>
              <option value="field">字段说明</option>
              <option value="action">操作说明</option>
              <option value="rule">业务规则</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="editor-field-half">
            <label>标注颜色 <span class="field-hint">（不填则按分类默认色）</span></label>
            <div class="color-field">
              <input
                type="color"
                :value="form.color || DEFAULT_ANNOTATION_COLOR"
                class="color-input-block"
                @input="onColorPick"
              />
              <input v-model="form.color" placeholder="#1677ff" class="color-text" />
              <button type="button" class="color-clear" @click="form.color = ''" title="清除，使用默认色">✕</button>
            </div>
          </div>
        </div>

        <div class="editor-field editor-field-content">
          <label>内容</label>

          <!-- 工具栏 -->
          <div class="tiptap-toolbar" v-if="editor">

            <!-- 组1：字号 -->
            <div class="toolbar-fontsize-wrap" v-click-outside="() => fontsizeOpen = false">
              <button type="button" class="toolbar-fontsize-btn" :class="{ active: fontsizeOpen }" @click.stop="fontsizeOpen = !fontsizeOpen" title="字号">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/></svg>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              </button>
              <div v-if="fontsizeOpen" class="toolbar-fontsize-dropdown">
                <div v-for="size in fontSizes" :key="size.value" class="fontsize-item"
                  :class="{ active: editor.isActive('textStyle', { fontSize: size.value }) }"
                  :style="{ fontSize: size.value }" @click="applyFontSize(size.value)">{{ size.label }}</div>
              </div>
            </div>

            <span class="toolbar-sep"></span>

            <!-- 组2：文字样式 -->
            <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="加粗">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
            </button>
            <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="斜体">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
            </button>
            <button type="button" :class="{ active: editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()" title="行内代码">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
            </button>

            <!-- 文字颜色：A + 色块下划线 -->
            <div class="toolbar-color-btn" title="文字颜色">
              <span class="color-a-text">A</span>
              <span class="color-a-bar" :style="{ background: currentTextColor }"></span>
              <input type="color" class="color-picker" @input="(e) => { currentTextColor = (e.target as HTMLInputElement).value; editor?.chain().focus().setColor(currentTextColor).run() }" />
            </div>
            <!-- 背景高亮：A + 高亮色块 -->
            <div class="toolbar-color-btn" title="背景高亮">
              <span class="color-a-text" :style="{ background: currentHighlight, padding: '0 2px', borderRadius: '2px' }">A</span>
              <input type="color" class="color-picker" :value="currentHighlight" @input="(e) => { currentHighlight = (e.target as HTMLInputElement).value; editor?.chain().focus().toggleHighlight({ color: currentHighlight }).run() }" />
            </div>
            <button type="button" @click="editor?.chain().focus().unsetColor().run(); editor?.chain().focus().unsetHighlight().run()" title="清除颜色格式">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6.1 20.5L4 18.4l7.4-7.4-2.1-2.1-1.4 1.4-1.1-1.1V7.5l-3-3 1.1-1.1 16.9 16.9-1.1 1.1-4.5-4.5H9.5l-3.4 3.6zm9.4-9.5l-1.5-1.5 3.5-3.5H15V4H9v2.1L5.9 3 7 1.9 8.1 3H17v4h2l-3.5 4z"/></svg>
            </button>

            <span class="toolbar-sep"></span>

            <!-- 组3：段落排版 -->
            <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="无序列表">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
            </button>
            <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="有序列表">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
            </button>

            <span class="toolbar-sep"></span>

            <!-- 组4：表格 -->
            <button type="button" @click="insertTable" title="插入表格">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h15zm-8 5h8v3h-8v-3zm0 5h8v4h-8v-4zM5 10h5v3H5v-3zm0 5h5v4H5v-4z"/></svg>
            </button>
            <button type="button" @click="addRowAfter" :disabled="!editor.isActive('table')" title="在下方插入行">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 13H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-1 6H4v-4h15v4zM11 3H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8v-2H4V5h7V3zm9 4h-2V5h-2V7h-2v2h2v2h2V9h2V7z"/></svg>
            </button>
            <button type="button" @click="deleteRow" :disabled="!editor.isActive('table')" title="删除当前行" class="btn-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 13H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-1 6H4v-4h15v4zM11 3H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8V8H4V5h7V3zm6 4l-3 3 3 3 1.4-1.4L16.8 10l1.6-1.6L17 7z"/></svg>
            </button>
            <button type="button" @click="addColumnAfter" :disabled="!editor.isActive('table')" title="在右侧插入列">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h6v14zm9-8h-2V9h-2v2h-2v2h2v2h2v-2h2v-2z"/></svg>
            </button>
            <button type="button" @click="deleteColumn" :disabled="!editor.isActive('table')" title="删除当前列" class="btn-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h6v14zm7-5l3-3-3-3-1.4 1.4 1.6 1.6-1.6 1.6L18 14z"/></svg>
            </button>
            <button type="button" @click="deleteTable" :disabled="!editor.isActive('table')" title="删除整个表格" class="btn-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>

            <span class="toolbar-sep"></span>

            <!-- 组5：媒体 -->
            <button type="button" @click="insertImage" title="插入图片">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            </button>

          </div>

          <!-- Tiptap 编辑区 -->
          <div class="tiptap-wrap">
            <EditorContent :editor="editor" class="tiptap-editor" />
          </div>
        </div>

        <div class="editor-field">
          <label>来源章节</label>
          <input v-model="form.source" placeholder="如 3.5.3.1 章节标题（可选）" />
        </div>
      </div>

      <div class="editor-footer">
        <button class="editor-btn" @click="$emit('cancel')">取消</button>
        <button class="editor-btn editor-btn-primary" @click="handleSave">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { Image } from '@tiptap/extension-image'
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { marked } from 'marked'
import type { AnnotationItem, AnnotationCategory } from './types'

const props = defineProps<{
  visible: boolean
  editItem: AnnotationItem | null
}>()

const emit = defineEmits<{
  cancel: []
  save: [data: { title: string; content: string; category: AnnotationCategory; source: string; color: string }]
}>()

const isEdit = !!props.editItem

const DEFAULT_ANNOTATION_COLOR = '#1677ff'

// 内容兼容：AI/技能生成的标注 content 是 Markdown，TipTap 只认 HTML。
// 加载到编辑器前，若检测为 Markdown 则先转 HTML，否则原样使用（已是 HTML）。
const toEditorHtml = (content: string): string => {
  if (!content) return ''
  // 已是 HTML（以标签开头或含成对标签）直接用
  if (content.trimStart().startsWith('<') || /<[a-z][^>]*>[\s\S]*<\/[a-z]/i.test(content)) return content
  // 否则按 Markdown 解析（含表格、加粗、列表等）
  return marked.parse(content) as string
}

const form = reactive({
  title: '',
  content: '',
  category: 'custom' as AnnotationCategory,
  source: '',
  color: ''
})

// 初始化 Tiptap 编辑器
const editor = useEditor({
  extensions: [
    StarterKit,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({ inline: false, allowBase64: true }),
    TextStyle,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
  ],
  content: '',
  editorProps: {
    attributes: { class: 'tiptap-content' },
    // 支持粘贴图片：转 base64 插入
    handlePaste(view, event) {
      const items = event.clipboardData?.items
      if (!items) return false
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = (e) => {
            const src = e.target?.result as string
            view.dispatch(view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src })
            ))
          }
          reader.readAsDataURL(file)
          return true
        }
      }
      return false
    }
  }
})

// 字号下拉
const fontsizeOpen = ref(false)
const fontSizes = [
  { label: '9px',  value: '9px'  },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '24px', value: '24px' },
  { label: '32px', value: '32px' },
]
const applyFontSize = (size: string) => {
  editor.value?.chain().focus().setFontSize(size).run()
  fontsizeOpen.value = false
}

// 颜色状态（用于显示当前选中色）
const currentTextColor = ref('#000000')
const currentHighlight = ref('#ffff00')

// v-click-outside 指令（点击外部关闭下拉）
const vClickOutside = {
  mounted(el: HTMLElement & { _clickOutside?: (e: Event) => void }, binding: any) {
    el._clickOutside = (e: Event) => {
      if (!el.contains(e.target as Node)) binding.value(e)
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement & { _clickOutside?: (e: Event) => void }) {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside)
    }
  }
}

// 插入表格
const insertTable = () => {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}
const addRowAfter = () => editor.value?.chain().focus().addRowAfter().run()
const deleteRow = () => editor.value?.chain().focus().deleteRow().run()
const addColumnAfter = () => editor.value?.chain().focus().addColumnAfter().run()
const deleteColumn = () => editor.value?.chain().focus().deleteColumn().run()
const deleteTable = () => editor.value?.chain().focus().deleteTable().run()

// 插入图片（弹出输入框）
const insertImage = () => {
  const url = window.prompt('输入图片 URL')
  if (url) editor.value?.chain().focus().setImage({ src: url }).run()
}

const onColorPick = (e: Event) => {
  form.color = (e.target as HTMLInputElement).value
}

// 编辑时回填
watch(() => props.editItem, (item) => {
  if (item) {
    form.title = item.title
    form.content = item.content
    form.category = item.category
    form.source = item.source
    form.color = item.color || ''
  } else {
    form.title = ''
    form.content = ''
    form.category = 'custom'
    form.source = ''
    form.color = ''
  }
  // 同步到编辑器（Markdown 内容先转 HTML）
  if (editor.value) {
    editor.value.commands.setContent(toEditorHtml(form.content))
  }
}, { immediate: true })

// visible 打开时同步内容到编辑器
watch(() => props.visible, (val) => {
  if (val && editor.value) {
    editor.value.commands.setContent(toEditorHtml(form.content))
  }
})

const handleSave = () => {
  if (!form.title.trim()) return
  // 存储 HTML，保留颜色、字号、列表等所有格式
  const content = editor.value?.getHTML() ?? ''
  emit('save', { title: form.title, content, category: form.category, source: form.source, color: form.color })
}

onBeforeUnmount(() => editor.value?.destroy())

// Esc 关闭弹窗
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) emit('cancel')
}
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.annotation-editor-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.annotation-editor {
  width: 720px;
  max-height: 90vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.editor-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #8c8c8c;
  cursor: pointer;
}

.editor-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.editor-field {
  margin-bottom: 12px;
}

.editor-field label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.editor-field input,
.editor-field select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.editor-field-row {
  display: flex;
  gap: 12px;
}

.editor-field-half {
  flex: 1;
  min-width: 0;

  label { display: block; font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }

  select, input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
    &:focus { border-color: #1677ff; }
  }
}

.field-hint {
  font-weight: 400;
  color: #bfbfbf;
  font-size: 11px;
}

.color-field {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 3px 8px;
  &:focus-within { border-color: #1677ff; }
}

.color-input-block {
  width: 22px !important;
  height: 22px !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
}

.color-text {
  flex: 1;
  border: none !important;
  padding: 0 !important;
  font-size: 12px;
  font-family: monospace;
  &:focus { border: none !important; outline: none; }
}

.color-clear {
  background: none;
  border: none;
  color: #bfbfbf;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;
  &:hover { color: #ff4d4f; }
}

/* 字号下拉 */
.toolbar-fontsize-wrap {
  position: relative;
}

.toolbar-fontsize-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 36px;
  height: 26px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: #595959;
  &:hover { background: #e8e8e8; }
  &.active { background: #e6f4ff; border-color: #91caff; color: #1677ff; }
}

.toolbar-fontsize-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 9999;
  min-width: 80px;
  padding: 4px 0;
  overflow: hidden;
}

.fontsize-item {
  padding: 5px 14px;
  cursor: pointer;
  color: #262626;
  white-space: nowrap;
  line-height: 1.4;
  &:hover { background: #f0f7ff; color: #1677ff; }
  &.active { color: #1677ff; font-weight: 500; }
}

/* 工具栏 */
.tiptap-toolbar {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: #f8f8f8;
  flex-wrap: wrap;
}

.tiptap-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: #595959;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.tiptap-toolbar button:hover {
  background: #e8e8e8;
  color: #262626;
}

.tiptap-toolbar button.active {
  background: #e6f4ff;
  border-color: #91caff;
  color: #1677ff;
}

.tiptap-toolbar button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tiptap-toolbar button.btn-danger:not(:disabled):hover {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #ff4d4f;
}

.toolbar-color-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  border-radius: 4px;
  cursor: pointer;
  color: #595959;
  gap: 1px;
  &:hover { background: #e8e8e8; }
}

.color-a-text {
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  font-family: serif;
}

.color-a-bar {
  width: 14px;
  height: 3px;
  border-radius: 1px;
}

.color-picker {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: none;
  padding: 0;
}

/* 编辑区 */
.tiptap-wrap {
  border: 1px solid #d9d9d9;
  border-radius: 0 0 4px 4px;
  min-height: 200px;
  max-height: 360px;
  overflow-y: auto;
}

:deep(.tiptap-content) {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  outline: none;
  min-height: 200px;
}

:deep(.tiptap-content p) { margin: 0 0 6px; }
:deep(.tiptap-content strong) { font-weight: 600; }
:deep(.tiptap-content code) {
  background: #f5f5f5;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}

/* 表格样式 */
:deep(.tiptap-content table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 12px;
}
:deep(.tiptap-content th),
:deep(.tiptap-content td) {
  border: 1px solid #d9d9d9;
  padding: 5px 8px;
  text-align: left;
  min-width: 60px;
}
:deep(.tiptap-content th) {
  background: #fafafa;
  font-weight: 500;
}
:deep(.tiptap-content .selectedCell) {
  background: #e6f4ff;
}

/* 图片 */
:deep(.tiptap-content img) {
  max-width: 100%;
  border-radius: 4px;
}

:deep(.tiptap-content ul) {
  list-style: disc;
  padding-left: 20px;
  margin: 4px 0;
}

:deep(.tiptap-content ol) {
  list-style: decimal;
  padding-left: 20px;
  margin: 4px 0;
}

:deep(.tiptap-content li) {
  margin: 2px 0;
}

.editor-footer {
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.editor-btn {
  padding: 5px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}

.editor-btn-primary {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}

.editor-btn-primary:hover { background: #4096ff; }

/* 移动端适配：窄屏下弹窗近全屏，避免 720px 固定宽溢出 */
@media (max-width: 640px) {
  .annotation-editor {
    width: 100vw;
    max-width: 100vw;
    max-height: 92vh;
    border-radius: 12px 12px 0 0;
    align-self: flex-end;
  }
  .annotation-editor-mask {
    align-items: flex-end;
  }
  .editor-field-row {
    flex-direction: column;
    gap: 12px;
  }
  .tiptap-toolbar {
    gap: 2px;
    padding: 6px;
  }
}
</style>
