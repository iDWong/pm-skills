# 详细设计说明书（LLD）模板

> 本模板定义详细设计说明书的完整结构。design-writer 生成每个章节前必须对照本模板。
> 内容规范见 `.agents/knowledge/phase2-design/lld-spec.md`。
> 数据库章节遵循 `phase3-development/database.md`，API 章节遵循 `phase3-development/backend.md`，安全遵循 `conventions/security.md`。

---

## 写作前必读：三大维度与硬性规范

每个功能模块的详细设计包含三大维度：**模块详细设计 + 数据库物理设计 + API详细设计**。

硬性规范（违反即审查不通过）：
- 每张表必须有 `id / created_at / updated_at / created_by / updated_by`
- 表名 snake_case 复数，字段 snake_case，索引名 `idx_表_字段`，外键名 `fk_表_关联表`
- 外键字段必须建索引，单表索引 ≤5，低区分度字段（status）不单独建索引
- API 路径符合 RESTful，响应套用统一格式 `ApiResponse<T>` / `PageResponse<T>`
- 写操作接口标注鉴权/权限码

每张表、每个接口、每个类必须可追溯到 HLD 模块或 SRS 功能。

---

## 文档封面（YAML frontmatter）

```yaml
---
title: "详细设计说明书"
subtitle: "[项目名称]"
author: "Wong"
date: "编制单位：Chaos Dev Studio\n\n[年月中文，如：二零二六年五月]"
lang: zh-CN
toc: true
toc-depth: 3
numbersections: false
geometry: "left=3.17cm,right=3.17cm,top=2.54cm,bottom=2.54cm"
---
```

---

## 一、文档信息

| 项目名称 | [项目名称] |
|---------|-----------|
| 文档版本 | V1.0 |
| 编制日期 | [YYYY-MM-DD] |
| 编制人 | Wong |
| 关联需求文档 | [SRS需求规格说明书文件名] |
| 关联概要设计 | [概要设计说明书文件名] |
| 文档状态 | 草稿 |

**历史版本**

| 版本 | 日期 | 作者 | 更改说明 |
|-----|------|------|---------|
| V1.0 | [YYYY-MM-DD] | Wong | 初始版本 |

---

## 二、引言

### 2.1 编写目的
[说明本详细设计的目的、预期读者（开发工程师），与概要设计的关系]

### 2.2 设计依据
[依据的 SRS、概要设计文档、技术规范]

### 2.3 全局约定
**内容要求：** 贯穿所有模块的通用约定，避免每个模块重复。

- **统一响应格式：** 所有接口返回 `ApiResponse<T>`，列表用 `PageResponse<T>`（结构见 4.x）
- **公共字段：** 所有表含 id / created_at / updated_at / created_by / updated_by
- **命名规范：** 表/字段 snake_case，接口路径 RESTful
- **错误码规范：** [错误码分段规则，如 4xxxx 业务错误]
- **鉴权约定：** [JWT / 权限码机制]

---

## 三、模块详细设计

> 每个功能模块对应 `### 3.x`。3.x 中每个模块包含：模块概述 + 类设计 + 核心流程 + 状态机（如有）+ 异常处理。

### 3.x [模块名称] 详细设计

**模块职责：** [一句话职责 + 边界]（对应 HLD 模块 [x]，SRS 功能 [3.5.x]）

**核心类/服务设计：**

| 类/服务名 | 职责 | 关键方法 |
|----------|------|---------|
| [XxxController] | 接收请求、参数校验 | list / create / update / delete |
| [XxxService] | 业务逻辑、事务控制 | [方法] |
| [XxxRepository] | 数据访问 | [方法] |

**类图：** 调用 diagram-generator 生成（DIAGRAM_TYPE: class），图片命名：`images/lld-[模块]-class.png`

**核心业务流程 — [操作名]：**

时序图：调用 diagram-generator 生成（DIAGRAM_TYPE: sequence），图片命名：`images/lld-[模块]-[操作]-sequence.png`

处理步骤：
1. [参数校验] ...
2. [事务开始] ...
3. [业务逻辑，含分支] ...
4. [跨模块调用，如有] ...
5. [事务提交 / 返回] ...

**状态机（如有明确状态流转）：**

| 当前状态 | 触发条件 | 流转至 | 系统动作 |
|---------|---------|-------|---------|
| 待审核 | 审核通过 | 待整改 | 通知整改人 |

**异常处理：**

| 异常场景 | 处理策略 | 错误反馈 |
|---------|---------|---------|
| 参数校验失败 | 拒绝请求 | 400 + 具体字段错误 |
| 关联数据不存在 | 中止操作 | [错误码 + message] |

---

## 四、数据库物理设计

### 4.1 物理实体关系图

> **图片落盘目录**：PNG 必须渲到 **`dev/design/images/`**（与本说明书同级），文档里引用写 `images/xxx.png`。渲到别处（如集中的 `images/`）会导致 Word 导出丢图（实测）。调 `diagram-generator` 时直接把输出路径指到 `dev/design/images/`。

