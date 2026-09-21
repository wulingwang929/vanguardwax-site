#!/bin/bash
# 下載 vanguardwax.com 的 logo 與照片到這個資料夾
cd "$(dirname "$0")"
mkdir -p logo photos
ok=0; fail=0
if curl -fsSL -A "Mozilla/5.0" -o "logo/logo.png" "https://www.vanguardwax.com/templates/03/images/logo.png"; then echo "✓ logo/logo.png"; ok=$((ok+1)); else echo "✗ logo/logo.png"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/banner-kyoei.jpg" "https://www.vanguardwax.com/proimages/banner/%E5%8D%94%E5%87%B1%E8%BC%AA%E6%92%AD.jpg"; then echo "✓ photos/banner-kyoei.jpg"; ok=$((ok+1)); else echo "✗ photos/banner-kyoei.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/banner-rh5015.jpg" "https://www.vanguardwax.com/proimages/banner/RH5015-EN-2000x880.jpg"; then echo "✓ photos/banner-rh5015.jpg"; ok=$((ok+1)); else echo "✗ photos/banner-rh5015.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/banner-super-protection.jpg" "https://www.vanguardwax.com/proimages/banner/2025-supre-BANNER(2000X880).jpg"; then echo "✓ photos/banner-super-protection.jpg"; ok=$((ok+1)); else echo "✗ photos/banner-super-protection.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/banner-ktv.jpg" "https://www.vanguardwax.com/proimages/banner/KTV-2000x880.jpg"; then echo "✓ photos/banner-ktv.jpg"; ok=$((ok+1)); else echo "✗ photos/banner-ktv.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/banner-rh5070.jpg" "https://www.vanguardwax.com/proimages/banner/RH5070-EN-2000x880.jpg"; then echo "✓ photos/banner-rh5070.jpg"; ok=$((ok+1)); else echo "✗ photos/banner-rh5070.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/banner-clay.jpg" "https://www.vanguardwax.com/proimages/banner/CLAY-EN-2000x880.jpg"; then echo "✓ photos/banner-clay.jpg"; ok=$((ok+1)); else echo "✗ photos/banner-clay.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/section-about.jpg" "https://www.vanguardwax.com/proimages/index/about.jpg"; then echo "✓ photos/section-about.jpg"; ok=$((ok+1)); else echo "✗ photos/section-about.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/section-contact.jpg" "https://www.vanguardwax.com/proimages/index/con.jpg"; then echo "✓ photos/section-contact.jpg"; ok=$((ok+1)); else echo "✗ photos/section-contact.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/section-news.jpg" "https://www.vanguardwax.com/proimages/index/news.jpg"; then echo "✓ photos/section-news.jpg"; ok=$((ok+1)); else echo "✗ photos/section-news.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-01.jpg" "https://www.vanguardwax.com/proimages/com/01.jpg"; then echo "✓ photos/company-01.jpg"; ok=$((ok+1)); else echo "✗ photos/company-01.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-02.jpg" "https://www.vanguardwax.com/proimages/com/02.jpg"; then echo "✓ photos/company-02.jpg"; ok=$((ok+1)); else echo "✗ photos/company-02.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-03.jpg" "https://www.vanguardwax.com/proimages/com/03.jpg"; then echo "✓ photos/company-03.jpg"; ok=$((ok+1)); else echo "✗ photos/company-03.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-04.jpg" "https://www.vanguardwax.com/proimages/com/04.jpg"; then echo "✓ photos/company-04.jpg"; ok=$((ok+1)); else echo "✗ photos/company-04.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-05.jpg" "https://www.vanguardwax.com/proimages/com/05.jpg"; then echo "✓ photos/company-05.jpg"; ok=$((ok+1)); else echo "✗ photos/company-05.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-06.jpg" "https://www.vanguardwax.com/proimages/com/06.jpg"; then echo "✓ photos/company-06.jpg"; ok=$((ok+1)); else echo "✗ photos/company-06.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-07.jpg" "https://www.vanguardwax.com/proimages/com/07.jpg"; then echo "✓ photos/company-07.jpg"; ok=$((ok+1)); else echo "✗ photos/company-07.jpg"; fail=$((fail+1)); fi
if curl -fsSL -A "Mozilla/5.0" -o "photos/company-08.jpg" "https://www.vanguardwax.com/proimages/com/08.jpg"; then echo "✓ photos/company-08.jpg"; ok=$((ok+1)); else echo "✗ photos/company-08.jpg"; fail=$((fail+1)); fi
echo; echo "完成：成功 $ok 個，失敗 $fail 個"
