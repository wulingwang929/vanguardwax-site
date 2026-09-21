#!/usr/bin/env python3
"""把 vanguardwax.com 的產品、分類、文章、消息頁面存成 HTML，給 Claude 整理用。只用 Python 內建功能。"""
import os, re, time, csv, urllib.request, urllib.parse, hashlib, sys

BASE = "https://www.vanguardwax.com"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "raw")
os.makedirs(OUT, exist_ok=True)
START = [
    "/", "/product.html", "/msg/latest-news.html", "/msg/news.html", "/msg/car-care.html",
    "/msg/car-care-tips.html", "/msg/latest-products.html", "/msg/company-profile.html",
    "/msg/vanguard-story.html", "/msg/catalog.html", "/msg/where-to-buy.html",
    "/contact/contact.html", "/privacy/privacy.html", "/site-map/site-map.html",
    "/webls-en-us/index.html", "/webls-en-us/product.html", "/webls-en-us/site-map/site-map.html",
]
KEEP = re.compile(r"^/(webls-en-us/)?(index\.html|product[^/]*\.html|category[^/]*\.html|msg/[^/]+\.html|"
                  r"contact/contact\.html|privacy/privacy\.html|site-map/site-map\.html|product\.html)?$")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) VanguardwaxInventory/1.0"}
LIMIT = 1500

def norm(href, cur):
    if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    u = urllib.parse.urljoin(BASE + cur, href)
    p = urllib.parse.urlparse(u)
    if p.netloc not in ("www.vanguardwax.com", "vanguardwax.com"):
        return None
    path = urllib.parse.unquote(p.path)
    path = re.sub(r"/+", "/", path)
    return path if KEEP.match(path) else None

def fetch(path):
    # 用 Mac 內建的 curl 下載（它使用系統憑證，避免 Python 憑證問題）
    import subprocess
    url = BASE + urllib.parse.quote(path, safe="/()-_.")
    r = subprocess.run(["curl", "-fsSL", "--max-time", "30", "-A", UA["User-Agent"], url],
                       capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode("utf-8", "replace").strip() or f"curl exit {r.returncode}")
    return r.stdout.decode("utf-8", errors="replace")

seen, queue, rows = set(), list(START), []
while queue and len(seen) < LIMIT:
    path = queue.pop(0)
    if path in seen:
        continue
    seen.add(path)
    try:
        html = fetch(path)
    except Exception as e:
        rows.append([path, "", f"ERROR {e}"])
        print("✗", path, e); continue
    name = hashlib.md5(path.encode()).hexdigest()[:12] + ".html"
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(html)
    rows.append([path, name, "ok"])
    print(f"✓ {len(seen):4d}  {path}")
    for href in re.findall(r'href\s*=\s*["\']([^"\']+)["\']', html, re.I):
        n = norm(href, path)
        if n and n not in seen:
            queue.append(n)
    time.sleep(0.25)

with open(os.path.join(HERE, "raw-index.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["path", "file", "status"]); w.writerows(rows)
ok = sum(1 for r in rows if r[2] == "ok")
print(f"\n完成：成功 {ok} 頁，失敗 {len(rows)-ok} 頁。檔案在 {OUT}")
