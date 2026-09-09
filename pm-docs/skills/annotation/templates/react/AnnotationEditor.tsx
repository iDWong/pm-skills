import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontSize from '@tiptap/extension-font-size'
import Highlight from '@tiptap/extension-highlight'
import { marked } from 'marked'
import type { AnnotationItem, AnnotationCategory } from './types'

interface AnnotationEditorProps {
  visible: boolean
  editItem: AnnotationItem | null
  onSave: (data: { title: string; content: string; category: AnnotationCategory; source: string; color: string }) => void
  onCancel: () => void
}

// 内容兼容：AI/技能生成的标注 content 是 Markdown，TipTap 只认 HTML。
// 加载到编辑器前，若检测为 Markdown 则先转 HTML，否则原样使用（已是 HTML）。
function toEditorHtml(content: string): string {
  if (!content) return ''
  // 已是 HTML（以标签开头或含成对标签）直接用
  if (content.trimStart().startsWith('<') || /<[a-z][^>]*>[\s\S]*<\/[a-z]/i.test(content)) return content
  // 否则按 Markdown 解析（含表格、加粗、列表等）
  return marked.parse(content) as string
}

export function AnnotationEditor({ visible, editItem, onSave, onCancel }: AnnotationEditorProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<AnnotationCategory>('custom')
  const [source, setSource] = useState('')
  const [color, setColor] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Image.configure({ inline: false, allowBase64: true }),
      TextStyle, Color, FontSize,
      Highlight.configure({ multicolor: true }),
    ],
    content: '',
  })

  // 编辑时回填
  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title)
      setCategory(editItem.category)
      setSource(editItem.source)
      setColor(editItem.color || '')
      editor?.commands.setContent(toEditorHtml(editItem.content))
    } else {
      setTitle('')
      setCategory('custom')
      setSource('')
      setColor('')
      editor?.commands.setContent('')
    }
  }, [editItem, visible])

  // visible 打开时同步内容
  useEffect(() => {
    if (visible && editor) {
      editor.commands.setContent(toEditorHtml(editItem?.content || ''))
    }
  }, [visible])

  // Esc 关闭
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) onCancel()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [visible, onCancel])

  const handleSave = () => {
    if (!title.trim()) return
    const content = editor?.getHTML() ?? ''
    onSave({ title, content, category, source, color })
  }

  if (!visible) return null

  return (
    <div className="annotation-editor-mask">
      <div className="annotation-editor">
        <div className="editor-header">
          <span>{editItem ? '编辑标注' : '新增标注'}</span>
          <button className="editor-close" onClick={onCancel}>&times;</button>
        </div>

        <div className="editor-body">
          <div className="editor-field">
            <label>标题</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="标注标题" />
          </div>

          <div className="editor-field editor-field-row">
            <div className="editor-field-half">
              <label>分类</label>
              <select value={category} onChange={e => setCategory(e.target.value as AnnotationCategory)}>
                <option value="filter">筛选条件</option>
                <option value="field">字段说明</option>
                <option value="action">操作说明</option>
                <option value="rule">业务规则</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div className="editor-field-half">
              <label>标注颜色 <span className="field-hint">（不填则按分类默认色）</span></label>
              <div className="color-field">
                <input type="color" value={color || '#1677ff'} onChange={e => setColor(e.target.value)} className="color-input-block" />
                <input value={color} onChange={e => setColor(e.target.value)} placeholder="#1677ff" className="color-text" />
                <button type="button" className="color-clear" onClick={() => setColor('')} title="清除，使用默认色">✕</button>
              </div>
            </div>
          </div>

          <div className="editor-field">
            <label>内容</label>
            {editor && (
              <div className="tiptap-toolbar">
                <button type="button" className={editor.isActive('bold') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗">B</button>
                <button type="button" className={editor.isActive('italic') ? 'active' : ''} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体">I</button>
                <button type="button" className={editor.isActive('code') ? 'active' : ''} onClick={() => editor.chain().focus().toggleCode().run()} title="代码">&lt;/&gt;</button>
                <span className="toolbar-sep" />
                <button type="button" className={editor.isActive('bulletList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表">•</button>
                <button type="button" className={editor.isActive('orderedList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表">1.</button>
                <span className="toolbar-sep" />
                <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="插入表格">⊞</button>
                <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.isActive('table')} title="插入行">+行</button>
                <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.isActive('table')} title="插入列">+列</button>
                <button type="button" className="btn-danger" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.isActive('table')} title="删除表格">✕表</button>
              </div>
            )}
            <div className="tiptap-wrap">
              <EditorContent editor={editor} className="tiptap-editor" />
            </div>
          </div>

          <div className="editor-field">
            <label>来源章节</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="如 3.5.3.1 章节标题（可选）" />
          </div>
        </div>

        <div className="editor-footer">
          <button className="editor-btn" onClick={onCancel}>取消</button>
          <button className="editor-btn editor-btn-primary" onClick={handleSave}>确定</button>
        </div>
      </div>
    </div>
  )
}
