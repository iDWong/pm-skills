---
name: pm-strategy-frameworks
description: |
  产品战略框架技能。覆盖 12 个经典框架：精益画布、商业模式画布、Startup Canvas、产品战略画布（9 段）、
  产品愿景、价值主张（JTBD 六段）、SWOT、PESTLE、波特五力、安索夫矩阵、定价策略、变现策略，外加双向推演（倒推法+顺推法）。
  能力：(1) 先判断「该用哪个框架」再动手，不套错工具 (2) 按框架产出可评审的战略文档 (3) 多框架交叉引用得出结论。
  触发词：「做个 SWOT」「精益画布」「商业模式画布」「战略画布」「PESTLE」「宏观环境」「波特五力」「五力分析」
  「安索夫矩阵」「增长方向」「产品愿景」「价值主张」「定价策略」「怎么定价」「怎么变现」「商业化路径」「战略分析」「立项论证」，
  或者用户在问「这个市场值不值得进」「我们的护城河是什么」「该往哪个方向长」这类方向性问题时。
  不适用：需求级判断（该不该做、需求真伪）→ pm-advisory-board；写需求文档 → pm-prd-writer / pm-prd-spec；
  竞品逐项拆解 → pm-competitor-deconstructor；TAM/SAM/SOM 测算 → pm-market-research；上市与增长执行 → pm-gtm / pm-growth-marketing。
  参考文档为英文原文，产出语言跟随用户提问语言。
---

# Product Strategy Frameworks

> Scope: the **front half of product decisions** — what to build, where to grow, why we win, how we make money.
> Output is a strategy document, not a requirements document. Once direction is settled and it is time to
> write requirements, hand off to `pm-prd-writer` / `pm-prd-spec`.

**Language**: reference files are the original English sources, except `backcasting-forwardcasting.md`
which is this library's own Chinese content (absorbed from the retired `product-strategy-analyzer`).
Match the user's language in your output — if the user writes Chinese, deliver the document in Chinese
while reading the English references.

## Step 1: Pick the framework first

When the user says "do a strategy analysis", **do not ask which framework they want** — they don't know.
Select by the question they are actually asking:

| What the user is really asking | Framework | Reference |
|---|---|---|
| How does this business actually work / where does money come from | Business Model Canvas (9 blocks) | `references/business-model.md` |
| Are the assumptions behind this new idea sound (fast) | Lean Canvas (9 boxes, assumption-first) | `references/lean-canvas.md` |
| New product needing both strategic clarity and a business model | Startup Canvas | `references/startup-canvas.md` |
| What is our overall strategy (exec-ready) | Product Strategy Canvas (9 sections) | `references/product-strategy.md` |
| Team has no direction / need one north-star sentence | Product Vision | `references/product-vision.md` |
| Why us and not the alternative | Value Proposition (JTBD, 6 parts) | `references/value-proposition.md` |
| Where do we stand (internal + external sweep) | SWOT | `references/swot-analysis.md` |
| What macro variables exist / risks of entering this country | PESTLE | `references/pestle-analysis.md` |
| Is this industry worth entering / who captures the profit | Porter's Five Forces | `references/porters-five-forces.md` |
| Which direction do we grow next | Ansoff Matrix (2×2) | `references/ansoff-matrix.md` |
| How much do we charge / how do we tier | Pricing Strategy | `references/pricing-strategy.md` |
| What are our revenue options and their risks | Monetization Strategy (3-5 options) | `references/monetization-strategy.md` |
| Will this direction still exist in 5-10 years / can we get there from here | 双向推演（倒推法 + 顺推法） | `references/backcasting-forwardcasting.md`（中文） |

**The three canvases are the easiest to confuse. Use this:**

| | Fits | Emphasis |
|---|---|---|
| Business Model Canvas | Established business, corporate strategy, investor materials | Describes how things run today |
| Lean Canvas | Early idea, speed over completeness | Problems and assumptions |
| Startup Canvas | New product, needs both | Strategic clarity + business model — **default for new products** |

## Step 2: Workflows

Full step-by-step orchestration lives in `references/workflows/`. Four composed flows:

### Workflow A — Full strategy document (most common)
`references/workflows/strategy.md`, using `product-strategy.md` + `product-vision.md`.
Gather context → walk all 9 canvas sections → generate document → offer next steps.
Give **specific content, never generic advice**. For early-stage products some sections are hypotheses —
**label them as hypotheses**, do not present them as conclusions.

