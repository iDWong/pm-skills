# -*- coding: utf-8 -*-
"""生成后台 / 移动端 / 官网线框图 SVG。风格：灰阶线框，仅语义色（涨跌/告警）用彩色。

排版铁律（改这个文件前先看这段）：
SVG 的 <text> 不换行、不截断、也不会撑开它所在的框——超出部分照样画出来，
于是长中文串直接压在隔壁元素上，就是"生成 SVG 时内容重叠"的全部成因。
所以本文件的规矩是：

  1. 凡是画字，先用 text_width() 量宽，再决定 ellipsize()（截断加省略号）或 wrap()（折行）。
  2. 凡是画框，框宽要么由量出来的文字宽度算出来，要么把文字截断到框内，禁止两边各写死一个数。
  3. 禁止用 len(s)*常数 估宽——中英混排一个字符 0.29em 到 1.0em 不等，估必错。
  4. 画完可以调 g.collisions() 自查：任何两段文字的包围盒相交都会被列出来。

生成脚本收尾建议加一句 `assert not g.collisions(), g.collisions()`，重叠就当场失败。
"""
FONT = "PingFang SC, Hiragino Sans GB, Helvetica, Arial, sans-serif"
MONO = "Menlo, Monaco, Courier New, monospace"
INK, MUT, LINE, FILL, HEAD = "#1f2430", "#6b7280", "#c8cdd6", "#f6f7f9", "#eceef2"
RED, GRN, YEL = "#d64545", "#2f9e5f", "#c9910d"

def esc(s): return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

# ---------- 文字度量：所有排版的地基 ----------
# 下表是在本机用 qlmanage 实测出来的字符步进宽度（单位 em），方法是差分法：
# 同一字符画 20 遍和 40 遍各渲一次，宽度差 ÷ 20 得到步进，从而消掉字形左右边距。
# 换字体、换渲染器就必须重测——凭手感填数正是"生成 SVG 内容重叠"的根源。
_ADV = {
 ' ':0.331,'|':0.194,'l':0.234,'I':0.237,"'":0.244,'i':0.256,',':0.263,';':0.263,
 'j':0.266,'.':0.266,':':0.266,'(':0.331,')':0.334,'[':0.334,']':0.334,'!':0.334,
 'f':0.344,'t':0.356,'1':0.400,'v':0.484,'z':0.491,'y':0.497,'\u00b7':0.500,'/':0.500,
 's':0.506,'x':0.509,'J':0.516,'k':0.531,'?':0.537,'7':0.547,'c':0.547,'e':0.556,
 'a':0.559,'n':0.559,'u':0.562,'F':0.575,'d':0.584,'q':0.584,'L':0.588,'b':0.588,
 'o':0.588,'p':0.588,'r':0.588,'h':0.591,'g':0.594,'0':0.600,'2':0.600,'3':0.600,
 '4':0.600,'5':0.600,'6':0.600,'8':0.600,'9':0.600,'#':0.600,'-':0.606,'+':0.606,
 '=':0.606,'T':0.619,'Z':0.622,'S':0.631,'E':0.637,'V':0.637,'X':0.637,'P':0.644,
 'A':0.656,'Y':0.662,'R':0.675,'B':0.678,'K':0.691,'D':0.706,'U':0.713,'H':0.719,
 'N':0.719,'C':0.728,'&':0.728,'G':0.747,'w':0.753,'O':0.766,'Q':0.766,'m':0.856,
 '@':0.859,'M':0.884,'W':0.928,'%':0.969,
}
_ASCII_FALLBACK = 0.62     # 没实测过的 ASCII：取偏大值，宁可多留白也不要压线
_MONO_ADV = 0.605          # Menlo 等宽，ASCII 全部同宽
_BOLD = 1.03               # 加粗只让西文变宽，中日韩字形宽度不变
_SAFETY = 1.015            # 统一安全余量，吸收渲染器之间的零头差异

