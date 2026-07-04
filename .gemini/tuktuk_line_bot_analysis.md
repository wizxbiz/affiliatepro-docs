# 🛺 TukTuk Thailand LINE Bot - Analysis & Design

## 📊 สรุปการวิเคราะห์ระบบ Marketplace & Seller Dashboard

### ข้อมูลที่มีอยู่ในระบบ:

#### 1. **Seller Dashboard Data**
- ✅ สินค้าทั้งหมด (`marketplace_items`, `community_products`)
- ✅ ออเดอร์ (`product_orders`, `orders`)
- ✅ Affiliates (`affiliate_relationships`)
- ✅ Comments/Notifications (`product_comments`)
- ✅ สถิติ: ยอดขาย, สต็อก, ยอดวิว, สินค้ารอโพสต์

#### 2. **Product Information**
```dart
{
  'id': String,
  'productName' / 'title': String,
  'price': String/Number,
  'stock' / 'productStock': Number,
  'status': 'active' | 'sold' | 'pre-order' | 'draft',
  'publishStatus': 'scheduled' | 'pre-order' | 'published',
  'sellerId' / 'authorId' / 'lineUserId': String,
  'imageUrl' / 'coverImage': String,
  'views' / 'viewCount': Number,
  'createdAt': Timestamp,
  'scheduledAt': Timestamp (optional),
  '_collection': 'marketplace_items' | 'community_products'
}
```

#### 3. **Order Information**
```dart
{
  'id': String,
  'sellerId': String,
  'totalAmount': Number,
  'status': 'pending' | 'paid' | 'pending_shipment' | 'shipped' | 'completed',
  'createdAt': Timestamp
}
```

---

## 🎯 LINE Bot Features สำหรับผู้ขาย

### **Phase 1: Core Notifications (ความสำคัญสูง)**

#### 1.1 🔔 **แจ้งเตือนออเดอร์ใหม่**
**Trigger:** เมื่อมีการสร้าง order ใหม่ใน Firestore
```
📦 มีออเดอร์ใหม่!

สินค้า: [Product Name]
ราคา: ฿[Price]
ผู้ซื้อ: [Buyer Name]
สถานะ: รอชำระเงิน

[ดูรายละเอียด] [ติดต่อลูกค้า]
```

#### 1.2 💰 **แจ้งเตือนชำระเงินสำเร็จ**
**Trigger:** เมื่อ order status เปลี่ยนเป็น 'paid'
```
✅ ได้รับชำระเงินแล้ว!

ออเดอร์: #[Order ID]
ยอดเงิน: ฿[Amount]
ต้องจัดส่งภายใน: 2 วัน

[เตรียมจัดส่ง] [พิมพ์ใบปะหน้า]
```

#### 1.3 📊 **สรุปยอดขายรายวัน**
**Trigger:** ทุกวันเวลา 20:00 น.
```
📈 สรุปยอดขายวันนี้

💰 ยอดขาย: ฿[Total Sales]
📦 ออเดอร์: [Order Count] รายการ
👀 ยอดวิว: [Views] ครั้ง
⏳ รอจัดส่ง: [Pending] รายการ

[ดูรายละเอียด]
```

#### 1.4 ⚠️ **แจ้งเตือนสต็อกใกล้หมด**
**Trigger:** เมื่อ stock < 5
```
⚠️ สต็อกใกล้หมด!

สินค้า: [Product Name]
สต็อกคงเหลือ: [Stock] ชิ้น

[เพิ่มสต็อก] [ปิดการขาย]
```

---

### **Phase 2: Interactive Commands**

#### 2.1 📊 **ดูสถิติร้านค้า**
**Command:** พิมพ์ "สถิติ" หรือ "dashboard"
```
🛺 TukTuk Seller Dashboard

📦 สินค้าทั้งหมด: [Total]
✅ กำลังขาย: [Active]
💰 ยอดขายเดือนนี้: ฿[Sales]
👀 ยอดวิวรวม: [Views]

[ดูรายละเอียด] [จัดการสินค้า]
```

#### 2.2 📦 **ดูออเดอร์ล่าสุด**
**Command:** พิมพ์ "ออเดอร์" หรือ "orders"
```
📋 ออเดอร์ล่าสุด (5 รายการ)

1. #[ID] - ฿[Price] - [Status]
   [Product Name]
   [วันที่]

2. ...

[ดูทั้งหมด] [กรองตามสถานะ]
```

#### 2.3 🔍 **ค้นหาสินค้า**
**Command:** พิมพ์ "สินค้า [ชื่อ]"
```
🔍 ผลการค้นหา: "[Query]"

1. [Product Name]
   ราคา: ฿[Price]
   สต็อก: [Stock] ชิ้น
   สถานะ: [Status]
   
   [แก้ไข] [เพิ่มสต็อก] [ลบ]

[ดูสินค้าทั้งหมด]
```

