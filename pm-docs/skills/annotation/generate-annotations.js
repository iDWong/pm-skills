#!/usr/bin/env node
/**
 * 自动生成标注数据
 * 从需求文档中提取功能说明，分析页面组件结构，生成标注 JSON
 *
 * 使用方式：
 * node .agents/skills/annotation/generate-annotations.js <page-path> <req-doc-path>
 *
 * 示例：
 * node .agents/skills/annotation/generate-annotations.js /equipment/vendor docs/需求说明书.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 路由路径转文件名
function pathToFileName(routePath) {
  return routePath.replace(/^\//, '').replace(/\//g, '-') || 'index'
}

// 解析需求文档，提取指定页面的功能设计
function parseRequirementDoc(docPath, pageName) {
  if (!fs.existsSync(docPath)) {
    console.error(`需求文档不存在: ${docPath}`)
    return null
  }

  const content = fs.readFileSync(docPath, 'utf-8')
  const sections = []

  const regex = /###\s+(.+?)\n([\s\S]*?)(?=\n###|\n##|$)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const title = match[1].trim()
    const body = match[2].trim()
    if (title.includes(pageName) || body.includes(pageName)) {
      sections.push({ title, body })
    }
  }

  return sections
}

// 解析 Vue 组件，提取可标注的元素
function parseVueComponent(componentPath) {
  if (!fs.existsSync(componentPath)) {
    console.error(`组件文件不存在: ${componentPath}`)
    return []
  }

  const content = fs.readFileSync(componentPath, 'utf-8')
  const elements = []

  // 提取表单字段
  const inputRegex = /<a-(input|select|date-picker|textarea|input-number)[^>]*placeholder="([^"]+)"/g
  let match
  let inputIndex = 0
  while ((match = inputRegex.exec(content)) !== null) {
    elements.push({
      type: 'field',
      selector: `.ant-${match[1]}:nth-of-type(${++inputIndex})`,
      title: match[2],
      content: `${match[2]}输入框`
    })
  }

  // 提取表格列
  const columnsMatch = content.match(/const\s+columns\s*=\s*\[([\s\S]*?)\]/)
  if (columnsMatch) {
    const titleRegex = /title:\s*['"]([^'"]+)['"]/g
    let colIndex = 0
    while ((match = titleRegex.exec(columnsMatch[1])) !== null) {
      elements.push({
        type: 'field',
        selector: `.ant-table-thead th:nth-child(${++colIndex})`,
        title: `${match[1]}列`,
        content: `表格${match[1]}列说明`
      })
    }
  }

  // 提取按钮
  const buttonRegex = /<a-button[^>]*>([^<]+)<\/a-button>/g
  while ((match = buttonRegex.exec(content)) !== null) {
    const text = match[1].trim()
    if (text && !['确定', '取消', '关闭'].includes(text)) {
      elements.push({
        type: 'action',
        selector: `button:contains("${text}")`,
        title: `${text}按钮`,
        content: `点击${text}`
      })
    }
  }

  return elements
}

// 生成标注数据
function generateAnnotations(pagePath, reqDocPath) {
  const fileName = pathToFileName(pagePath)
  const pageTitle = pagePath.split('/').pop() || fileName

  console.log(`正在解析需求文档: ${reqDocPath}`)
  const sections = parseRequirementDoc(reqDocPath, pageTitle)
  if (!sections || sections.length === 0) {
    console.warn(`未在需求文档中找到 ${pageTitle} 相关内容`)
  }

  const componentPath = path.join(process.cwd(), 'src/views', pagePath + '.vue')
  console.log(`正在解析组件: ${componentPath}`)
  const elements = parseVueComponent(componentPath)
  if (elements.length === 0) {
    console.warn(`未在组件中找到可标注的元素`)
  }

  const annotations = elements.map((el, idx) => ({
    id: `ann-${String(idx + 1).padStart(3, '0')}`,
    type: 'selector',
    selector: el.selector,
    position: { x: 0, y: 0 },
    title: el.title,
    content: el.content,
    category: el.type,
    source: sections?.length > 0 ? sections[0].title : '',
    createdAt: new Date().toISOString().split('T')[0]
  }))

  const outputDir = path.join(process.cwd(), 'public/annotations')
  fs.mkdirSync(outputDir, { recursive: true })

  const outputPath = path.join(outputDir, `${fileName}.json`)
  fs.writeFileSync(outputPath, JSON.stringify({
    page: pagePath,
    title: pageTitle,
    updatedAt: new Date().toISOString().split('T')[0],
    annotations
  }, null, 2), 'utf-8')

  console.log(`✅ 已生成标注文件: ${outputPath}（共 ${annotations.length} 个标注点）`)
  return outputPath
}

// 命令行入口
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('用法: node generate-annotations.js <page-path> <req-doc-path>')
  process.exit(1)
}
generateAnnotations(args[0], args[1])