### Workflow B — Macro environment scan (before entering a new market)
`references/workflows/market-scan.md`.
`pestle-analysis.md` (external variables) → `porters-five-forces.md` (industry attractiveness) →
`swot-analysis.md` (fold external findings back into internal position).
Output: enter / don't enter / enter-if, plus the unknowns that must be researched first.

**PESTLE and SWOT are complementary, not redundant** — macro vs. micro. Run PESTLE first and drop its
conclusions straight into SWOT's O/T quadrants.

### Workflow C — Pricing and monetization
`references/workflows/pricing.md`.
`monetization-strategy.md` first (3-5 revenue options with audience fit, unit economics, risks, validation
experiments) → once a direction is chosen, `pricing-strategy.md` for price points and tiers.

**Never skip monetization and go straight to pricing.** Settle "what we charge for" before "how much" —
reversed, you produce an elegant price for the wrong business model.

### Workflow D — Value proposition
`references/workflows/value-proposition.md`, using `value-proposition.md`.
One JTBD six-part statement **per segment** — never one generic version. Cross-check the "Alternatives"
part against `pm-competitor-deconstructor` output rather than imagining competitors.
For outward-facing copy (taglines, hero sections) hand off to `pm-growth-marketing`.

### Workflow E — Direction stress test (backcasting + forwardcasting)
`references/backcasting-forwardcasting.md` (Chinese).
Search competitors and market → backcast from the 5-10 year end state → forwardcast from today →
**collide the two** into one of four verdicts (both work / right but not yet / dangerous short-term window / drop it).

Run this **before** writing a full strategy for a genuinely new direction, or **after** as a stress test.
The single most useful question in it: *does this product still exist in the end state?* A direction that
fails that one doesn't need a prettier roadmap.

## Quality checklist

Before delivering a strategy document:

- [ ] **Trade-offs section is non-empty** — states what we will NOT do and who we will NOT serve. A strategy with only YES and no NO is not a strategy
- [ ] Vision is one memorable, emotional sentence — not "become the industry-leading provider of…"
- [ ] Every segment has its own value proposition; no single generic version papering over all of them
- [ ] Hypotheses and conclusions are **labeled separately**; "no real moat yet" is an acceptable answer for an early product — better than inventing one
- [ ] Metrics section separates north star / input metrics / guardrails, rather than listing parallel KPIs
- [ ] Defensibility names the **type** (network effects, data, brand, switching costs, economies of scale) — not just "better UX"
- [ ] Top 3 strategic risks are things that could **actually invalidate the strategy**, not generic "competition intensifies"
- [ ] Framework fits the question — re-check against the Step 1 table

## Fallbacks

- **Severely insufficient input** (can't even state what the product does): do not produce a hollow filled-in framework. Output the 4 blanks that would unblock you
- **User names a framework that clearly doesn't fit**: do it their way first, and add one line — "this framework answers X, you're asking Y, and Z fits Y better" — then let them decide
- **Asked for specific numbers (market size, price points) with no data**: give the calculation method and formula, leave the number as a blank. **Do not invent numbers**
- **Cross-framework conclusions contradict each other**: surface the contradiction as a finding and state each one's preconditions. Do not force a reconciliation

**Flow output path**: when run as `pm-master` stage -2, write the strategy document to
`docs/strategy.md` (the flow's gate globs `docs/strategy*.md`). Standalone runs may write anywhere the user asks.

## Handoffs

**Upstream** — `pm-master` stage -2 of the single 13-stage lifecycle flow (before market research);
`pm-advisory-board` (after the board judges a direction worth pursuing, come here to write it up).

**Downstream** — `pm-gtm` (strategy → market entry, ICP, beachhead); `pm-growth-marketing` (value prop → positioning, naming, north star);
`pm-market-research` (TAM/SAM/SOM data to backfill); `pm-roadmap-planner` (strategy → roadmap);
`pm-okr-designer` (metrics section → quarterly OKRs); `pm-prd-writer` / `pm-prd-spec` (direction settled → write requirements).

**Handoff summary format** (≤10 lines): framework used / core conclusion / what we explicitly won't do / open hypotheses / recommended next step.
