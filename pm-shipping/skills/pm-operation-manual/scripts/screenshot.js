#!/usr/bin/env node
/**
 * 操作手册自动截图脚本（跨平台通用版）
 *
 * 浏览器优先级（自动检测）：
 *   1. Playwright（推荐，自带 Chromium，跨平台，无需本机浏览器）
 *   2. Puppeteer（次选，自带 Chromium 下载）
 *   3. Puppeteer + 本机 Chrome/Edge/Chromium（兜底）
 *
 * 安装（二选一）：
 *   npm install playwright --save-dev && npx playwright install chromium
 *   npm install puppeteer --save-dev   # 会自动下载 Chromium
 *
 * 用法：
 *   node screenshot.js --config docs/screenshot-plan.json
 *
 * screenshot-plan.json 格式参考：screenshot-plan.example.json
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ─── 解析命令行参数 ────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const configIndex = args.indexOf('--config')
if (configIndex === -1 || !args[configIndex + 1]) {
  console.error('用法: node screenshot.js --config screenshot-plan.json')
  process.exit(1)
}
const configPath = args[configIndex + 1]
if (!fs.existsSync(configPath)) {
  console.error(`配置文件不存在: ${configPath}`)
  process.exit(1)
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const {
  baseUrl = 'http://localhost:5173',
  outputDir = 'docs/images/screenshots',
  loginUrl = '/login',
  loginCredentials = {},
  usernameSelector = "input[type='text']",
  passwordSelector = "input[type='password']",
  loginButtonSelector = "button[type='submit']",
  pages = [],
  viewport = { width: 1440, height: 900 }
} = config

// ─── 自动检测可用的浏览器驱动 ────────────────────────────────────────────────
function detectDriver() {
  // 1. 优先 Playwright
  try {
    require.resolve('playwright')
    console.log('✅ 使用 Playwright（推荐）')
    return 'playwright'
  } catch {}

  // 2. 次选 Puppeteer（完整版，自带 Chromium）
  try {
    require.resolve('puppeteer')
    console.log('✅ 使用 Puppeteer')
    return 'puppeteer'
  } catch {}

  // 3. puppeteer-core（配合本机浏览器）
  try {
    require.resolve('puppeteer-core')
    const localChrome = findLocalChrome()
    if (localChrome) {
      console.log('✅ 使用 puppeteer-core + 本机浏览器')
      return 'puppeteer-core'
    }
    console.error('❌ 找到 puppeteer-core 但未检测到本机浏览器，请安装 Chrome/Edge/Brave')
    process.exit(1)
  } catch {}

  // 4. 都没有，提示安装
  console.error(`
❌ 未找到可用的浏览器驱动，请安装以下任意一个：

  推荐（跨平台，自带浏览器）：
    npm install playwright --save-dev
    npx playwright install chromium

  备选（自带 Chromium）：
    npm install puppeteer --save-dev

  备选（使用本机 Chrome）：
    npm install puppeteer-core --save-dev
`)
  process.exit(1)
}

// ─── 查找本机浏览器路径（Puppeteer 兜底用）────────────────────────────────────
function findLocalChrome() {
  const candidates = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
    '/usr/bin/brave-browser',
    // Windows (通过 which/where)
  ]

  // 先试 which/where 命令
  const cmds = ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge', 'brave-browser']
  for (const cmd of cmds) {
    try {
      const p = execSync(`which ${cmd} 2>/dev/null || where ${cmd} 2>/dev/null`, { encoding: 'utf8' }).trim()
      if (p) return p
    } catch {}
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

// ─── 高亮元素 ─────────────────────────────────────────────────────────────────
async function highlightElements(page, selectors, driver) {
  if (!selectors || selectors.length === 0) return
  for (const sel of selectors) {
    try {
      if (driver === 'playwright') {
        await page.evaluate((s) => {
          document.querySelectorAll(s).forEach(el => {
            el.style.outline = '2px solid #ff4444'
            el.style.outlineOffset = '2px'
          })
        }, sel)
      } else {
        await page.evaluate((s) => {
          document.querySelectorAll(s).forEach(el => {
            el.style.outline = '2px solid #ff4444'
            el.style.outlineOffset = '2px'
          })
        }, sel)
      }
    } catch {}
  }
}

// ─── 等待页面稳定 ─────────────────────────────────────────────────────────────
async function waitStable(page, waitFor, driver) {
  if (waitFor) {
    try {
      if (driver === 'playwright') {
        await page.waitForSelector(waitFor, { timeout: 10000 })
      } else {
        await page.waitForSelector(waitFor, { timeout: 10000 })
      }
    } catch {}
  }
  await new Promise(r => setTimeout(r, 600)) // 等动画完成
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────
async function run() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const driver = detectDriver()
  let browser, page

  // ── 启动浏览器 ──────────────────────────────────────────────────────────────
  if (driver === 'playwright') {
    const { chromium } = require('playwright')
    browser = await chromium.launch({ headless: true })
    const ctx = await browser.newContext({
      viewport,
      locale: 'zh-CN',
      extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
    })
    page = await ctx.newPage()

  } else {
    // 支持 puppeteer（自带 Chromium）和 puppeteer-core（使用本机浏览器）
    let puppeteer
    try {
      puppeteer = require('puppeteer')
    } catch {
      puppeteer = require('puppeteer-core')
    }
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=zh-CN']
    }
    // puppeteer-core 必须指定 executablePath
    const localChrome = findLocalChrome()
    if (localChrome) {
      console.log(`  本机浏览器: ${localChrome}`)
      launchOptions.executablePath = localChrome
    }
    browser = await puppeteer.launch(launchOptions)
    page = await browser.newPage()
    await page.setViewport(viewport)
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' })
  }

  // ── 截图循环 ────────────────────────────────────────────────────────────────
  let isLoggedIn = false
  const results = []

  for (const pc of pages) {
    const { name, url, description, waitFor, highlight = [], skipLogin = false, fullPage = false, clip } = pc
    console.log(`\n处理: ${description} → ${url}`)

    try {
      // 登录
      if (!skipLogin && !isLoggedIn && loginCredentials.username) {
        console.log('  → 登录中...')
        if (driver === 'playwright') {
          await page.goto(`${baseUrl}${loginUrl}`, { waitUntil: 'networkidle' })
          await page.fill(usernameSelector, loginCredentials.username)
          await page.fill(passwordSelector, loginCredentials.password)
          await page.click(loginButtonSelector)
          await page.waitForLoadState('networkidle')
        } else {
          await page.goto(`${baseUrl}${loginUrl}`, { waitUntil: 'networkidle2' })
          await page.waitForSelector(usernameSelector)
          await page.type(usernameSelector, loginCredentials.username)
          await page.type(passwordSelector, loginCredentials.password)
          await page.click(loginButtonSelector)
          await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
        }
        isLoggedIn = true
        console.log('  → 登录成功')
      }

      // 导航
      if (driver === 'playwright') {
        await page.goto(`${baseUrl}${url}`, { waitUntil: 'networkidle' })
      } else {
        await page.goto(`${baseUrl}${url}`, { waitUntil: 'networkidle2' })
      }
      await waitStable(page, waitFor, driver)

      // 高亮
      await highlightElements(page, highlight, driver)
      if (highlight.length > 0) await new Promise(r => setTimeout(r, 200))

      // 截图
      const filename = `${name}.png`
      const outPath = path.join(outputDir, filename)
      const shotOpts = { path: outPath }
      if (fullPage) shotOpts.fullPage = true
      if (clip) shotOpts.clip = clip
      await page.screenshot(shotOpts)

      results.push({ name, description, file: filename, mdPath: outPath.replace(/\\/g, '/'), success: true })
      console.log(`  ✅ ${outPath}`)

    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`)
      results.push({ name, description, success: false, error: err.message })
    }
  }

  await browser.close()

  // ── 输出摘要 & 生成 Markdown 引用 ──────────────────────────────────────────
  const ok = results.filter(r => r.success)
  const fail = results.filter(r => !r.success)
  console.log(`\n\n========== 截图完成：${ok.length} 成功 / ${fail.length} 失败 ==========`)

  if (ok.length > 0) {
    const mdContent = ok.map(r => `<!-- ${r.description} -->\n![${r.description}](${r.mdPath})\n`).join('\n')
    const refPath = path.join(outputDir, 'screenshot-refs.md')
    fs.writeFileSync(refPath, mdContent)
    console.log(`\nMarkdown 引用已保存: ${refPath}`)
  }

  if (fail.length > 0) {
    console.log('\n--- 失败页面 ---')
    fail.forEach(r => console.log(`  - ${r.description}: ${r.error}`))
  }

  process.exit(fail.length > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('致命错误:', err)
  process.exit(1)
})
