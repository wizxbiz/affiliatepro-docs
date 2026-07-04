#!/bin/bash

# 🚀 Upload WiT AI Calculator Pro to GitHub
# ⚠️ Script นี้จะตรวจสอบและป้องกันการอัปโหลด sensitive data

echo "=================================="
echo "🔒 WiT AI - Safe GitHub Upload"
echo "=================================="

# ตรวจสอบว่าอยู่ใน git repo หรือไม่
if [ ! -d .git ]; then
    echo "❌ ไม่พบ .git directory"
    echo "📝 กำลัง initialize git repository..."
    git init
    git remote add origin https://github.com/wizxbiz/affiliatepro-docs.git
fi

# ตรวจสอบไฟล์ที่มี sensitive data
echo ""
echo "🔍 ตรวจสอบไฟล์ sensitive data..."

SENSITIVE_FILES=(
    "admin_dashboard/config.json"
    "google-services.json"
    "GoogleService-Info.plist"
)

FOUND_SENSITIVE=0
for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "⚠️  พบไฟล์: $file"
        FOUND_SENSITIVE=1
    fi
done

if [ $FOUND_SENSITIVE -eq 1 ]; then
    echo ""
    echo "❌ พบไฟล์ sensitive! กรุณาตรวจสอบ .gitignore"
    echo "💡 ไฟล์เหล่านี้จะไม่ถูก commit (ถูก ignore แล้ว)"
fi

# แสดงไฟล์ที่จะ commit
echo ""
echo "📋 ไฟล์ที่จะอัปโหลด (wizmobiz.com/ only):"
git status wizmobiz.com/ | grep -E '(new file|modified)'

echo ""
read -p "❓ ต้องการ commit และ push ไฟล์เหล่านี้หรือไม่? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo ""
    echo "📦 Adding files..."
    
    # Add เฉพาะไฟล์ wizmobiz.com
    git add wizmobiz.com/calculator.html
    git add wizmobiz.com/js/calculator-engines.js
    git add wizmobiz.com/js/calculator-integrations.js
    git add wizmobiz.com/CALCULATOR_GUIDE.md
    git add wizmobiz.com/README.md
    git add admin_dashboard/config.json.example
    git add .gitignore
    
    echo "💬 Creating commit..."
    git commit -m "🚀 Add WiT AI Calculator Pro with full integration

Features:
- 15+ calculators (Clamp Force, Cooling Time, Shot Size, etc.)
- LINE Bot API integration (Trial system)
- Firebase Sync (Firestore)
- Vision AI (defect analysis)
- Marketplace integration
- Real-time Sync (Share, PDF export)

Files:
- calculator.html (1641 lines)
- calculator-engines.js (569 lines)
- calculator-integrations.js (526 lines)
- CALCULATOR_GUIDE.md (comprehensive guide)
- README.md

Version: 1.0.0
Created: 2025-12-12
By: Claude Sonnet 4.5"
    
    echo ""
    echo "🚀 Pushing to GitHub..."
    git push origin main || git push origin master
    
    echo ""
    echo "✅ อัปโหลดสำเร็จ!"
    echo "🌐 Repository: https://github.com/wizxbiz/affiliatepro-docs"
else
    echo ""
    echo "❌ ยกเลิกการอัปโหลด"
fi
