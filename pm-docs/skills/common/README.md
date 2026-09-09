# Word export tools

Cross-platform helpers for exporting Markdown to `.docx` via ``<skills-root>/config.json`（本目录的上一级）` (`apiBaseUrl`).

## Windows (PowerShell, Python 3)

```powershell
# 从任一技能目录执行
../common/export-word.ps1 docs/spec.md req-doc
```

## Git Bash / Linux / macOS

```bash
# 从任一技能目录执行
bash ../common/export-word.sh docs/spec.md req-doc
```

## Cross-platform (Python 3)

```bash
# 从任一技能目录执行
python ../common/export-word.py docs/spec.md req-doc
```

## Templates

| Template | Use case |
| --- | --- |
| `req-doc` | Requirements specification |
| `test-cases` | Test cases |
| `operation-manual` | Operation manual |
| `feasibility-report` | Feasibility report |
| `feature-list` | Feature list |
| `default` | Default |
| `formal` | Formal |
| `simple` | Simple |

Output file: same directory as the Markdown file, same basename with `.docx`.

---

## ⚠️ 图片只有一种可用写法（其余**静默丢图**）

图片文件名含中文（或任何非 ASCII 字符）时，导出会**静默丢图**：

- 脚本照样打印 `Found N local image(s)`、逐行列出图片、最后 `Export succeeded`
- 服务端也返回 200
- **但生成的 docx 里只有空图框加图注，`word/media/` 是空的**

2026-09-08 实测：`images/wf-01-运营日报.png` → docx 65KB、0 张图；
同样内容改名 `images/wf-01-daily-report.png` → docx 1.5MB、5 张图全部嵌入。

原因：multipart 的 filename 字段带非 ASCII 时服务端匹配不上 Markdown 里的图片路径，退化成占位图框。
**因为不报错，只看脚本输出会以为成功。**

### 唯一可用的写法

```
docs/
├── 你的文档.md
└── images/
    └── wf-01-daily-report.png    ← 与文档同级的 images/ 子目录，纯 ASCII 文件名
```

Markdown 里写 `![图注](images/wf-01-daily-report.png)`。

**「与文档同级」按文档实际落盘目录算，不是固定 `docs/images/`**：

| 文档 | 落在 | 图片放 |
|---|---|---|
| SRS | `docs/SRS/` | `docs/SRS/images/` |
| PRD | `docs/PRD/` | `docs/PRD/images/` |
| 概要／详细设计 | `docs/02-架构与设计/` | `docs/02-架构与设计/images/` |
| 可研／功能清单 | `docs/01-需求与规划/` | `docs/01-需求与规划/images/` |
| 流程阶段产出 | `docs/` 根 | `docs/images/` |

调 `diagram-generator` 渲图时**直接把输出路径指到目标文档的 `images/`**，别渲到 `docs/images/` 再想着引用。

### 实测边界（2026-09-10 全部跑过一遍）

| Markdown 里的路径 | word/media | 结果 |
|---|---|---|
| `images/wf-01-flow.png` | 1 张 | ✅ **唯一可用形式** |
| `img/wf-04.png` | 0 张 | ❌ 目录名必须正好是 `images` |
| `images/sub/wf-05.png` | 0 张 | ❌ 不能再套子目录 |
| `assets/img/wf-02.png` | 0 张 | ❌ |
| `wf-03.png`（与文档同目录） | 0 张 | ❌ 必须在 `images/` 里 |
| `../images/wf-01.png` | 0 张 | ❌ 不能含 `../` |
| `images/运营日报.png` | 0 张 | ❌ 文件名不能有非 ASCII |

机制：`export-word.py` 把 **Markdown 里的路径字符串原样**当 multipart 的 `filename` 发给服务端
（`files.append(("files", image_path, ...))`），服务端只认 `images/<ASCII名>` 这一种形式，
其余匹配不上就退化成空图框。**脚本侧一律打印 `+ <路径>` 和 `Export succeeded`，看不出区别。**

### 规则

1. **图片放在文档同级的 `images/` 子目录，文件名纯 ASCII**（中文只放 alt 文本和图注）
2. 图片在别处 → **先拷进「与本文档同级的 `images/`」**（按上表定目录）再引用，不要用 `../` 跨目录引
3. **导出后立刻验证**：

```bash
unzip -l <生成的.docx> | grep -c "word/media/"
```

这个数字**必须等于文档里的图片张数**。docx 体积也是信号——本次实测同一张 7KB 的 PNG：
嵌入成功 31073 字节 / 丢图 23702–23862 字节，**差值就是那张图**。纯文字文档约 23.5KB 是基线。

3. 数字不对 → 检查图片文件名，改成 ASCII 后重新导出。**不要把"脚本说成功了"当作成功。**

适用于所有走本脚本的技能：`req-doc`、`prd-writer`、`prototype-to-prd`、`feasibility-report`、
`feature-list`、`hld-design`、`lld-design`、`pm-test-cases`、`pm-operation-manual`、`pm-prd-spec`。
