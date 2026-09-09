# -*- coding: utf-8 -*-
"""wireframe.py 排版自测：每个组件灌超长中文，验证文字不互相重叠、不画出内容区。
跑法：python3 selftest.py [SVG输出目录]     退出码非 0 即为不合格。
改过 wireframe.py 就跑一遍——重叠是这套组件最容易复发的问题。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wireframe import *

OUT = sys.argv[1] if len(sys.argv) > 1 else None
if OUT:
    os.makedirs(OUT, exist_ok=True)
fail = []

def check(g, name):
    c, o = g.collisions(), g.out_of_canvas()
    if c: fail.append((name, "文字重叠", c[:5]))
    if o: fail.append((name, "画出内容区", o[:5]))
    if OUT:
        g.save(os.path.join(OUT, name + ".svg"))

# 1 Web 运营管理系统
g = SVG(1280, 900)
sidebar(g, 900, "运营日报", items=[("仪表盘",0),("会员与权限管理中心",0),("数据统计",1),
        ("  日报订阅配置与推送记录",2),("  超长二级菜单项名称测试",2),("系统设置",0)])
header(g, "管理后台 / 数据统计 / 运营日报 / 日报订阅配置 / 推送记录明细 / 更深一层",
       "数据更新至 2026-09-07 23:59:59（T+1）")
g.rect(200, 62, 1060, 78, fill=FILL)
x = seg(g, 214, 92, ["昨日","近7天","近30天","自定义区间选择"], 3) + 14
x = field(g, x, 92, 190, "内容分类（多选，最多五项）", "架空历史 / 都市异能 / 甜宠 / 悬疑", "select") + 14
x = field(g, x, 92, 150, "统计日期", "2026-09-02 至 2026-09-08", "date") + 14
btn(g, x, 92, 60, "查询并导出全部明细数据", primary=True)
for i, lb in enumerate(["日活跃用户数 DAU（去重口径，含投流）", "短", "内容播放完成率"]):
    kpi(g, 214+i*270, 160, 250, lb, ["128,406,552","7","99.99%"][i],
        ["较上周期 +12.4%（含节假日修正）","持平","-3.1%"][i], [GRN,MUT,RED][i],
        split="自然 96,318,201 ｜ 投流 32,088,351 ｜ 其他 0" if i==0 else None,
        note="口径说明与备注" if i==0 else None)
table(g, 214, 320, 1040, "表1 · 推送明细（超长标题用来挤右上角说明）",
      [("日志ID",18),("内容标题",22),("状态",18),("操作人",18),("备注",24)],
      [[("COMP20260902001234567", INK), ("《架空历史·大明王朝1566实录》第12集 更长的标题", INK),
        ("推送失败（渠道超时，已重试3次）", RED), ("追剧小能手 (U-100886) / 运营三组", MUT),
        ("等待人工复核后重新下发", MUT)],
       [("C1", INK), ("短", INK), ("成功", GRN), ("系统", MUT), ("—", MUT)]])
b = table(g, 214, 430, 1040, "表2 · 折行模式", [("字段",22),("说明",56),("示例",22)],
      [[("push_fail_reason", INK),
        ("推送失败原因枚举：渠道超时 / 用户取消订阅 / 内容已下架 / 风控拦截 / 未知错误，前端按此枚举展示对应文案", INK),
        ("渠道超时", INK)]], wrap_cells=True)
chartbox(g, 214, b+40, 500, 200, "图1 · 核心指标趋势对比", "dual", note="数据更新至 2026-09-07")
chartbox(g, 754, b+40, 250, 200, "图2 · 占比", "donut")
chartbox(g, 1024, b+40, 230, 200, "图3 · 分类", "bar")
check(g, "st-admin")

# 2 移动端三形态
for v, tabs in [("app", [("首页",1),("发现内容广场",0),("消息通知中心",0),("我的",0)]),
                ("miniprogram", [("首页",1),("订单中心",0),("我的",0)]),
                ("h5", None)]:
    g = SVG(900, 960)
    l,t,r,bt = phone(g, 40, 60, variant=v, title="日报订阅配置与推送记录明细页面", tabs=tabs)
    g.rect(l+16, t+12, (r-l)-32, 60, fill=FILL)
    g.t(l+30, t+38, "内容区起点必须在标注带下面，不能被压住", 12, INK, maxw=(r-l)-60)
    foldline(g, l, t+200, r-l)
    note(g, 470, 60, 390, "字段与校验（超长标题也不能捅出框）", [
        "昵称：限 12 个字符，超出时提示「昵称最多 12 个字，请精简后重试」",
        "手机号：仅支持中国大陆号段，格式错误时提示「请输入正确的手机号」",
        "短行"])
    check(g, f"st-{v}")

# 3 Web 官网
g = SVG(1440, 1000)
l,t,r,b = sitepage(g, 0, 0, 1440, 1000,
    nav=["产品功能矩阵","行业解决方案","价格与套餐对比","客户成功案例","开发者资源中心",
         "关于我们","合作伙伴计划","加入我们"],
    cta="立即免费试用 30 天，无需信用卡")
section(g, l, t, r-l, 300, "Hero 主视觉区",
    "一句话讲清价值主张：让每一次内容分发都有数据可依，全链路可追溯、可复盘、可归因，让运营决策不再靠拍脑袋",
    cta="立即开始免费试用")
section(g, l, t+300, r-l, 260, "能力区块", "短说明", cta="了解更多", tone="dark")
check(g, "st-site")

# 4 度量本身：模型宽度不得低于实测（实测值见 wireframe.py 顶部的校准说明）
for s, size, wt, mono, floor in [("管理后台 / 数据统计 / 运营日报", 14, "400", False, 200),
                                 ("数据更新至 2026-09-07 23:59:59", 14, "400", False, 220),
                                 ("abcdefghijklmnopqrstuvwxyz", 14, "400", False, 187),
                                 ("COMP20260902001234567", 14, "400", True, 176)]:
    m = text_width(s, size, wt, mono)
    if m < floor:
        fail.append(("度量", f"{s} 模型 {m:.1f} < 实测 {floor}", []))

if fail:
    for n, k, d in fail:
        print(f"✗ {n}  {k}: {d}")
    sys.exit(1)
print("✓ wireframe 自测通过：无文字重叠、无出框、度量不低估")