def _char_w(ch, mono):
    if mono and ord(ch) < 0x2000:
        return _MONO_ADV
    v = _ADV.get(ch)
    if v is not None:
        return v
    if ord(ch) >= 0x2000:  # 中日韩、假名、全角标点、几何符号、通用标点：一律全角
        return 1.0
    return _ASCII_FALLBACK

def text_width(s, size=13, weight="400", mono=False):
    """量一段文字画出来有多宽（px）。所有排版决策都从这里出发。"""
    if not s:
        return 0.0
    bold = str(weight) in ("500", "600", "700", "800", "900", "bold")
    tot = 0.0
    for ch in s:
        w = _char_w(ch, mono)
        if bold and not mono and ord(ch) < 0x2000:
            w *= _BOLD
        tot += w
    return size * tot * _SAFETY

def ellipsize(s, maxw, size=13, weight="400", mono=False, ell="…"):
    """截断到 maxw 以内，末尾补省略号。maxw 为 None 表示不限宽。"""
    if not s or maxw is None:
        return s
    if maxw <= 0:
        return ""
    if text_width(s, size, weight, mono) <= maxw:
        return s
    ew = text_width(ell, size, weight, mono)
    if ew > maxw:
        return ""
    keep = 0
    for i in range(1, len(s)+1):
        if text_width(s[:i], size, weight, mono) + ew > maxw:
            break
        keep = i
    return (s[:keep] + ell) if keep else ell

def _tokens(s):
    """折行用的切分：中日韩字符逐字可断，ASCII 连写段整体不断，空格作分隔。"""
    out, buf = [], ""
    for ch in s:
        if ch == " ":
            if buf: out.append(buf); buf = ""
            out.append(" ")
        elif ord(ch) >= 0x2000:
            if buf: out.append(buf); buf = ""
            out.append(ch)
        else:
            buf += ch
    if buf: out.append(buf)
    return out

def wrap(s, maxw, size=13, weight="400", mono=False, max_lines=None):
    """把一段文字折成多行。超出 max_lines 时最后一行截断加省略号。"""
    if not s:
        return [""]
    if maxw is None or text_width(s, size, weight, mono) <= maxw:
        return [s]
    lines, cur = [], ""
    for tk in _tokens(s):
        if tk == " " and not cur:
            continue                                     # 行首吞掉空格
        cand = cur + tk
        if text_width(cand, size, weight, mono) <= maxw or not cur:
            cur = cand
        else:
            lines.append(cur.rstrip())
            cur = "" if tk == " " else tk
        # 单个 ASCII 词就超宽：硬断
        while text_width(cur, size, weight, mono) > maxw and len(cur) > 1:
            cut = len(cur)
            while cut > 1 and text_width(cur[:cut], size, weight, mono) > maxw:
                cut -= 1
            lines.append(cur[:cut])
            cur = cur[cut:]
    if cur.strip():
        lines.append(cur.rstrip())
    if max_lines and len(lines) > max_lines:
        keep = lines[:max_lines]
        keep[-1] = ellipsize(keep[-1] + lines[max_lines][:2], maxw, size, weight, mono)
        lines = keep
    return lines or [""]


