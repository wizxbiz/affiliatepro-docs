# 📋 TukTuk LINE Bot - Test Checklist

## ✅ ทดสอบหลังการแก้ไข

### 1. PIN Request Flow
- [ ] พิมพ์ "รหัส" → ได้รับ PIN ภายใน 3 วินาที
- [ ] พิมพ์ "ขอรหัส" → ได้รับ PIN ภายใน 3 วินาที
- [ ] ตรวจสอบ web_pins table ใน D1 มีข้อมูล
- [ ] ตรวจสอบ debug endpoint: `status: "replied"` หรือ `"pin_saved"`

### 2. Rich Product Search
- [ ] พิมพ์ "iphone 11" → ได้รับการ์ดสินค้าพร้อม badge
- [ ] พิมพ์ "เสื้อ" → ได้รับการ์ดสินค้า
- [ ] ตรวจสอบว่ามีสินค้าจาก 3 sources:
  - 🔍 ค้นเจอ (สีน้ำเงิน)
  - 🏪 ร้านเดียวกัน (สีเขียว)
  - 🔥 แนะนำเพิ่ม (สีม่วง)

### 3. Direct Search (ค้นหาตรงๆ)
- [ ] พิมพ์ชื่อสินค้าโดยตรง เช่น "โทรศัพท์"
- [ ] ถ้าไม่เจอสินค้า ระบบจะส่งต่อให้ AI ตอบแทน

### 4. Webhook Timeout Prevention
- [ ] ส่งข้อความติดต่อกัน 5 ครั้ง → ทุกข้อความได้รับการตอบกลับ
- [ ] ตรวจสอบ wrangler logs ไม่มี "outcome: canceled"
- [ ] Response time < 100ms สำหรับ 200 OK

### 5. Error Handling
- [ ] พิมพ์ข้อความยาวมาก (>1000 ตัวอักษร)
- [ ] ส่ง emoji และ special characters
- [ ] ส่งข้อความซ้ำๆ เร็วๆ (spam test)

### 6. Feature Commands
- [ ] พิมพ์ "เมนู" → เห็น Menu Flex Message
- [ ] พิมพ์ "ค้นหา" → เข้าสู่โหมดค้นหา
- [ ] พิมพ์ "ยอดฮิต" → เห็นสินค้ายอดฮิต
- [ ] พิมพ์ "คลิปฮิต" → เห็นวิดีโอยอดนิยม

## 🔍 Debug Endpoints

### Check System Status
```bash
curl https://tuktukfeed-api.imtthailand2019.workers.dev/api/line/debug
```

### Expected Response Structure
```json
{
  "lastLineEvent": {
    "status": "processing",
    "events": [...],
    "time": "2026-07-13T..."
  },
  "lastPinFlow": {
    "status": "replied",
    "pinMasked": "70****",
    "time": "2026-07-13T..."
  },
  "lastTuktukFeature": {
    "command": "search_products",
    "keyword": "iphone 11",
    "time": "2026-07-13T..."
  }
}
```

## 📈 Performance Metrics

### Target Metrics
- HTTP 200 Response Time: < 50ms
- PIN Generation + Reply: < 3 seconds
- Rich Search Response: < 5 seconds
- Background Task Completion: < 10 seconds

### Monitoring
```bash
# Real-time logs
npx wrangler@3 tail --config workers/wrangler.toml

# Filter for errors
npx wrangler@3 tail --config workers/wrangler.toml --format=pretty | grep -i error
```

## 🚨 Known Issues (จากรายงาน)

### ✅ Fixed
1. ~~Syntax Error (orphaned code)~~ → ลบโค้ดซ้ำออกแล้ว
2. ~~401 Unauthorized~~ → อัปเดต TUKTUK_CHANNEL_ACCESS_TOKEN แล้ว
3. ~~LINE Timeout (outcome: canceled)~~ → ใช้ waitUntil() แล้ว
4. ~~Missing buildTuktukLineAiReply import~~ → import เพิ่มแล้ว

### ⚠️ To Monitor
1. D1 Database Performance (ตรวจสอบ query time)
2. KV SESSIONS Write Performance (ตรวจสอบ latency)
3. Rich Search Performance (ควรใช้ cache)

## 🔧 Quick Fixes

### ถ้าบอทเงียบ
1. ตรวจสอบ `/api/line/debug` → ดู lastWebhookError
2. ตรวจสอบ wrangler tail → ดู real-time errors
3. ตรวจสอบ LINE Developers Console → ดู webhook logs

### ถ้า 401 Error
```bash
# อัปเดต token ใหม่
npx wrangler@3 secret put TUKTUK_CHANNEL_ACCESS_TOKEN --config workers/wrangler.toml
```

### ถ้า Deploy ล้มเหลว
```bash
# ตรวจสอบ syntax
npx wrangler@3 deploy --config workers/wrangler.toml --dry-run

# Deploy จริง
npx wrangler@3 deploy --config workers/wrangler.toml
```

## 📞 Support

- Debug Endpoint: https://tuktukfeed-api.imtthailand2019.workers.dev/api/line/debug
- Wrangler Logs: `npx wrangler@3 tail --config workers/wrangler.toml`
- LINE Developers: https://developers.line.biz/console/
