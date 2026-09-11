---
name: pm-gtm
description: |
  产品上市（Go-to-Market）技能。覆盖 6 个模块：滩头市场选择、理想客户画像（ICP）、GTM 策略、
  7 种 GTM 打法（Inbound / Outbound / 付费投放 / 社区 / 伙伴 / ABM / PLG）、5 类增长循环
  （病毒 / 使用 / 协作 / UGC / 推荐）、竞品销售战报卡。
  能力：(1) 定「第一个市场打谁」和「理想客户长什么样」(2) 选打法组合并算增长循环系数
  (3) 出完整上市计划与销售对抗物料。
  触发词：「上市计划」「GTM」「怎么打开市场」「第一批客户找谁」「滩头市场」「ICP」「理想客户画像」
  「增长循环」「病毒增长」「飞轮」「获客渠道怎么选」「PLG」「ABM」「发布计划」「战报卡」「销售话术」
  「客户问为什么不选竞品」，或者用户在问「产品做好了但卖不动」「该投哪个渠道」时。
  不适用：战略方向与定价 → pm-strategy-frameworks；定位语/命名/北极星指标 → pm-growth-marketing；
  竞品四维深度拆解 → pm-competitor-deconstructor（战报卡是销售用的对抗物料，不是分析报告）；
  发版说明 → pm-release-notes。参考文档为英文原文，产出语言跟随用户提问语言。
---

# Go-to-Market

> Scope: **how the product reaches its market**. Assumes direction and pricing are settled
> (`pm-strategy-frameworks`). Produces market-entry decisions and launch artifacts.

**Language**: reference files are the original English sources. Deliver in the user's language.

## Step 1: Pick the module

| What the user is really asking | Module | Reference |
|---|---|---|
| Which market do we attack first | Beachhead Segment | `references/beachhead-segment.md` |
| Who exactly is our best customer | Ideal Customer Profile | `references/ideal-customer-profile.md` |
| Full launch plan | GTM Strategy | `references/gtm-strategy.md` |
| Which channels / which motion mix | 7 GTM Motions | `references/gtm-motions.md` |
| How does growth compound on itself | 5 Growth Loops | `references/growth-loops.md` |
| Sales asks "why not competitor X?" | Competitive Battlecard | `references/competitive-battlecard.md` |

## Step 2: Workflows

### Workflow A — Full launch plan
`references/workflows/plan-launch.md`.
Beachhead → ICP → positioning & messaging → channels → launch timeline.

**Order matters**: beachhead before ICP, ICP before channels. A channel plan written before the ICP is
a budget allocation exercise, not a GTM strategy.

Beachhead is scored on four criteria (`beachhead-segment.md`): burning pain, willingness to pay,
winnable share, referral potential. A segment that scores high on pain but low on **winnable share**
is the classic trap — big need, but you can't win it yet.

### Workflow B — Growth strategy
`references/workflows/growth-strategy.md`, using `growth-loops.md` + `gtm-motions.md`.
Pick primary and secondary loops, compute the loop coefficient, then choose the motion mix that feeds them.

**Loops and motions are not alternatives.** Loops are how growth compounds; motions are how you prime the
pump. A motion mix with no loop behind it stops the day you stop spending.

### Workflow C — Competitive battlecard
`references/workflows/battlecard.md`.
One card per competitor: positioning, feature comparison, pricing comparison, objection handling, win/loss patterns.

This is a **sales-facing combat artifact**, not an analysis document — claims must be defensible in front of
a prospect. For deep competitive analysis use `pm-competitor-deconstructor` and feed its conclusions in here.

## Quality checklist

- [ ] Beachhead names **one** segment, not a ranked list of five. Choosing is the deliverable
- [ ] Beachhead scored on all four criteria, with winnable-share honestly assessed
- [ ] ICP is built from actual customer data or clearly labeled as hypothesis — not demographics invented to match the product
- [ ] Motion mix is 2-3 motions, not all 7. Every motion listed has an owner and a budget order of magnitude
- [ ] At least one growth loop with an estimated coefficient; if the coefficient is below 1, say so explicitly rather than calling it a loop
- [ ] Messaging traces back to a value proposition from `pm-strategy-frameworks`, not written fresh here
- [ ] Battlecard claims are verifiable — no unsourced "we're faster than X"
- [ ] Launch plan has a date, an owner, and a go/no-go criterion per milestone

## Fallbacks

- **No customer data for the ICP**: build the hypothesis version, label every field as hypothesis, and hand back a PMF/ICP survey to run (`pm-survey-designer`)
- **User wants all 7 motions**: pick 2-3 and state what gets dropped and why. Spreading across 7 motions with one team is the most common GTM failure
- **Product has no plausible growth loop**: say so. Not every product is loop-driven; some are legitimately sales-led. Don't fabricate a viral mechanism
- **Battlecard on an unfamiliar competitor with no data**: list what needs researching rather than guessing feature parity

**Flow output path**: when run as `pm-master` stage -1, write the GTM plan to `prd/strategy/gtm.md`
(the flow's gate globs `prd/strategy/gtm*.md`). Standalone runs may write anywhere the user asks.

## Handoffs

**Upstream** — `pm-strategy-frameworks` (strategy, value prop, pricing settled); `pm-market-research` (segment sizing);
`pm-competitor-deconstructor` (competitive intel feeding the battlecard);
`pm-master` stage -1 of the single 13-stage lifecycle flow (run under the 全量 or 立项 tailoring).

**Downstream** — `pm-growth-marketing` (positioning statements, naming, north star metric from the chosen ICP);
`pm-okr-designer` (launch metrics → OKRs); `pm-tracking-spec-writer` (funnel and loop instrumentation);
`pm-experiment-designer` (channel and loop experiments); `pm-release-notes` (launch communication).

**Handoff summary format** (≤10 lines): beachhead chosen / ICP one-liner / primary loop + coefficient / motion mix / launch date / biggest open risk.
