#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pm-skills 仓库自检：marketplace / plugin.json / 技能 frontmatter / 跨技能引用 / 图片路径规则。

用法：python3 scripts/validate-plugins.py
零外部依赖。发现问题以非零码退出，可直接接进 CI。
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
errs, warns = [], []


def err(m): errs.append(m)
def warn(m): warns.append(m)


def main() -> int:
    mk_path = ROOT / ".claude-plugin" / "marketplace.json"
    if not mk_path.is_file():
        err("缺 .claude-plugin/marketplace.json"); return report()
    mk = json.loads(mk_path.read_text(encoding="utf-8"))

    declared = {p["name"] for p in mk.get("plugins", [])}
    on_disk = {d.name for d in ROOT.glob("pm-*") if (d / ".claude-plugin" / "plugin.json").is_file()}
    for miss in declared - on_disk:
        err(f"marketplace 声明了 {miss}，但磁盘上没有对应目录")
    for extra in on_disk - declared:
        err(f"磁盘上有 {extra}，但 marketplace 没声明")

    skills = {}
    for pj in sorted(ROOT.glob("pm-*/.claude-plugin/plugin.json")):
        plug = pj.parent.parent
        meta = json.loads(pj.read_text(encoding="utf-8"))
        for key in ("name", "description", "version", "license"):
            if not meta.get(key):
                err(f"{plug.name}/plugin.json 缺 {key}")
        if meta.get("name") != plug.name:
            err(f"{plug.name}/plugin.json 的 name={meta.get('name')} 与目录名不一致")
        sk_dir = plug / "skills"
        if not sk_dir.is_dir():
            err(f"{plug.name} 缺 skills/ 目录"); continue
        for sk in sorted(sk_dir.iterdir()):
            if not sk.is_dir() or sk.name == "common":
                continue
            f = sk / "SKILL.md"
            if not f.is_file():
                err(f"{plug.name}/skills/{sk.name} 缺 SKILL.md"); continue
            t = f.read_text(encoding="utf-8", errors="ignore")
            m = re.match(r"^---\n(.*?)\n---\n", t, re.S)
            if not m:
                err(f"{sk.name}: frontmatter 结构异常"); continue
            fm = m.group(1)
            nm = re.search(r"^name: *(\S+)", fm, re.M)
            if not nm:
                err(f"{sk.name}: frontmatter 缺 name")
            elif nm.group(1).strip('"') != sk.name:
                err(f"{sk.name}: frontmatter name={nm.group(1)} 与目录名不一致")
            if "description:" not in fm:
                err(f"{sk.name}: frontmatter 缺 description")
            elif not re.search(r"[一-鿿]", fm):
                warn(f"{sk.name}: description 不含中文（本库约定中文说明）")
            if sk.name in skills:
                err(f"技能 {sk.name} 在 {skills[sk.name]} 和 {plug.name} 里重复")
            skills[sk.name] = plug.name

    # 跨技能引用可解析（排除子 Agent 名、风格名、参数值等已知假阳性）
    fp = {"req-analyzer", "req-writer", "page-reviewer", "page-spec-loader", "design-analyzer",
          "design-reviewer", "design-writer", "diagram-drawer", "ui-wireframe", "required-indicators",
          "srs-writer", "feature-dev", "pm-skills", "pm-advisory-suite",
          # 假阳性：文件名模板片段与 bundle 目录名，不是技能名
          "delivery-plan-", "feature-priority-", "pm-execution", "pm-prototype",
          "pm-lifecycle", "pm-docs", "pm-shipping", "pm-research", "pm-analytics",
          "pm-strategy", "pm-advisory", "dev-skills"}
    pat = re.compile(r"`((?:pm|ui|req|prd|page|feature|feasibility|delivery|annotation|"
                     r"brainstorming|hld|lld|prototype|diagram)-[a-z0-9-]+)`")
    for sk_name, plug in skills.items():
        base = ROOT / plug / "skills" / sk_name
        txt = "".join(f.read_text(encoding="utf-8", errors="ignore") for f in base.rglob("*.md"))
        for ref in sorted(set(pat.findall(txt))):
            if ref in fp or ref in skills:
                continue
            err(f"{sk_name} 引用了不存在的技能 `{ref}`")

    # references/ 自引用可解析
    for sk_name, plug in skills.items():
        base = ROOT / plug / "skills" / sk_name
        for f in base.rglob("*.md"):
            for ref in set(re.findall(r"`(references/[A-Za-z0-9_./-]+\.md)`", f.read_text(encoding="utf-8", errors="ignore"))):
                if not (base / ref).exists():
                    warn(f"{sk_name} :: {f.name} → {ref} 不存在")

    # 图片路径规则：md 里不该出现带 docs/ 前缀的图片引用
    for f in ROOT.rglob("pm-*/skills/**/*.md"):
        for bad in re.findall(r"!\[[^\]]*\]\((docs/[^)]+)\)", f.read_text(encoding="utf-8", errors="ignore")):
            err(f"{f.relative_to(ROOT)} 的图片引用带 docs/ 前缀：{bad}（Word 导出会丢图）")

    print(f"检查 {len(declared)} 个 plugin / {len(skills)} 个技能")
    return report()


def report() -> int:
    for w in warns:
        print(f"  ⚠️  {w}")
    for e in errs:
        print(f"  ✗ {e}")
    if not errs:
        print(f"  ✓ 通过{f'（{len(warns)} 个警告）' if warns else ''}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
