# 截图操作指南

截图方案按优先级自动选择：

| 优先级 | 方案 | 能截弹窗 | 适用场景 |
|--------|------|---------|---------|
| ⭐ 最优 | OpenClaw（browser-use） | ✅ 能 | 最完整，可操作真实浏览器 |
| 次选 | Playwright | ❌ 静态页 | 跨平台，零配置 |
| 备选 | Puppeteer | ❌ 静态页 | 同上 |
| 兜底 | 本机浏览器（脚本自动探测） | ❌ 静态页 | 本机有 Chrome/Edge 等 |

## 方案 A：OpenClaw 模式（推荐）

OpenClaw 通过 `browser-use` skill 直接控制真实浏览器，能截取弹窗、下拉菜单等动态内容。

截图指令格式：
```
请使用 OpenClaw 的 browser-use skill 按以下步骤截图并保存到手册同级的 images/（如 prd/release/images/）：
1. 打开浏览器访问 http://localhost:5173/login
2. 截图保存为 login.png
3. 输入账号 admin / 密码 123456，点击登录
4. 截图保存为 dashboard.png
5. 点击左侧菜单"用户管理"，截图保存为 user-list.png
6. 点击【新增】按钮，等待弹窗出现，截图保存为 user-add-dialog.png
...
```

## 方案 B：脚本模式

安装依赖（选其一）：
```bash
# Playwright（推荐）
npm install playwright --save-dev
npx playwright install chromium

# Puppeteer（备选）
npm install puppeteer --save-dev
```

生成截图计划文件 `prd/release/screenshot-plan.json`：
```json
{
  "baseUrl": "http://localhost:5173",
  "outputDir": "prd/release/images",
  "loginUrl": "/login",
  "loginCredentials": { "username": "admin", "password": "123456" },
  "usernameSelector": "input[type='text']",
  "passwordSelector": "input[type='password']",
  "loginButtonSelector": "button[type='submit']",
  "viewport": { "width": 1440, "height": 900 },
  "pages": [
    {
      "name": "login",
      "url": "/login",
      "description": "登录页面",
      "waitFor": ".login-form",
      "highlight": ["input[type='text']", "input[type='password']", "button[type='submit']"],
      "skipLogin": true
    },
    {
      "name": "dashboard",
      "url": "/",
      "description": "系统首页",
      "waitFor": ".layout-content"
    }
  ]
}
```

`pages` 字段说明：

| 字段 | 说明 |
|------|------|
| `name` | 截图文件名（不含扩展名） |
| `url` | 页面路径（相对于 baseUrl） |
| `waitFor` | 等待该 CSS 选择器出现后再截图 |
| `highlight` | 需要红色边框标注的元素选择器 |
| `skipLogin` | 是否跳过登录（登录页设为 true） |
| `fullPage` | 是否截取整页（默认 false） |

执行截图：
```bash
node ../scripts/screenshot.cjs --config prd/release/screenshot-plan.json
```

> 注：如项目 package.json 包含 `"type": "module"`，必须使用 `.cjs` 版本。

截图保存到 **手册同级的 `images/`**（手册落 `prd/release/` 时即 `prd/release/images/`）。

> **不要用 `images/screenshots/` 这种二级子目录** —— Word 导出只认 `images/<纯ASCII名>.png` 一层，`images/screenshots/xxx.png` 会静默丢图（2026-09-10 实测）。文件名也必须纯 ASCII。
> 手册若改落到别的目录（如 `prd/planning/`），截图目录跟着改成那一级的 `images/`。

## 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 页面空白 | 开发服务器未启动 | 先运行 `pnpm dev` |
| 登录失败 | 选择器不匹配 | 检查实际登录页的 input 选择器 |
| 页面跳转到404 | 路由路径错误 | 查看 `src/router/modules/` 确认路径 |
| 截图内容不完整 | 页面有懒加载 | 在 `waitFor` 中指定具体内容的选择器 |
| 弹窗未出现 | 需要先点击按钮 | 脚本模式不支持，改用 OpenClaw 或文字说明代替 |
