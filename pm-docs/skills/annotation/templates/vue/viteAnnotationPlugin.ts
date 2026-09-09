import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

/**
 * Vite 插件：标注数据本地保存
 * 拦截 /__annotation_save__ 请求，将标注 JSON 写入 public/annotations/ 目录
 * 仅在 dev server 生效，不影响生产构建
 */
export function annotationPlugin(): Plugin {
  let projectRoot = ''
  const MAX_BODY = 1024 * 1024 // 请求体上限 1MB，防止内存耗尽

  return {
    name: 'vite-plugin-annotation-save',
    configResolved(config) {
      projectRoot = config.root
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || !req.url?.includes('/__annotation_save__')) {
          return next()
        }

        let body = ''
        let aborted = false
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > MAX_BODY) {
            aborted = true
            res.statusCode = 413
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: '请求体过大' }))
            req.destroy()
          }
        })
        req.on('end', () => {
          if (aborted) return
          try {
            const data = JSON.parse(body)
            // 路径遍历防护：只取文件名部分，过滤非法字符
            const rawName = String(data.page || 'unknown')
            const fileName = path.basename(rawName).replace(/[^a-zA-Z0-9_-]/g, '_')

            const dir = path.join(projectRoot, 'public', 'annotations')
            const filePath = path.resolve(dir, `${fileName}.json`)
            // 防御纵深：确认最终路径未越出目标目录
            if (!filePath.startsWith(path.resolve(dir) + path.sep)) {
              throw new Error('invalid path')
            }

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, file: `${fileName}.json` }))
          } catch (e) {
            // 详细错误只打到开发者控制台，响应体不泄露内部路径
            console.error('[annotation-plugin] 保存失败:', e)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: '保存失败' }))
          }
        })
      })
    }
  }
}
