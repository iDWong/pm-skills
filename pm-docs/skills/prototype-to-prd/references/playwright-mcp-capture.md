# Playwright MCP 站点采集指南

> 当工作区或 Cursor 已配置 **Playwright MCP**（如 `.cursor/mcp.json`）时，线上站点盘点 **优先于** `WebFetch`。本文件管 **公开页与 SPA**；需登录场景另见 [`auth-gated-sites.md`](auth-gated-sites.md) §9。

## 1. 何时用 Playwright MCP

| 场景 | 优先工具 |
| --- | --- |
| SPA（Vue/React，`#/` 路由） | **Playwright MCP** |
| 需等 JS 渲染后才见文案 | **Playwright MCP** |
| `WebFetch` 超时 / 空壳 / 连接重置 | **Playwright MCP**（可重试） |
| 静态 HTML、无 JS 依赖 | `WebFetch` 或 `Read` 本地文件 |
| 需登录内页 | MCP + 人机协作，或用户导出 HTML；见 `auth-gated-sites.md` |

## 2. 推荐采集流程

```text
1. browser_navigate → 目标 URL（记录重定向后最终 URL）
2. browser_wait_for → 等待 1–3s（SPA 渲染）
3. browser_snapshot → 导航、按钮、表单、heading 结构
4. browser_evaluate → document.body.innerText / 路由列表（SPA 内页）
5. 逐路由 browser_navigate 或 browser_click → 重复 2–4
6. （可选）browser_take_screenshot → 存 imports/mcp-export/
7. 汇总写入 -原型盘点.md，§1 标注 [来源：MCP 浏览器抓取]
```

## 3. 常用 MCP 工具

| 工具 | 用途 |
| --- | --- |
| `browser_navigate` | 打开 URL / hash 路由 |
| `browser_snapshot` | accessibility 树：文案、链接、按钮 |
| `browser_evaluate` | 执行 JS 取 innerText、title、href 列表 |
| `browser_click` | 点 Tab、菜单、弹窗（需 snapshot 中的 `ref`） |
| `browser_wait_for` | 等待渲染或指定文案出现 |
| `browser_take_screenshot` | 截图归档（需 `--caps=vision` 时见 MCP 配置） |

**SPA 注意**：hash 路由（`#/editor`）用 `browser_navigate` 直达后 **`browser_wait_for` + `browser_evaluate`** 校验 URL 与正文，勿仅依赖首次 snapshot（可能仍是上一页缓存）。

## 4. 盘点稿标注

| 标注 | 含义 |
| --- | --- |
| `[原型摘录]` | 来自 snapshot / innerText 的可见文案 |
| `[来源：MCP 浏览器抓取]` | 整站或单页经 Playwright 采集 |
| `[抓取时示例数据]` | 列表/图表中的动态示例值 |

## 5. 工作区约定（可选）

项目可预置：

| 路径 | 用途 |
| --- | --- |
| `.cursor/mcp.json` | Playwright MCP 基础配置 |
| `imports/mcp-export/` | 截图 / 导出 HTML（宜加入 `.gitignore`） |

**不在技能内写安装步骤**——环境差异大；用户问接入时指向 [Playwright MCP README](https://github.com/microsoft/playwright-mcp) 与 Cursor Settings → MCP。

## 6. 禁止事项

- 未实际抓取就写 §5 级交互细节
- 把 MCP 抓到的示例数据当作业务规则
- 将 Cookie / 凭据写入 `docs/` 或提交 git
- 假设用户一定已配置 MCP——未配置时回退 `WebFetch` / 用户导出 HTML

## 7. 与 auth-gated-sites 的分工

| 文件 | 范围 |
| --- | --- |
| **本文件** | 公开 URL、SPA、静态站采集流程 |
| **auth-gated-sites.md** | 登录墙、会话不共享、补救方案、MCP 登录协作 §9 |
