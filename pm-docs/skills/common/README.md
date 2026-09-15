# Word export tools

Cross-platform helpers for exporting Markdown to `.docx`. 端点从 `<skills-root>/config.json`
（**本目录的上一级**）的 `apiBaseUrl` 读取。

> **端点不随仓库分发**：`config.json` 需自行创建——从 `config.example.json` 复制后填入你自己的
> 文档导出服务地址。未配置时本目录三个脚本会报 `无法从 config.json 读取 apiBaseUrl`。
> 接口契约见仓库 README 的「导出功能需要自己配端点」一节。

## Windows (PowerShell, Python 3)

```powershell
# 从任一技能目录执行
../common/export-word.ps1 dev/SRS/你的文档.md req-doc
```

## Git Bash / Linux / macOS

```bash
# 从任一技能目录执行
bash ../common/export-word.sh dev/SRS/你的文档.md req-doc
```

## Cross-platform (Python 3)

```bash
# 从任一技能目录执行
python ../common/export-word.py dev/SRS/你的文档.md req-doc
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
<文档所在目录>/            ← 如 dev/SRS/、prd/PRD/
├── 你的文档.md
└── images/
    └── wf-01-daily-report.png    ← 与文档同级的 images/ 子目录，纯 ASCII 文件名
```

Markdown 里写 `![图注](images/wf-01-daily-report.png)`。

**「与文档同级」按文档实际落盘目录算，不是固定 `docs/images/`**：

| 文档 | 落在 | 图片放 |
|---|---|---|
| SRS | `dev/SRS/` | `dev/SRS/images/` |
| PRD | `prd/PRD/` | `prd/PRD/images/` |
| 概要／详细设计 / 功能清单 | `dev/design/` | `dev/design/images/` |
| 可研／设计方案 | `prd/planning/` | `prd/planning/images/` |
| 产品链阶段产出 | `prd/{strategy,research,planning}/` | 各自的 `images/` |
| 研发链测试／审计／发版 | `dev/{test,reports,release}/` | 各自的 `images/` |

调 `diagram-generator` 渲图时**直接把输出路径指到目标文档的 `images/`**，别渲到一个集中目录再想着引用。

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

---

## ⚠️ 文档署名统一写 `Wong`

**「编制人 / 作者 / 修订人 / 修改人 / 起草人」四类署名字段，一律填 `Wong`。**
不要填「产品部」「架构组」「测试组」这类部门名，也不要留 `-`、`xxx`、`[编制人]`、`[作者]` 这类占位。

| 字段 | 值 |
| --- | --- |
| 文档信息表「编制人」/「起草人」 | `Wong` |
| 历史版本 / 修订历史表的「作者」「修订人」列 | `Wong`（每一行都写，含历史行） |
| 审核人 / 批准人 / 复审人 | 维持 `-`（不是署名，是评审角色） |
| 文档信息表「编制单位」+ 封面 YAML 里的 `编制单位：` | `Chaos Dev Studio` |
| 封面 YAML 的 `author:`（不带「编制单位：」前缀的那种） | `Wong` |
| 文档信息表「客户单位」行 | **不动**，保留甲方原值（内部产品写 `-`） |

模板里已经把这些位置写死（署名 `Wong`、单位 `Chaos Dev Studio`），照抄即可；就地修订加版本记录行时也写 `Wong`。
适用于所有产出正式文档的技能：`req-doc`、`prd-writer`、`pm-prd-spec`、`prototype-to-prd`、
`feasibility-report`、`feature-list`、`hld-design`、`lld-design`、`pm-test-cases`、
`pm-operation-manual`、`pm-market-research`、`pm-tracking-spec-writer`。

---

## ⚠️ 就地修订也必须改文件名

**文件名里的版本号、文首「文档版本」、版本记录表末行，三者必须一致。** 文档落盘后再动内容，就是一个新版本。

### 🚮 同一份文档只留一个文件：最高版本那份

**不论体量大小，一份文档在目录里永远只有一个文件——版本号最高的那个。**
`V1.0` 升到 `V1.1`，目录里就只剩 `V1.1`；升到 `V2.0`，就只剩 `V2.0`。
**不要另存新版留档，不要 V1.0/V1.1/V1.2 一排躺在那儿。**