class SVG:
    def __init__(s, w, h):
        # qlmanage 会按短边缩放并裁剪，因此画布强制为正方形，
        # 内容只画在 w×h 区域，其余保持透明，交给 png_crop.py 裁掉。
        s.w, s.h, s.o = w, h, []
        s.canvas = max(w, h)
        s.boxes = []          # 每段文字的包围盒，供 collisions() 自查
        s.rect(0, 0, w, h, fill="#ffffff", stroke="#aeb4be", sw=2)
    def rect(s,x,y,w,h,fill="none",stroke=LINE,sw=1,rx=3,dash=None):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        s.o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
    def line(s,x1,y1,x2,y2,stroke=LINE,sw=1,dash=None):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        s.o.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
    def t(s,x,y,txt,size=13,fill=INK,anchor="start",weight="400",mono=False,maxw=None,track=True):
        """画一行字。maxw 给了就截断到框内——这是防重叠的第一道闸。"""
        txt = ellipsize(txt, maxw, size, weight, mono) if maxw is not None else txt
        if not txt:
            return 0.0
        f = MONO if mono else FONT
        # xml:space="preserve"：不加的话 SVG 会把连续空格塌缩成一个、并吃掉首尾空格，
        # 渲染宽度就和 text_width() 算的对不上（侧边栏那两个缩进空格也会凭空消失）。
        s.o.append(f'<text xml:space="preserve" x="{x}" y="{y}" font-family="{f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}">{esc(txt)}</text>')
        tw = text_width(txt, size, weight, mono)
        x0 = x if anchor == "start" else (x - tw if anchor == "end" else x - tw/2)
        if track:
            s.boxes.append((x0, y - size*0.80, x0 + tw, y + size*0.22, txt))
        return tw
    def tblock(s,x,y,txt,w,size=13,fill=INK,anchor="start",weight="400",mono=False,lh=None,max_lines=None):
        """画一段会折行的字，返回占用高度。y 是第一行基线。"""
        lh = lh or size*1.45
        ls = wrap(txt, w, size, weight, mono, max_lines)
        for i, ln in enumerate(ls):
            s.t(x, y + i*lh, ln, size, fill, anchor, weight, mono)
        return len(ls)*lh
    def poly(s,pts,stroke=INK,sw=2,dash=None,fill="none"):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        p=" ".join(f"{a},{b}" for a,b in pts)
        s.o.append(f'<polyline points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
    def circ(s,x,y,r,fill=INK,stroke="none"):
        s.o.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}"/>')
    def diamond(s,x,y,r,fill=RED):
        s.o.append(f'<polygon points="{x},{y-r} {x+r},{y} {x},{y+r} {x-r},{y}" fill="{fill}"/>')
    def collisions(s, tol=1.0):
        """列出所有互相压住的文字对。生成脚本收尾 assert 它为空。"""
        bad = []
        b = s.boxes
        for i in range(len(b)):
            ax0, ay0, ax1, ay1, at = b[i]
            for j in range(i+1, len(b)):
                bx0, by0, bx1, by1, bt = b[j]
                if ax0 < bx1-tol and bx0 < ax1-tol and ay0 < by1-tol and by0 < ay1-tol:
                    bad.append((at, bt))
        return bad
    def out_of_canvas(s, tol=1.0):
        """列出画到内容区之外的文字（裁边后会被切掉或糊在边框上）。"""
        return [t for (x0,y0,x1,y1,t) in s.boxes
                if x0 < -tol or y0 < -tol or x1 > s.w+tol or y1 > s.h+tol]
    def save(s,path):
        body="\n".join(s.o)
        C=s.canvas
        open(path,"w",encoding="utf-8").write(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{C}" height="{C}" viewBox="0 0 {C} {C}">\n{body}\n</svg>')

# ---------- 复用组件 ----------
SIDEBAR_W = 180

def sidebar(g, h, active, items=None, w=SIDEBAR_W):
    g.rect(1,1,w-2,h-2, fill=FILL, stroke=LINE, rx=0)
    g.t(20,34,"运营后台",14,INK,weight="600",maxw=w-40)
    g.line(1,50,w-1,50)
    items = items or [("仪表盘",0),("会员管理",0),("短视频管理",0),("数据统计",1),
           ("  运营日报",2),("  日报订阅配置",2),("  日报推送记录",2),("订单管理",0),("系统设置",0)]
    y=78
    for name,lv in items:
        if name.strip()==active:
            g.rect(8,y-15,w-17,26, fill="#dfe3ea", stroke="none")
            g.t(20,y+3,name,12.5,INK,weight="600",maxw=w-36)
        else:
            g.t(20,y+3,name,12.5,MUT if lv==2 else INK,maxw=w-36)
        y+= 30 if lv!=2 else 26
    return

def header(g, crumb, right=None, left=SIDEBAR_W):
    g.line(left,48,g.w-1,48)
    rw = 0
    if right:
        rw = text_width(right, 11.5)
        g.t(g.w-20,30,right,11.5,MUT,anchor="end")
    # 面包屑只能用掉右侧说明之外的地方，否则长面包屑会压在日期上
    g.t(left+20,30,crumb,13,MUT,maxw=g.w-20-rw-24-(left+20))

def btn(g,x,y,w,txt,primary=False,ghost=False,h=30,size=12.5):
    """按钮宽度按文字实测值自动撑开，返回实际宽度——传进来的 w 只是下限。"""
    w = max(w, text_width(txt, size, "500" if primary else "400") + 28)
    if primary:
        g.rect(x,y,w,h, fill="#1f2430", stroke="#1f2430"); g.t(x+w/2,y+h*0.67,txt,size,"#ffffff",anchor="middle",weight="500")
    elif ghost:
        g.rect(x,y,w,h, fill="none", stroke=LINE, dash="4 3"); g.t(x+w/2,y+h*0.67,txt,size,MUT,anchor="middle")
    else:
        g.rect(x,y,w,h, fill="#ffffff", stroke="#9aa1ac"); g.t(x+w/2,y+h*0.67,txt,size,INK,anchor="middle")
    return w

def field(g,x,y,w,label,val,ctrl="select"):
    g.t(x,y-6,label,11,MUT,maxw=w)
    g.rect(x,y,w,30, fill="#ffffff")
    # 右侧控件占位必须从可用宽度里扣掉，否则值一长就压在箭头/日历图标上
    pad = 26 if ctrl in ("select","date") else 10
    g.t(x+10,y+20,val,12,INK,maxw=w-10-pad)
    if ctrl=="select": g.poly([(x+w-20,y+13),(x+w-15,y+18),(x+w-10,y+13)],stroke=MUT,sw=1.5)
    if ctrl=="date": g.rect(x+w-24,y+8,14,14, fill="none", stroke=MUT)
    return x+w

def seg(g,x,y,opts,sel,pad=None):
    """分段控件：每段宽度按该段文字实测值算，不按字数估。"""
    cx=x
    for i,o in enumerate(opts):
        weight = "500" if i==sel else "400"
        w = text_width(o, 12, weight) + 26
        g.rect(cx,y,w,30, fill="#1f2430" if i==sel else "#ffffff", stroke="#9aa1ac" if i!=sel else "#1f2430")
        g.t(cx+w/2,y+20,o,12,"#ffffff" if i==sel else INK,anchor="middle",weight=weight)
        cx+=w-1
    return cx

def kpi(g,x,y,w,label,num,delta,dcolor,split=None,note=None,h=96):
    g.rect(x,y,w,h, fill="#ffffff")
    nw = 0
    if note:
        nw = text_width(note, 10)
        g.t(x+w-14,y+22,note,10,YEL,anchor="end")
    # 角标和标题同一条基线：标题可用宽度要减掉角标，否则两段字直接叠在一起
    g.t(x+14,y+22,label,11.5,MUT,maxw=w-28-(nw+10 if note else 0))
    # 主数字宁可缩号也不许出框——指标卡最常见的溢出点
    nsize = 25
    while nsize > 15 and text_width(num, nsize, "600", True) > w-28:
        nsize -= 0.5
    g.t(x+14,y+52,num,nsize,INK,weight="600",mono=True,maxw=w-28)
    ar="▲" if dcolor==GRN else ("▼" if dcolor==RED else "▬")
    g.t(x+14,y+72,f"{ar} {delta}",11.5,dcolor,maxw=w-28)
    if split:
        g.line(x+10,y+h-24,x+w-10,y+h-24)
        g.t(x+14,y+h-8,split,10.5,MUT,maxw=w-28)

def table(g,x,y,w,title,cols,rows,rowh=26,note=None,wrap_cells=False,max_lines=3):
    """表格。wrap_cells=True 时长文本折行并自动加高行；否则截断到列宽内。返回表格底部 y。"""
    tw_title = text_width(title, 13, "600")
    g.t(x,y-8,title,13,INK,weight="600")
    if note: g.t(x+w,y-8,note,10.5,MUT,anchor="end",maxw=w-tw_title-20)
    th=28
    cw=[c[1] for c in cols]; total=sum(cw)
    widths=[w*fr/total for fr in cw]
    xs=[]; acc=x
    for ww in widths: xs.append(acc); acc+=ww

    def cell_mono(v): return any(ch.isdigit() for ch in v) and len(v)<14

    if wrap_cells:
        heights=[]
        for row in rows:
            n=1
            for (val,_col),ww in zip(row,widths):
                n=max(n,len(wrap(val,ww-16,11,mono=cell_mono(val),max_lines=max_lines)))
            heights.append(max(rowh, n*15+11))
    else:
        heights=[rowh]*len(rows)
    H=th+sum(heights)

    g.rect(x,y,w,H, fill="#ffffff")
    g.rect(x,y,w,th, fill=HEAD, stroke=LINE)
    for i,((name,_fr),cx,ww) in enumerate(zip(cols,xs,widths)):
        g.t(cx+8,y+19,name,11,INK,weight="600",maxw=ww-16)
        if i: g.line(cx,y,cx,y+H)
    ry=y+th
    for r,row in enumerate(rows):
        if r: g.line(x,ry,x+w,ry)
        for (val,col),cx,ww in zip(row,xs,widths):
            mono=cell_mono(val)
            if wrap_cells:
                for k,ln in enumerate(wrap(val,ww-16,11,mono=mono,max_lines=max_lines)):
                    g.t(cx+8,ry+16+k*15,ln,11,col,mono=mono)
            else:
                g.t(cx+8,ry+17,val,11,col,mono=mono,maxw=ww-16)
        ry+=heights[r]
    return y+H

def chartbox(g,x,y,w,h,title,kind,note=None):
    tw_title = text_width(title, 13, "600")
    g.t(x,y-8,title,13,INK,weight="600")
    if note: g.t(x+w,y-8,note,10.5,MUT,anchor="end",maxw=w-tw_title-20)
    g.rect(x,y,w,h, fill="#ffffff")
    ax_l, ax_b, ax_r = x+42, y+h-30, x+w-16
    HINT = 22                      # 顶部图例带：留出来，曲线不许画进去，否则图例压曲线标名
    ax_t = y+16+HINT
    ph = ax_b-ax_t
    g.line(ax_l,ax_t,ax_l,ax_b); g.line(ax_l,ax_b,ax_r,ax_b)
    for i in range(4): g.t(ax_l-6,ax_t+10+i*((ph-10)/3),"—",9,MUT,anchor="end")

    def label(lx, ly, txt, size, color, anchor="end"):
        # 末端标名会正好落在曲线上，先垫一块白底，字才读得清
        tw = text_width(txt, size)
        x0 = lx if anchor == "start" else (lx - tw if anchor == "end" else lx - tw/2)
        g.rect(x0-3, ly-size*0.85, tw+6, size*1.15, fill="#ffffff", stroke="none", rx=2)
        g.t(lx, ly, txt, size, color, anchor=anchor)

    def hint(txt):
        hw = text_width(txt, 9.5) + 14
        g.rect(ax_r-hw,y+12,hw,18, fill="#ffffff", stroke=LINE, dash="3 2")
        g.t(ax_r-hw+7,y+25,txt,9.5,MUT,maxw=hw-14)

    n=8; step=(ax_r-ax_l)/(n-1)
    if kind in ("line","dual"):
        import math
        p1=[(ax_l+i*step, ax_b-12-abs(math.sin(i*0.8))*(ph-26)*0.9) for i in range(n)]
        g.poly(p1,stroke=INK,sw=2)
        for px,py in p1: g.circ(px,py,2.6,INK)
        label(p1[-1][0]-6,p1[-1][1]-9,"自然" if kind=="dual" else "DAU",10,INK)
        if kind=="dual":
            p2=[(ax_l+i*step, ax_b-8-abs(math.cos(i*0.7))*(ph-26)*0.45) for i in range(n)]
            g.poly(p2,stroke=MUT,sw=2,dash="6 4")
            label(p2[-1][0]-6,p2[-1][1]+16,"投流",10,MUT)
            g.diamond(p2[4][0],p2[4][1],4.5,RED); label(p2[4][0]+8,p2[4][1]-8,"异常",9.5,RED,anchor="start")
        g.t(ax_l,ax_b+18,"09-01",9,MUT); g.t(ax_r,ax_b+18,"09-07",9,MUT,anchor="end")
        hint("实线/虚线+末端标名")
    if kind=="donut":
        cxp,cyp=x+w*0.32,y+h*0.54; R=min(w*0.18,h*0.28); r=R*0.55
        g.circ(cxp,cyp,R,fill="none",stroke=INK); g.circ(cxp,cyp,r,fill="#ffffff",stroke=INK)
        g.line(cxp,cyp-R,cxp,cyp-r,stroke=INK); g.line(cxp+R*0.86,cyp+R*0.5,cxp+r*0.86,cyp+r*0.5,stroke=INK)
        g.t(cxp,cyp+4,"占比",11,MUT,anchor="middle",maxw=r*1.8)
        lx=x+w*0.56; lw=x+w-16-lx
        for i,(nm,pc) in enumerate([("自然","74.6%"),("投流","25.4%")]):
            ly=y+h*0.36+i*26
            g.rect(lx,ly,10,10,fill=INK if i==0 else "#ffffff",stroke=INK,rx=1)
            g.t(lx+18,ly+9,f"{nm}  {pc}",11,INK,maxw=lw-18)
        g.t(lx,y+h-22,"每片直标名称+百分比",9.5,MUT,maxw=lw)
    if kind=="bar":
        vals=[0.92,0.74,0.55,0.38]; names=["剧情","搞笑","知识","生活"]
        bw=(ax_r-ax_l)/len(vals)
        for i,v in enumerate(vals):
            bh=(ax_b-ax_t-6)*v
            g.rect(ax_l+i*bw+bw*0.22,ax_b-bh,bw*0.40,bh,fill=HEAD,stroke=INK)
            g.t(ax_l+i*bw+bw*0.42,ax_b+18,names[i],10,MUT,anchor="middle",maxw=bw-6)
        pts=[(ax_l+i*bw+bw*0.42, ax_t+8+i*((ph-16)/4)) for i in range(len(vals))]
        g.poly(pts,stroke=MUT,sw=1.6,dash="5 3")
        for px,py in pts: g.circ(px,py,2.6,MUT)
        hint("柱=播放量 · 点线=完播率")


# ---------- 移动端框架 ----------
def phone(g, x, y, w=375, h=812, variant="app", title="页面标题", tabs=None, bezel=True, annotate=True):
    """画手机框，返回内容区 (left, top, right, bottom)。

    variant: app / miniprogram / h5
    tabs:    [(名称, 是否选中), ...]，None 表示无底部 Tab
    annotate: 画平台约束标注（胶囊按钮区 / 微信容器标题栏）。标注会占掉一条 22px 的带，
              并把返回的 top 下推——否则标注和页面内容会画在同一处。
    """
    if bezel:
        g.rect(x-8, y-8, w+16, h+16, fill="#ffffff", stroke="#8b93a0", sw=2, rx=26)
    g.rect(x, y, w, h, fill="#ffffff", stroke=LINE, rx=20)
    # 状态栏
    SB = 44
    g.rect(x, y, w, SB, fill=HEAD, stroke="none", rx=20)
    g.rect(x, y+20, w, SB-20, fill=HEAD, stroke="none", rx=0)
    g.t(x+18, y+28, "9:41", 12, INK, weight="600")
    g.t(x+w-16, y+28, "▮▮▮  ⌁  ▊", 11, INK, anchor="end")
    if variant == "app":
        # 灵动岛：真实尺寸约 126×37pt，居中，距屏幕顶 11pt
        iw, ih = 125, 36
        g.rect(x+(w-iw)/2, y+11, iw, ih, fill="#1f2430", stroke="none", rx=18)
        if y >= 24:   # 手机上方有空间时才画外部引线标注
            g.line(x+w/2, y-9, x+w/2, y+9, stroke=MUT, dash="2 2")
            g.t(x+w/2, y-14, "灵动岛（内容需避让）", 9, MUT, anchor="middle")
    top = y + SB
    # 导航栏
    NB = 44
    g.rect(x, top, w, NB, fill="#ffffff", stroke=LINE, rx=0)
    g.t(x+16, top+28, "‹", 20, INK)
    lpad = 40
    rpad = {"miniprogram": 104, "h5": 46}.get(variant, 40)
    avail = w - lpad - rpad
    # 标题居中于"可用区"而不是整条导航栏，避让右侧胶囊/更多按钮
    g.t(x+lpad+avail/2, top+28, title, 14, INK, anchor="middle", weight="600", maxw=avail)
    if variant == "miniprogram":
        g.rect(x+w-96, top+11, 80, 22, fill="#ffffff", stroke="#9aa1ac", rx=11)
        g.circ(x+w-72, top+22, 4, fill="none", stroke=MUT)
        g.line(x+w-56, top+16, x+w-56, top+28, stroke=LINE)
        g.circ(x+w-40, top+22, 4, fill="none", stroke=MUT)
    if variant == "h5":
        g.t(x+w-20, top+28, "···", 16, INK, anchor="end")
    top += NB
    if annotate and variant in ("miniprogram", "h5"):
        txt = "胶囊按钮区不可覆盖" if variant == "miniprogram" else "容器标题栏（微信）"
        g.t(x+w-16, top+14, txt, 8.5, MUT, anchor="end", maxw=w-32)
        top += 22            # 标注自己占一条带，内容从带下面开始
    # 底部
    bottom = y + h
    SAFE = 34
    if tabs:
        TB = 49
        bottom = y + h - SAFE - TB
        g.rect(x, bottom, w, TB, fill=FILL, stroke=LINE, rx=0)
        tw = w / len(tabs)
        for i, (name, active) in enumerate(tabs):
            cx = x + i*tw + tw/2
            g.rect(cx-9, bottom+9, 18, 18, fill="none",
                   stroke=INK if active else MUT, rx=4)
            g.t(cx, bottom+42, name, 10,
                INK if active else MUT, anchor="middle",
                weight="600" if active else "400", maxw=tw-8)
    else:
        bottom = y + h - SAFE
    # 安全区
    g.rect(x, y+h-SAFE, w, SAFE, fill="#ffffff", stroke="none", rx=0)
    g.line(x, y+h-SAFE, x+w, y+h-SAFE, stroke=LINE, dash="3 3")
    g.rect(x+w/2-60, y+h-16, 120, 5, fill="#c8cdd6", stroke="none", rx=3)
    g.t(x+16, y+h-20, "安全区 34pt", 8.5, MUT, maxw=w/2-76)
    return (x, top, x+w, bottom)


def note(g, x, y, w, title, lines, color=MUT):
    """线框图右侧的说明块。长行自动折行并撑高块体——不折行就会横着捅出框外。"""
    inner = w - 20
    wrapped = []
    for s in lines:
        wrapped.extend(wrap(s, inner, 10.5))
    h = 30 + len(wrapped)*17
    g.rect(x, y, w, h, fill="#ffffff", stroke=color, dash="4 3")
    g.t(x+10, y+18, title, 11.5, INK, weight="600", maxw=inner)
    for i, s in enumerate(wrapped):
        g.t(x+10, y+40+i*17, s, 10.5, MUT, maxw=inner)
    return y + h + 12


def foldline(g, x, y, w, label="首屏折线"):
    """长页面上标出首屏位置。"""
    g.line(x, y, x+w, y, stroke=RED, sw=1.5, dash="8 5")
    g.t(x+w-6, y-6, label, 10, RED, anchor="end", maxw=w-12)


# ---------- 官网框架 ----------
def sitepage(g, x, y, w, h, nav=None, cta="免费试用", brand="LOGO", footer=True):
    """画官网页面框（顶部导航 + 页脚），返回内容区 (left, top, right, bottom)。

    导航项按实测宽度排布，右侧两个按钮从右往左定位；导航排不下时截断成「···」，
    绝不让导航文字撞进 CTA 按钮。
    """
    nav = nav or ["产品", "解决方案", "定价", "客户案例", "资源"]
    g.rect(x, y, w, h, fill="#ffffff", stroke=LINE, rx=2)
    NH = 64
    g.rect(x, y, w, NH, fill="#ffffff", stroke=LINE, rx=0)
    g.rect(x+32, y+22, 72, 20, fill=HEAD, stroke=LINE, rx=3)
    g.t(x+68, y+36, brand, 11, INK, anchor="middle", weight="600", maxw=64)
    # 右侧按钮先按文字量宽，再从右边缘往回排
    ctaw = text_width(cta, 12, "500") + 32
    secw = text_width("联系销售", 12) + 28
    cta_x = x + w - 32 - ctaw
    sec_x = cta_x - 12 - secw
    g.rect(sec_x, y+18, secw, 30, fill="#ffffff", stroke="#9aa1ac", rx=4)
    g.t(sec_x+secw/2, y+38, "联系销售", 12, INK, anchor="middle")
    g.rect(cta_x, y+18, ctaw, 30, fill="#1f2430", stroke="#1f2430", rx=4)
    g.t(cta_x+ctaw/2, y+38, cta, 12, "#ffffff", anchor="middle", weight="500")
    cx = x + 140
    limit = sec_x - 24
    for i, item in enumerate(nav):
        iw = text_width(item, 12.5)
        if cx + iw > limit:
            if cx + 20 <= limit:
                g.t(cx, y+38, "···", 12.5, MUT)
            break
        g.t(cx, y+38, item, 12.5, INK)
        cx += iw + 28
    top = y + NH
    bottom = y + h
    if footer:
        FH = 120
        bottom = y + h - FH
        g.rect(x, bottom, w, FH, fill=FILL, stroke=LINE, rx=0)
        colw = (w-64)/4
        for i, col in enumerate(["产品", "解决方案", "公司", "法律"]):
            fx = x + 32 + i*colw
            g.t(fx, bottom+28, col, 11.5, INK, weight="600", maxw=colw-16)
            for j in range(3):
                g.t(fx, bottom+48+j*16, "链接项", 10, MUT, maxw=colw-16)
        g.line(x+32, bottom+FH-30, x+w-32, bottom+FH-30)
        g.t(x+32, bottom+FH-12, "© 2026 公司名 · 隐私政策 · 服务条款 · 京ICP备00000000号", 10, MUT, maxw=w-64)
    return (x, top, x+w, bottom)


def section(g, x, y, w, h, name, desc, cta=None, tone="plain"):
    """官网的一个内容区块。tone: plain / tinted / dark

    标题、描述、CTA 依次垂直堆叠——描述折行后下面的 CTA 跟着下移，不会被压住。
    """
    fill = {"plain": "#ffffff", "tinted": FILL, "dark": "#1f2430"}[tone]
    fg = "#ffffff" if tone == "dark" else INK
    fgm = "#aeb4be" if tone == "dark" else MUT
    g.rect(x, y, w, h, fill=fill, stroke=LINE, rx=0)
    inner = w*0.72
    dlines = wrap(desc, inner, 12)
    block = 26 + len(dlines)*20 + (46 if cta else 0)
    cy = y + max(28, (h - block)/2) + 20
    g.t(x+w/2, cy, name, 20, fg, anchor="middle", weight="600", maxw=inner)
    cy += 26
    for ln in dlines:
        g.t(x+w/2, cy, ln, 12, fgm, anchor="middle")
        cy += 20
    if cta:
        bw = text_width(cta, 13, "600") + 44
        g.rect(x+w/2-bw/2, cy+6, bw, 36,
               fill="#22C55E" if tone == "dark" else "#1f2430",
               stroke="none", rx=4)
        g.t(x+w/2, cy+30, cta, 13,
            "#0F172A" if tone == "dark" else "#ffffff",
            anchor="middle", weight="600")
    return y + h
