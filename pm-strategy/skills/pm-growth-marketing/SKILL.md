---
name: pm-growth-marketing
description: |
  产品增长与营销技能。覆盖 5 个模块：北极星指标（含三类商业游戏判定 + 7 条有效性校验）、
  产品定位（对标竞品的差异化定位语）、价值主张文案（营销/销售/新手引导三种口径）、
  产品命名（5 个候选 + 理由）、营销点子（5 个低成本创意 + 渠道与话术）。
  能力：(1) 定北极星指标与 3–5 个输入指标构成指标星系 (2) 把价值主张翻译成对外能用的文案
  (3) 出定位、命名、营销创意候选并给取舍理由。
  触发词：「北极星指标」「NSM」「该盯哪个指标」「指标星系」「产品定位」「定位语」「怎么跟竞品区分」
  「差异化定位」「产品命名」「起个名字」「营销文案」「宣传语」「slogan」「落地页文案」「营销点子」
  「低成本推广」「新手引导文案」，或者用户在问「我们对外该怎么讲」时。
  不适用：战略与价值主张本身 → pm-strategy-frameworks；渠道打法与增长循环 → pm-gtm；
  品牌视觉与 Logo → brand / design；指标埋点落地 → pm-tracking-spec-writer；
  数据归因分析 → pm-analytics。参考文档为英文原文，产出语言跟随用户提问语言。
---

# Growth & Marketing

> Scope: **turning strategy into outward-facing language and one number the team steers by.**
> Assumes value proposition exists (`pm-strategy-frameworks`) and ICP is chosen (`pm-gtm`).

**Language**: reference files are the original English sources. Deliver in the user's language —
naming and taglines in particular must be generated natively in the target language, never translated.

## Step 1: Pick the module

| What the user is really asking | Module | Reference |
|---|---|---|
| Which single metric should we steer by | North Star Metric | `references/north-star-metric.md` |
| How do we differentiate from competitor X | Positioning Ideas | `references/positioning-ideas.md` |
| Turn our value prop into copy | Value Prop Statements | `references/value-prop-statements.md` |
| Name this product | Product Name | `references/product-name.md` |
| Cheap creative ways to promote this | Marketing Ideas | `references/marketing-ideas.md` |

## Step 2: Workflows

### Workflow A — North Star Metric
`references/workflows/north-star.md`, using `north-star-metric.md`.

1. **Classify the business game first** — Attention / Transaction / Productivity. The game determines
   which metric shapes are even legitimate; skipping this step is how teams end up with DAU as a north
   star for a productivity tool
2. Propose the north star, then 3-5 **input metrics** that form the constellation
3. Validate the candidate against the **7 criteria** in the reference — a candidate failing 3+ is rejected, not softened

**A north star is one metric.** If the output has two, the work isn't finished.

### Workflow B — Outward-facing language
`references/workflows/market-product.md`, using `positioning-ideas.md` + `value-prop-statements.md`
+ `product-name.md` + `marketing-ideas.md`.

Chain: positioning (vs. named competitors) → value prop statements (three registers: marketing / sales /
onboarding) → naming → campaign ideas.

Positioning must **name actual competitors**. A positioning statement that doesn't say what it's positioned
against is a description, not a position.

## Quality checklist

- [ ] North star is **one** metric, with the business game stated explicitly
- [ ] North star passed the 7-criteria validation; failures are reported, not glossed over
- [ ] Input metrics are levers the team can actually move — not smaller versions of the north star
- [ ] Positioning names real competitors and states what we are positioned *against*
- [ ] Copy in each register is genuinely different: marketing (attention), sales (objection), onboarding (first action)
- [ ] Every claim in the copy traces to a value proposition or a real capability — no invented superlatives
- [ ] Names are checked for the obvious problems: pronounceability, existing product collision, unfortunate meanings in the target language
- [ ] Marketing ideas state cost order of magnitude and the channel, not just the creative idea

## Fallbacks

- **No value proposition upstream**: don't write copy on top of nothing. Send it to `pm-strategy-frameworks` first, or produce copy plus an explicit "based on these assumed value props" header
- **User wants a north star but the product has no usage data**: define the candidate and the instrumentation needed to measure it (`pm-tracking-spec-writer`), flagged as not-yet-measurable
- **Naming with trademark implications**: generate candidates and state plainly that trademark and domain clearance is out of scope and must be checked before use
- **Asked to claim something not true** (fastest, cheapest, only): refuse that specific claim, offer the defensible version

## Handoffs

**Upstream** — `pm-strategy-frameworks` (value proposition, strategy); `pm-gtm` (ICP, beachhead, chosen motions);
`pm-competitor-deconstructor` (who to position against). Not a numbered stage in the 13-stage flow —
attached on demand after stage -1 (`pm-master` lists it under 流程外的 Skill).

**Downstream** — `pm-tracking-spec-writer` (north star + input metrics → event spec and QA SQL);
`pm-okr-designer` (north star → quarterly OKRs); `pm-analytics` (once data flows, attribution and diagnosis);
`pm-experiment-designer` (test positioning and copy variants); `brand` / `design` (visual identity for the chosen name and positioning).

**Handoff summary format** (≤10 lines): business game / north star + why / input metrics / positioning one-liner / chosen name / next step.