#### 2.4 ➕ **เพิ่มสต็อกด่วน**
**Command:** พิมพ์ "เพิ่มสต็อก [Product ID] [จำนวน]"
```
✅ เพิ่มสต็อกสำเร็จ!

สินค้า: [Product Name]
สต็อกเดิม: [Old Stock]
สต็อกใหม่: [New Stock]

[ดูสินค้า] [แก้ไขเพิ่มเติม]
```

---

### **Phase 3: Advanced Features**

#### 3.1 📸 **ลงสินค้าด่วนผ่าน LINE**
**Flow:**
1. ส่งรูปภาพสินค้า
2. Bot ตอบกลับ: "ได้รับรูปแล้ว! กรุณาใส่ข้อมูล:"
3. ผู้ใช้พิมพ์: "ชื่อ: [Name] | ราคา: [Price] | สต็อก: [Stock]"
4. Bot สร้างสินค้าใน Firestore

#### 3.2 💬 **ตอบคำถามลูกค้าอัตโนมัติ**
**Trigger:** เมื่อมี comment ใหม่บนสินค้า
```
💬 มีคำถามใหม่จากลูกค้า

สินค้า: [Product Name]
ผู้ถาม: [User Name]
คำถาม: "[Comment]"

[ตอบกลับ] [ดูสินค้า]
```

#### 3.3 📈 **รายงานประจำสัปดาห์**
**Trigger:** ทุกวันจันทร์ เวลา 09:00 น.
```
📊 สรุปสัปดาห์ที่แล้ว

💰 ยอดขาย: ฿[Total] (↑ [%] จากสัปดาห์ก่อน)
📦 ออเดอร์: [Count] รายการ
⭐ สินค้าขายดี:
   1. [Product 1] - [Sales] ชิ้น
   2. [Product 2] - [Sales] ชิ้น

[ดูรายละเอียด]
```

#### 3.4 🎯 **แนะนำการตลาด**
**Trigger:** เมื่อสินค้ามียอดวิวสูงแต่ขายไม่ดี
```
💡 คำแนะนำจาก AI

สินค้า: [Product Name]
ปัญหา: มียอดวิว [Views] แต่ยังไม่มีคนซื้อ

แนะนำ:
✓ ลดราคา 10-15%
✓ เพิ่มรูปภาพเพิ่มเติม
✓ ปรับคำอธิบายให้น่าสนใจ

[ดูเคล็ดลับเพิ่มเติม]
```

---

## 🏗️ Technical Implementation

### **1. Firestore Triggers (Cloud Functions)**

```javascript
// functions/index.js

// 1. แจ้งเตือนออเดอร์ใหม่
exports.notifyNewOrder = onDocumentCreated({
  document: "product_orders/{orderId}",
  region: "us-central1",
  secrets: [secrets.tuktuk.channelSecret, secrets.tuktuk.channelAccessToken],
}, async (event) => {
  const order = event.data.data();
  const sellerId = order.sellerId;
  
  // Get seller's LINE UID
  const sellerDoc = await admin.firestore()
    .collection('line_users')
    .doc(sellerId)
    .get();
    
  if (!sellerDoc.exists) return;
  
  const lineUid = sellerDoc.id;
  const tuktukClient = getTuktukClient();
  
  // Send notification
  const flexMessage = createNewOrderFlex(order);
  await tuktukClient.pushMessage({
    to: lineUid,
    messages: [flexMessage]
  });
});

// 2. แจ้งเตือนชำระเงินสำเร็จ
exports.notifyPaymentReceived = onDocumentUpdated({
  document: "product_orders/{orderId}",
  region: "us-central1",
  secrets: [secrets.tuktuk.channelSecret, secrets.tuktuk.channelAccessToken],
}, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  // Check if status changed to 'paid'
  if (before.status !== 'paid' && after.status === 'paid') {
    const sellerId = after.sellerId;
    const sellerDoc = await admin.firestore()
      .collection('line_users')
      .doc(sellerId)
      .get();
      
    if (!sellerDoc.exists) return;
    
    const lineUid = sellerDoc.id;
    const tuktukClient = getTuktukClient();
    
    const flexMessage = createPaymentReceivedFlex(after);
    await tuktukClient.pushMessage({
      to: lineUid,
      messages: [flexMessage]
    });
  }
});

// 3. แจ้งเตือนสต็อกใกล้หมด
exports.notifyLowStock = onDocumentUpdated({
  document: "{collection}/{productId}",
  region: "us-central1",
  secrets: [secrets.tuktuk.channelSecret, secrets.tuktuk.channelAccessToken],
}, async (event) => {
  const collection = event.params.collection;
  if (!['marketplace_items', 'community_products'].includes(collection)) return;
  
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  const stockField = collection === 'community_products' ? 'productStock' : 'stock';
  const beforeStock = parseInt(before[stockField] || 0);
  const afterStock = parseInt(after[stockField] || 0);
  
  // Notify when stock drops below 5
  if (beforeStock >= 5 && afterStock < 5 && afterStock > 0) {
    const sellerId = after.sellerId || after.authorId || after.lineUserId;
    if (!sellerId) return;
    
    const sellerDoc = await admin.firestore()
      .collection('line_users')
      .doc(sellerId)
      .get();
      
    if (!sellerDoc.exists) return;
    
    const lineUid = sellerDoc.id;
    const tuktukClient = getTuktukClient();
    
    const flexMessage = createLowStockFlex(after, afterStock);
    await tuktukClient.pushMessage({
      to: lineUid,
      messages: [flexMessage]
    });
  }
});
```

