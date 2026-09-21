#!/usr/bin/env python3
"""依 image-list.json 下載舊站的產品、文章、消息圖片到 data/images/（用 Mac 內建 curl）。可重跑，已下載的會跳過。"""
import json, os, subprocess, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(HERE, "image-list.json"), encoding="utf-8"))
ok = skip = fail = 0
for i, (url, local) in enumerate(items, 1):
    dest = os.path.join(HERE, "images", local)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        skip += 1; continue
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    p = urllib.parse.urlsplit(url)
    enc = urllib.parse.urlunsplit((p.scheme, p.netloc, urllib.parse.quote(urllib.parse.unquote(p.path), safe="/()-_.~"), p.query, ""))
    r = subprocess.run(["curl", "-fsSL", "--max-time", "60", "-A", "Mozilla/5.0", "-o", dest, enc], capture_output=True)
    if r.returncode == 0:
        ok += 1; print(f"✓ {i}/{len(items)} {local}")
    else:
        fail += 1; print(f"✗ {i}/{len(items)} {local}")
        if os.path.exists(dest): os.remove(dest)
print(f"\n完成：下載 {ok} 張，已存在 {skip} 張，失敗 {fail} 張")
