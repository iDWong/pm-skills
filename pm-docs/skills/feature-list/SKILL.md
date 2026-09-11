---
name: feature-list
description: >
  从 SRS 需求规格说明书和可行性研究报告中提取并生成功能清单文档，支持导出 xlsx 或 Word 格式。
  触发场景：(1) "生成功能清单" "导出功能清单" "功能清单" "功能列表" "feature list",
  (2) "整理功能清单" "汇总功能" "功能汇总表",
  (3) 用户需要将 SRS 或可研报告中的功能整理成独立的功能清单文档时触发。
  支持从已有文档自动提取，也支持用户手动补充后导出。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  author: Wong
  version: "1.1"
  reviewed: "2026-09-12"
---

# 功能清单生成器

## Step 1：扫描项目文档

并行扫描以下路径，找到 SRS 和可研报告：

```
Glob("dev/SRS/*.md")
Glob("docs/SRS/*.md")                        # 兼容旧根
Glob("docs/01-需求与规划/*SRS*.md")          # 兼容更旧的归档路径
Glob("**/*需求说明书*.md")
Glob("prd/planning/*可行性研究报告*.md")
Glob("prd/planning/*可研*.md")
Glob("docs/规划/*可研*.md")                  # 兼容旧根
Glob("docs/01-需求与规划/*可研*.md")   # 兼容旧归档路径
```

找到文档后告知用户，说明将从哪些文档提取数据。若两类文档都找到，以 SRS 为主数据源（字段更完整），可研报告补充建设类型字段。

**门禁**：若未找到 SRS 但存在 `prd/PRD/*.md`（或旧路径 `docs/**/*-PRD.md`） → Read `../common/prd-to-srs-gate.md`，输出 §3 话术，**中止**，路由 **`req-doc` Step F**。

## Step 2：提取功能清单数据

从文档中提取以下字段：

| 字段 | 来源 | 说明 |
|------|------|------|
| 所属系统 | SRS / 可研 | PC管理后台、移动端应用等；**仅当系统数量 ≥ 2 时才包含此列** |
| 模块 | SRS / 可研 | 一级模块 |
| 子模块 | SRS | 二级模块（如有） |
| 功能名称 | SRS 页面功能清单（3.3节） | 具体功能点 |
| 功能描述 | SRS 页面功能清单（3.3节） | 功能说明 |
| 优先级 | SRS 需求功能清单（3.2节） | P0 / P1 / P2 |
| 备注 | - | 留空 |

提取规则：
- 功能粒度与 SRS 页面功能清单保持一致，不合并、不拆分
- 优先级从 SRS 需求功能清单按模块匹配，找不到则留空
- **所属系统列**：扫描 SRS 页面功能清单，若只有一个系统（如只有 PC 管理后台），则不生成该列；若有 PC 管理后台 + 移动端等多个系统，则保留该列

提取完成后展示数据摘要（共 N 条，按系统分布），确认后进入下一步。

## Step 3：询问导出格式

```
功能清单数据已提取完成，共 N 条功能。请选择导出格式：
1. xlsx（Excel 表格，适合筛选和编辑）
2. Word（.docx，适合正式文档交付）
```

## Step 4A：生成 xlsx


xlsx 走服务端专用接口 `/api/document/export/excel-from-data`，**不经过 `export-word.sh`，也不涉及图片嵌入**（该脚本只支持 Word，图片规则只对 Word 生效）。

> **payload 必须用 `data`（二维数组，第一行是表头）**，不是 `headers` + `rows`——2026-09-10 实测：
> 用 `headers`/`rows` 时接口仍返回 200 和合法 xlsx，但**里面没有 worksheet**，是个空壳文件。
> 用 `data` 格式验证通过：`dimension A1:C4`（标题 + 表头 + 2 行数据），共享字符串齐全。

1. 从 `../config.json` 读取 `apiBaseUrl`

2. 将提取的数据组装为 JSON，调用服务端接口：
   ```bash
   curl -s {apiBaseUrl}/api/document/export/excel-from-data \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "filename": "{项目名称}-功能清单-V1.0",
       "title": "{项目名称}功能清单",
       "freezeFirstRow": true,
       "autoFilter": true,
       "sheets": [{ "name": "功能清单", "data": [[表头行], [数据行...]] }]
     }' \
     -o "dev/design/{YYYY-MM-DD}-{项目名称}-功能清单-V1.0.xlsx"
   ```

3. 导出成功后告知用户文件路径。

## Step 4B：生成 Word

> **⚠️ 导出前后各一件事**：① 图片必须放在**文档同级的 `images/` 子目录**且**文件名纯 ASCII**——这是唯一可用形式，`img/`、`images/sub/`、`../images/`、与文档同目录、中文名**全都静默丢图**（脚本仍打印 `Export succeeded`，但 `word/media/` 是空的）；② 导出后立刻验 `unzip -l <docx> | grep -c "word/media/"`，数字必须等于图片张数。实测边界表见 `../common/README.md`。

Word 走通用导出脚本，与 req-doc、feasibility-report 技能一致。

1. 将数据写入 Markdown 中间文件：
   `dev/design/{YYYY-MM-DD}-{项目名称}-功能清单-V1.0.md`
   格式参考 `references/md-template.md`

2. 调用通用导出脚本：
   ```bash
   bash ../common/export-word.sh <md文件路径> feature-list
   ```

3. 导出成功后告知用户文件路径。

---

## 文档命名规范

`dev/design/{YYYY-MM-DD}-{项目名称}-功能清单-V1.0.{md|xlsx|docx}`

**修订：就地改也要改文件名。** 大文档（几千行 / MB 级）**就地 `Edit` 改**，别整份重写；但改完必须三样一起动——文首「文档版本」、版本历史表、**`mv` 把文件名的版本号也改掉**（局部修订 `+0.1`，结构性重写进大版本；日期取改动当天）。**绝不允许内容已是 V1.1、文件名还写 V1.0。**改名后 `grep` 一遍旧名，把 README 清单、下游「来源」行、`tools/` 脚本里的引用一并改掉。完整规则见 `../common/README.md`。

## 外部依赖与降级：Word/xlsx 导出

导出链走**技能库根的 `config.json`** 里的 `apiBaseUrl`（本机是 docsvc `http://127.0.0.1:8899`）。

| 情况 | 表现 | 怎么办 |
|---|---|---|
| 没配 `config.json` | 脚本报「无法从 config.json 读取 apiBaseUrl」 | 从同级 `config.example.json` 复制后填地址 |
| 服务没起 | `curl` 连不上 / 超时 | 先自检：`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8899/`，起服务后重试 |
| 两者都缺 | —— | **降级交 md**，并在交付清单里写明「Word 未导出（端点未配）」 |

**三条不许**：不许把「导出失败」写成完成；不许跳过导出直接说交付完成；
不许在导出后不验图——`unzip -l x.docx | grep -c 'word/media/'` 要等于文档里的图片张数（文件名含中文会静默丢图）。
