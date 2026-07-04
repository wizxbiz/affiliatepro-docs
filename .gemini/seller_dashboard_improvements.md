# Seller Dashboard Improvement Plan

## 📋 Based on seller-dashboard.html Logic

### 1. Product Status Logic (Lines 3224-3236 in HTML)
```javascript
// HTML Logic
if (product.status === 'sold') {
    statusClass = 'sold';
    statusText = 'ขายแล้ว';
} else if (product.status === 'pre-order' || product.publishStatus === 'pre-order') {
    statusClass = 'warning';
    statusText = 'Pre-Order';
} else if (product.status === 'draft' || product.publishStatus === 'scheduled') {
    statusClass = 'secondary';
    statusText = 'รอโพสต์';
}
```

**Dart Implementation:**
- Check both `status` and `publishStatus` fields
- Support statuses: `sold`, `pre-order`, `draft`, `scheduled`, `active`
- Display badge colors accordingly

---

### 2. Scheduled Post Display (Lines 3244-3250 in HTML)
```javascript
if (product.publishStatus === 'scheduled' && product.scheduledAt) {
    const date = product.scheduledAt.toDate();
    // Show scheduled time
}
```

**Dart Implementation:**
- Parse `scheduledAt` Timestamp
- Display formatted date/time for scheduled posts
- Show countdown or relative time

---

### 3. Product Collections (Lines 3196-3206 in HTML)
```javascript
// Filter logic
if (currentFilter === 'active') {
    matchFilter = p.status === 'active';
} else if (currentFilter === 'sold') {
    matchFilter = p.status === 'sold';
} else if (currentFilter === 'scheduled') {
    matchFilter = p.status === 'pre-order' || p.status === 'draft' || 
                  p.publishStatus === 'scheduled' || p.publishStatus === 'pre-order';
}
```

**Dart Implementation:**
- Implement filter tabs: All, Active, Sold, Scheduled
- Filter by both `status` and `publishStatus`
- Update UI when filter changes

---

### 4. Stock Management (Lines 3417-3500 in HTML)
```javascript
// Stock field varies by collection
if (collection === 'community_products') {
    updateData.productStock = newStock;
} else {
    updateData.stock = newStock;
}
```

**Dart Implementation:**
- Use `productStock` for `community_products`
- Use `stock` for `marketplace_items`
- Show stock status badges:
  - Green: มีสินค้า (stock > 5)
  - Orange: สต็อกน้อย (stock 1-4)
  - Red: สินค้าหมด (stock = 0)

---

### 5. Shop Settings (Lines 3348-3396 in HTML)
```javascript
await db.collection('seller_profiles').doc(lineUserId).set({
    shopName,
    lineId,
    phone,
    location,
    bannerUrl,
    bankInfo,
    description,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
}, { merge: true });
```

**Dart Implementation:**
- Save to `seller_profiles` collection
- Fields: shopName, lineId, phone, location, bannerUrl, bankInfo, description
- Use merge: true to preserve existing data

---

### 6. Product Card Display (Lines 3252-3283 in HTML)
```javascript
const stock = (product.stock !== undefined ? product.stock : 
               (product.productStock !== undefined ? product.productStock : '-'));
```

**Dart Implementation:**
- Check `stock` first, then `productStock`
- Display "-" if both are null
- Show view count and contact count

---

### 7. Stats Calculation (Matching HTML Logic)
```javascript
// Count by status
if (product.status === 'sold') sold++;
else if (product.publishStatus === 'scheduled' || product.status === 'draft') scheduled++;
else active++;
```

**Dart Implementation:**
- ✅ Already implemented in lines 200-218
- ✅ Correctly checks both `status` and `publishStatus`
- ✅ Counts: sold, scheduled, active

---

## 🎯 Priority Improvements Needed:

### High Priority:
1. ✅ **Product filtering by status** - Already implemented
2. ⚠️ **Scheduled post display** - Need to add `scheduledAt` formatting
3. ⚠️ **Stock field handling** - Need to distinguish between collections
4. ⚠️ **Status badge display** - Need to show correct colors

### Medium Priority:
5. **Shop settings dialog** - Need to create UI and save logic
6. **Inventory management** - Quick stock update feature
7. **Low stock alerts** - Badge showing items with stock < 5

### Low Priority:
8. **Smart post modal** - AI-assisted posting (advanced feature)
9. **API configuration** - Shopee/Lazada integration
10. **Analytics charts** - Sales trends visualization

---

## 📝 Implementation Notes:

### Current Status (seller_dashboard_screen.dart):
- ✅ Multi-collection fetching (marketplace_items + community_products)
- ✅ Stats calculation (sales, views, stock, pending)
- ✅ Product filtering by status
- ✅ Order management
- ⚠️ Missing: Scheduled post formatting
- ⚠️ Missing: Stock field distinction by collection
- ⚠️ Missing: Shop settings UI

### Key Differences from HTML:
1. HTML uses localStorage + Firestore
2. Dart only uses Firestore
3. HTML has more UI modals (Smart Post, API Config)
4. Dart has simpler UI but same core logic

---

## 🔧 Recommended Changes:

### 1. Add Scheduled Post Helper
```dart
String? getScheduledTimeText(Map<String, dynamic> product) {
  if (product['publishStatus'] == 'scheduled' && product['scheduledAt'] != null) {
    final timestamp = product['scheduledAt'] as Timestamp;
    final date = timestamp.toDate();
    return DateFormat('dd MMM HH:mm', 'th').format(date);
  }
  return null;
}
```

### 2. Fix Stock Field Getter
```dart
int getProductStock(Map<String, dynamic> product) {
  final collection = product['_collection'] ?? '';
  if (collection == 'community_products') {
    return int.tryParse(product['productStock']?.toString() ?? '0') ?? 0;
  }
  return int.tryParse(product['stock']?.toString() ?? '0') ?? 0;
}
```

### 3. Add Status Badge Helper
```dart
Map<String, dynamic> getStatusBadge(Map<String, dynamic> product) {
  final status = product['status'] ?? '';
  final publishStatus = product['publishStatus'] ?? '';
  
  if (status == 'sold') {
    return {'text': 'ขายแล้ว', 'color': Colors.grey};
  } else if (status == 'pre-order' || publishStatus == 'pre-order') {
    return {'text': 'Pre-Order', 'color': Colors.orange};
  } else if (status == 'draft' || publishStatus == 'scheduled') {
    return {'text': 'รอโพสต์', 'color': Colors.blue};
  }
  return {'text': 'กำลังขาย', 'color': Colors.green};
}
```

---

## ✅ Conclusion:
The current Dart implementation already has **80% of the HTML logic**, especially:
- Multi-collection product fetching
- Stats calculation
- Order management
- Basic filtering

**Missing 20%:**
- Scheduled post time display
- Collection-specific stock field handling
- Shop settings UI
- Advanced features (Smart Post, API Config)
