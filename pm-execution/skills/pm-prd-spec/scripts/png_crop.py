# -*- coding: utf-8 -*-
"""纯 Python PNG 裁边：去掉 qlmanage 渲染 SVG 时补出来的方形透明留白。"""
import zlib, struct, sys

def chunks(d):
    assert d[:8]==b'\x89PNG\r\n\x1a\n'
    i=8
    while i<len(d):
        ln=struct.unpack('>I',d[i:i+4])[0]; typ=d[i+4:i+8]; data=d[i+8:i+8+ln]
        yield typ,data; i+=8+ln+4

def load(path):
    d=open(path,'rb').read(); idat=b''; ihdr=None
    for t,c in chunks(d):
        if t==b'IHDR': ihdr=struct.unpack('>IIBBBBB',c)
        elif t==b'IDAT': idat+=c
    w,h,bd,ct,comp,filt,il=ihdr
    assert bd==8 and ct in (2,6) and il==0, f"unsupported PNG {bd=} {ct=} {il=}"
    bpp=4 if ct==6 else 3
    raw=zlib.decompress(idat); stride=w*bpp
    out=bytearray(h*stride); prev=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; p+=1
        cur=bytearray(raw[p:p+stride]); p+=stride
        if f==1:
            for x in range(bpp,stride): cur[x]=(cur[x]+cur[x-bpp])&0xFF
        elif f==2:
            for x in range(stride): cur[x]=(cur[x]+prev[x])&0xFF
        elif f==3:
            for x in range(stride):
                a=cur[x-bpp] if x>=bpp else 0
                cur[x]=(cur[x]+((a+prev[x])>>1))&0xFF
        elif f==4:
            for x in range(stride):
                a=cur[x-bpp] if x>=bpp else 0
                b=prev[x]; c=prev[x-bpp] if x>=bpp else 0
                pa=abs(b-c); pb=abs(a-c); pc=abs(a+b-2*c)
                pr=a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                cur[x]=(cur[x]+pr)&0xFF
        out[y*stride:(y+1)*stride]=cur; prev=cur
    return w,h,bpp,out

def bbox(w,h,bpp,px):
    stride=w*bpp
    # 画布右下角必为留白（canvas=max(w,h)，内容锚定左上）
    off=( (h-1)*stride + (w-1)*bpp )
    corner=bytes(px[off:off+bpp])
    def blank(off):
        if bpp==4 and px[off+3]==0: return True
        return bytes(px[off:off+bpp])==corner
    top=0
    while top<h and all(blank(top*stride+x*bpp) for x in range(w)): top+=1
    bot=h-1
    while bot>top and all(blank(bot*stride+x*bpp) for x in range(w)): bot-=1
    left=0
    while left<w and all(blank(y*stride+left*bpp) for y in range(top,bot+1)): left+=1
    right=w-1
    while right>left and all(blank(y*stride+right*bpp) for y in range(top,bot+1)): right-=1
    return left,top,right,bot

def save(path,w,h,bpp,px,box):
    l,t,r,b=box; nw,nh=r-l+1,b-t+1; stride=w*bpp; ns=nw*bpp
    raw=bytearray()
    for y in range(t,b+1):
        raw.append(0); raw+=px[y*stride+l*bpp : y*stride+(r+1)*bpp]
    ct=6 if bpp==4 else 2
    def ch(typ,data):
        return struct.pack('>I',len(data))+typ+data+struct.pack('>I',zlib.crc32(typ+data)&0xFFFFFFFF)
    out=b'\x89PNG\r\n\x1a\n'
    out+=ch(b'IHDR',struct.pack('>IIBBBBB',nw,nh,8,ct,0,0,0))
    out+=ch(b'IDAT',zlib.compress(bytes(raw),9))
    out+=ch(b'IEND',b'')
    open(path,'wb').write(out)
    return nw,nh

if __name__=='__main__':
    src,dst=sys.argv[1],sys.argv[2]
    w,h,bpp,px=load(src)
    box=bbox(w,h,bpp,px)
    nw,nh=save(dst,w,h,bpp,px,box)
    print(f"  {w}x{h} -> {nw}x{nh}")