### **2. Scheduled Functions**

```javascript
// สรุปยอดขายรายวัน (ทุกวัน 20:00 น.)
exports.dailySalesSummary = onSchedule({
  schedule: "0 20 * * *",
  timeZone: "Asia/Bangkok",
  region: "us-central1",
  secrets: [secrets.tuktuk.channelSecret, secrets.tuktuk.channelAccessToken],
}, async (context) => {
  const tuktukClient = getTuktukClient();
  
  // Get all sellers
  const sellersSnap = await admin.firestore()
    .collection('seller_profiles')
    .where('sellerStatus', '==', 'verified')
    .get();
    
  for (const sellerDoc of sellersSnap.docs) {
    const sellerId = sellerDoc.id;
    
    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersSnap = await admin.firestore()
      .collection('product_orders')
      .where('sellerId', '==', sellerId)
      .where('createdAt', '>=', today)
      .get();
      
    const stats = calculateDailyStats(ordersSnap.docs);
    
    // Get seller's LINE UID
    const lineUserDoc = await admin.firestore()
      .collection('line_users')
      .doc(sellerId)
      .get();
      
    if (!lineUserDoc.exists) continue;
    
    const flexMessage = createDailySummaryFlex(stats);
    await tuktukClient.pushMessage({
      to: sellerId,
      messages: [flexMessage]
    });
  }
});

// รายงานประจำสัปดาห์ (ทุกวันจันทร์ 09:00 น.)
exports.weeklySalesReport = onSchedule({
  schedule: "0 9 * * 1",
  timeZone: "Asia/Bangkok",
  region: "us-central1",
  secrets: [secrets.tuktuk.channelSecret, secrets.tuktuk.channelAccessToken],
}, async (context) => {
  // Similar to daily summary but with weekly stats
});
```

### **3. Interactive Commands (Webhook Handler)**

```javascript
// functions/tuktuk_webhook.js

async function handleTuktukMessage(event, tuktukClient) {
  const userId = event.source.userId;
  const messageText = event.message.text || "";
  
  // Command: สถิติ / dashboard
  if (messageText.match(/สถิติ|dashboard/i)) {
    const stats = await getSellerStats(userId);
    const flexMessage = createDashboardFlex(stats);
    await tuktukClient.replyMessage({
      replyToken: event.replyToken,
      messages: [flexMessage]
    });
    return;
  }
  
  // Command: ออเดอร์ / orders
  if (messageText.match(/ออเดอร์|orders/i)) {
    const orders = await getRecentOrders(userId, 5);
    const flexMessage = createOrdersListFlex(orders);
    await tuktukClient.replyMessage({
      replyToken: event.replyToken,
      messages: [flexMessage]
    });
    return;
  }
  
  // Command: สินค้า [ชื่อ]
  const searchMatch = messageText.match(/สินค้า\s+(.+)/i);
  if (searchMatch) {
    const query = searchMatch[1];
    const products = await searchProducts(userId, query);
    const flexMessage = createProductSearchFlex(products, query);
    await tuktukClient.replyMessage({
      replyToken: event.replyToken,
      messages: [flexMessage]
    });
    return;
  }
  
  // Command: เพิ่มสต็อก [Product ID] [จำนวน]
  const stockMatch = messageText.match(/เพิ่มสต็อก\s+(\S+)\s+(\d+)/i);
  if (stockMatch) {
    const productId = stockMatch[1];
    const amount = parseInt(stockMatch[2]);
    const result = await updateStock(userId, productId, amount);
    await tuktukClient.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: result.success 
          ? `✅ เพิ่มสต็อกสำเร็จ!\n\nสินค้า: ${result.productName}\nสต็อกใหม่: ${result.newStock} ชิ้น`
          : `❌ เพิ่มสต็อกไม่สำเร็จ: ${result.error}`
      }]
    });
    return;
  }
  
  // Default: PIN request
  if (messageText.toLowerCase().includes("รหัส") || messageText.toLowerCase().includes("pin")) {
    // ... existing PIN logic ...
  }
}
```