**必须调用 diagram-generator 技能生成**（DIAGRAM_TYPE: er，含表、主键、外键关系），图片命名：`images/lld-physical-er.png`

### 4.2 数据表清单

| 序号 | 表名 | 业务含义 | 所属模块 |
|-----|------|---------|---------|
| 1 | [table_name] | [含义] | [模块] |

### 4.3 表结构详细设计

> 每张表按以下结构展开：字段表 + 索引表 + 关系 + DDL。

#### 4.3.x [table_name]（[业务含义]）

**字段：**

| 字段名 | 类型 | 允许空 | 键 | 默认值 | 说明 |
|-------|------|-------|----|-------|------|
| id | INT AUTO_INCREMENT | 否 | PK | - | 主键ID |
| [业务字段] | VARCHAR(50) | 否 | - | - | [说明] |
| status | TINYINT | 否 | - | 1 | 状态：1-启用 0-禁用 |
| created_at | DATETIME | 否 | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | - | CURRENT_TIMESTAMP | 更新时间 |
| created_by | INT | 是 | - | NULL | 创建人ID |
| updated_by | INT | 是 | - | NULL | 更新人ID |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|-------|------|------|------|
| PRIMARY | id | 主键 | - |
| idx_[表]_[字段] | [字段] | 普通/唯一 | [建索引理由] |

**关系：**

| 外键名 | 本表字段 | 关联表 | 关联字段 | 关系 |
|-------|---------|-------|---------|------|
| fk_[表]_[关联表] | [字段]_id | [关联表] | id | N:1 |

**建表 DDL：**

```sql
CREATE TABLE `table_name` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  -- 业务字段
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` INT NULL COMMENT '创建人ID',
  `updated_by` INT NULL COMMENT '更新人ID',
  KEY `idx_table_field` (`field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务含义';
```

### 4.4 数据字典（枚举）

| 枚举类型 | 值 | 说明 |
|---------|----|----|
| status | 1 | 启用 |
| ^ | 0 | 停用 |

---

## 五、API 详细设计

### 5.1 通用规范

**统一响应格式：**

```typescript
interface ApiResponse<T> {
  code: number       // 0=成功，非0=业务错误码
  success: boolean
  message: string
  data?: T
  timestamp: number
}

interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

**通用错误码：**

| HTTP | code | message | 场景 |
|------|------|---------|------|
| 401 | 40100 | 未登录或Token失效 | 鉴权失败 |
| 403 | 40300 | 权限不足 | 越权 |
| 500 | 50000 | 服务器内部错误 | 系统异常 |

### 5.2 接口清单

| 序号 | 方法 | 路径 | 用途 | 鉴权/权限码 | 所属模块 |
|-----|------|------|------|-----------|---------|
| 1 | GET | /api/[资源] | 列表 | [资源]:list | [模块] |
| 2 | POST | /api/[资源] | 创建 | [资源]:create | [模块] |

### 5.3 接口详细设计

#### 5.3.x [接口名称] — [METHOD] /api/[路径]

- **用途：** [业务用途]
- **鉴权：** 需登录，权限码 `[资源]:[动作]`

**请求参数：**

| 参数 | 位置 | 类型 | 必填 | 说明 | 校验 |
|-----|------|------|------|------|------|
| [参数] | query/path/body | string | 是 | [说明] | [长度/格式] |

**成功响应：**

```json
{
  "code": 0,
  "success": true,
  "message": "成功",
  "data": { },
  "timestamp": 1716000000000
}
```

**错误码：**

| 场景 | HTTP | code | message |
|-----|------|------|---------|
| [业务错误场景] | 400 | 40001 | [提示] |

- **事务/幂等：** [涉及多表写入或重复提交风险时说明]

---

## 六、安全设计

**内容要求：** 对照 security.md，说明各模块的安全设计。

| 安全维度 | 设计 |
|---------|------|
| 鉴权 | [JWT/Session 机制] |
| 权限控制 | 权限码 + 数据级权限（如只能查本部门） |
| 输入校验 | 参数白名单、防注入 |
| 敏感数据 | 加密存储、传输HTTPS、日志脱敏 |

---

## 七、可追溯矩阵

**内容要求：** 设计要素到上游需求的追溯，确保无遗漏、无多余。

| 设计要素 | 类型 | 追溯来源（HLD模块 / SRS功能） |
|---------|------|---------------------------|
| [table_name] | 表 | [HLD模块] / SRS 3.5.x |
| [METHOD] /api/x | 接口 | [HLD模块] / SRS 3.5.x |

---

**模板说明：**
- 本模板将「详细设计说明书 + 数据库物理设计 + API详细设计」合一为一份文档
- 三、模块详细设计按功能模块拆 `3.x`；四、数据库与五、API 集中编排，便于整体查阅
- 所有图表（类图、时序图、ER图）必须通过 diagram-generator 技能生成
- 数据库遵循 database.md，API 遵循 backend.md，安全遵循 security.md
- 每张表/每个接口/每个类必须在可追溯矩阵中体现