| 文档体量 | 怎么改 |
| --- | --- |
| 小（几百行以内） | 就地 `Edit` 改，**改完 `mv` 改名**。不要另存新文件 |
| **大（几千行 / MB 级：PRD、SRS、详细设计）** | **就地 `Edit` 改**，别整份重写——改完同样 `mv` 改名 |

**叫法统一为「版本记录」**：文首那张表一律写 `**版本记录：**` 或 `## 版本记录`，
不要写成「版本历史」「**历史版本**」「修订记录」「**修订历史**」「变更记录」「更新记录」等任何变体
——**词序颠倒的「历史版本」最容易漏**，它既不在多数人的检索词里，又长得像标准叫法。
叫法不统一，后续按名字检索会漏掉，从而误判成「这份文档没记沿革」（实际踩过：按「版本历史」
去 grep，结果整批「历史版本」全部漏检，差点给一份已有版本表的文档再补一张）。
（文档正文里记业务变更的章节仍可叫「变更记录」，那是另一回事，不受本条约束。）

**改叫法时必须连模板一起改。** 技能的 `references/templates/*.md` 与 `examples/*.md` 才是叫法的源头，
只改 SKILL.md 里的散文表述，下一份照模板生成的文档还是旧叫法——2026-09-16 实际发生过：
规则与 11 处引用点都改成了「版本记录」，5 个模板仍写「历史版本」，于是 4 个项目里 12 份文档
继续按旧叫法产出。**改完用下面这行自查，词表要含词序颠倒的变体**：

```bash
grep -rnE '(版本历史|历史版本|修订记录|修订历史|变更历史|修改记录|更新记录)' --include='*.md' . 
```

**为什么不留旧版**：旧版内容靠**版本记录表**（文首那张，每次修订加一行）和 **git** 记录，
不靠文件名堆积。一个目录里躺着 V1.0/V1.1/V1.2 三份，评审时没人知道该看哪份、
下游引用哪份，导出的 `.docx` 更是对不上号——**这是文档垃圾，不是留档**。

**已经堆了多份的目录怎么收**：确认最高版本内容完整（含此前各版的修订）后，
**删掉低版本文件**，并把它们的修订记录合并进版本记录表。删之前 `grep` 一遍旧文件名，
把引用改到新版（见下方「改完名同步改引用」）。删除前先向用户确认一次，别自己动手清。

**唯一例外**：用户**原话**要求保留某个历史版本（如"V1.0 已经发给客户了，留着"）。
这时把旧版移到 `<目录>/archive/` 子目录并在 README 清单里注明，**不要与现行版本同级平放**。

就地修订三件事，缺一不可：

```bash
# ① Edit 改内容  ② 改文首「文档版本」+ 版本记录表加一行  ③ mv 改文件名
mv "dev/SRS/20260518-XX项目-SRS需求规格说明书-V1.0.md" \
   "dev/SRS/$(date +%Y%m%d)-XX项目-SRS需求规格说明书-V1.1.md"
```

版本步进：局部修订 `+0.1`（`V1.0` → `V1.1`），结构性重写进大版本（`V2.0`）。日期取本次改动当天。

**最常犯的错：内容已经是 V1.1，文件名还写 V1.0。** 评审时没人知道手上是哪一版，`.docx` 导出稿与 Markdown 也对不上号。

改完名**同步改引用它的地方**，否则下游静默断链：

- 项目根 `README-PRD.md` / `README-SRS.md` 的清单行与目录树
- 下游文档文首的「来源 PRD」「来源 SRS」行
- `tools/` 下硬编码该路径的脚本、原型 `_src/` 里的出稿口径文案
- 已导出的 `.docx`（旧名那份要么一起改名，要么重导）

`grep -rn "<旧文件名去掉扩展名>" .` 扫一遍，确认零残留再算改完。

### 例外：活文档不适用本规则

少数文件的性质是**持续就地更新的追踪表**，不是一版一版归档的交付物。它们**不带日期、不带版本号，
改内容也不改文件名**：

| 文件 | 为什么例外 |
| --- | --- |
| `dev/plan/delivery-plan-{项目名称}.md` | 每完成一个功能就回写进度，按版本走一天能产出几十个文件，历史版本无价值 |
| `prd/planning/requirements.md` | 需求澄清阶段的工作底稿，随讨论持续增补 |

**只有这两类例外。** SRS、PRD、可研、功能清单、概要设计、详细设计、测试用例、操作手册
全部适用上面的规则，不要因为「改起来麻烦」就往例外里塞。