---

## 📱 Flex Message Templates

### **1. New Order Notification**

```javascript
function createNewOrderFlex(order) {
  return {
    type: 'flex',
    altText: '📦 มีออเดอร์ใหม่!',
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📦 ออเดอร์ใหม่!',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#00D2FF',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: order.productName,
            weight: 'bold',
            size: 'lg',
            wrap: true
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: 'ราคา:',
                color: '#aaaaaa',
                size: 'sm',
                flex: 1
              },
              {
                type: 'text',
                text: `฿${order.totalAmount}`,
                wrap: true,
                color: '#00B900',
                size: 'md',
                weight: 'bold',
                flex: 2
              }
            ]
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: 'ผู้ซื้อ:',
                color: '#aaaaaa',
                size: 'sm',
                flex: 1
              },
              {
                type: 'text',
                text: order.buyerName || 'ไม่ระบุ',
                wrap: true,
                size: 'sm',
                flex: 2
              }
            ]
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: 'สถานะ:',
                color: '#aaaaaa',
                size: 'sm',
                flex: 1
              },
              {
                type: 'text',
                text: order.status === 'pending' ? 'รอชำระเงิน' : order.status,
                wrap: true,
                size: 'sm',
                color: '#F59E0B',
                flex: 2
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียด',
              uri: `https://tuktukfeed.com/seller/orders/${order.id}`
            },
            color: '#00D2FF'
          },
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'ติดต่อลูกค้า',
              uri: `https://tuktukfeed.com/chat/${order.buyerId}`
            }
          }
        ],
        flex: 0
      }
    }
  };
}
```

### **2. Dashboard Summary**

```javascript
function createDashboardFlex(stats) {
  return {
    type: 'flex',
    altText: '🛺 TukTuk Seller Dashboard',
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🛺 Seller Dashboard',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: new Date().toLocaleDateString('th-TH'),
            color: '#FFFFFF',
            size: 'xs',
            margin: 'sm'
          }
        ],
        backgroundColor: '#1E293B',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // Stats Grid
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              createStatBox('📦', 'สินค้าทั้งหมด', stats.totalProducts),
              createStatBox('✅', 'กำลังขาย', stats.activeProducts)
            ]
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              createStatBox('💰', 'ยอดขายเดือนนี้', `฿${stats.monthlySales}`),
              createStatBox('👀', 'ยอดวิว', stats.totalViews)
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: 'เปิด Seller Center',
              uri: 'https://tuktukfeed.com/seller'
            },
            color: '#00D2FF'
          }
        ]
      }
    }
  };
}

function createStatBox(icon, label, value) {
  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: icon,
        size: 'xl',
        align: 'center'
      },
      {
        type: 'text',
        text: String(value),
        size: 'lg',
        weight: 'bold',
        align: 'center',
        margin: 'sm'
      },
      {
        type: 'text',
        text: label,
        size: 'xs',
        color: '#aaaaaa',
        align: 'center'
      }
    ],
    flex: 1
  };
}
```

---

## 🚀 Implementation Roadmap

### **Week 1: Foundation**
- ✅ Setup TukTuk webhook (DONE)
- ✅ PIN generation (DONE)
- ⏳ Create Flex message templates
- ⏳ Implement basic commands (สถิติ, ออเดอร์)

### **Week 2: Notifications**
- ⏳ New order notification trigger
- ⏳ Payment received notification
- ⏳ Low stock alert
- ⏳ Daily summary scheduler

### **Week 3: Advanced Features**
- ⏳ Product search
- ⏳ Quick stock update
- ⏳ Weekly report
- ⏳ Comment notifications

### **Week 4: Testing & Polish**
- ⏳ End-to-end testing
- ⏳ Error handling
- ⏳ Performance optimization
- ⏳ Documentation

---

## 📝 Next Steps

1. **สร้าง Flex Message Templates** ใน `functions/tuktukFlexMessages.js`
2. **Implement Firestore Triggers** สำหรับแจ้งเตือนออเดอร์และสต็อก
3. **เพิ่ม Interactive Commands** ใน `tuktuk_webhook.js`
4. **ทดสอบกับ LINE Bot จริง**
5. **Deploy และ Monitor**

---

**Created:** 2026-02-09  
**Status:** Design Complete - Ready for Implementation
