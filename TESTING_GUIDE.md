# Testing Guide - User Management System

## Pre-Testing Setup

### 1. Verify Deployment
```bash
cd d:\Flutterapp\caculateapp\functions
firebase deploy --only functions
```

### 2. Get Test User IDs
Run in LINE Bot as Super Admin:
```
/recent
```
Note down user IDs from the displayed list.

## Test Scenarios

### Scenario 1: View Recent Users
**Command:** `/recent`

**Expected Result:**
```
✅ Display users with cards showing:
   - User name
   - User ID
   - Trial status badge (Premium/Trial Xd/Expired/Free)
   - Usage count
   - Last active time
   - Action buttons: View, Promote/Demote, Ban/Unban

✅ Stats summary bar at top:
   - 💎 Premium: X users
   - ⏰ Trial: X users
   - 🆓 Free: X users

✅ Trial countdown color coding:
   - 🟢 Green: >4 days
   - 🟡 Yellow: 3-4 days
   - 🔴 Red: ≤2 days
```

---

### Scenario 2: Promote User to Premium

**Step 1:** Find non-premium user
```
/recent
```
Identify user with status: **⏰ Trial** or **🆓 Free**

**Step 2:** Promote user
```
/promote [userId]
Example: /promote Uabcdef1234567890
```

**Expected Result:**
```
✅ อัพเกรดสำเร็จ!

👤 ผู้ใช้: [Username]
🆔 ID: [userId]
💎 สถานะ: Premium
👨‍💼 โดย: Super Admin
```

**Step 3:** Verify in `/recent`
```
/recent
```
✅ User status should now show **💎 Premium**

**Step 4:** Test duplicate promote
```
/promote [same userId]
```
Expected: ⚠️ ผู้ใช้นี้เป็น Premium อยู่แล้ว

---

### Scenario 3: Demote User from Premium

**Step 1:** Find premium user
```
/recent
```
Identify user with status: **💎 Premium**

**Step 2:** Demote user
```
/demote [userId]
Example: /demote Uabcdef1234567890
```

**Expected Result:**
```
✅ ลดระดับสำเร็จ!

👤 ผู้ใช้: [Username]
🆔 ID: [userId]
📊 สถานะ: Free User
👨‍💼 โดย: Super Admin
```

**Step 3:** Verify in `/recent`
```
/recent
```
✅ User status should now show **🆓 Free**

**Step 4:** Test duplicate demote
```
/demote [same userId]
```
Expected: ⚠️ ผู้ใช้นี้ไม่ได้เป็น Premium

---

### Scenario 4: Ban User

**Step 1:** Find active user
```
/recent
```
Select any user

**Step 2:** Ban user
```
/ban [userId]
Example: /ban Uabcdef1234567890
```

**Expected Result:**
```
🚫 แบนผู้ใช้สำเร็จ!

👤 ผู้ใช้: [Username]
🆔 ID: [userId]
⛔ สถานะ: ถูกแบน
👨‍💼 โดย: Super Admin
```

**Step 3:** Verify ban status
- User should not be able to use bot
- `/recent` should show banned indicator

**Step 4:** Test duplicate ban
```
/ban [same userId]
```
Expected: ⚠️ ผู้ใช้นี้ถูกแบนอยู่แล้ว

---

### Scenario 5: Unban User

**Step 1:** Find banned user
```
/recent
```
Identify banned user from previous test

**Step 2:** Unban user
```
/unban [userId]
Example: /unban Uabcdef1234567890
```

**Expected Result:**
```
✅ ปลดแบนสำเร็จ!

👤 ผู้ใช้: [Username]
🆔 ID: [userId]
✨ สถานะ: กลับมาใช้งานได้แล้ว
👨‍💼 โดย: Super Admin
```

**Step 3:** Verify unban
- User can now use bot normally
- `/recent` should remove banned indicator

**Step 4:** Test duplicate unban
```
/unban [same userId]
```
Expected: ⚠️ ผู้ใช้นี้ไม่ได้ถูกแบน

---

### Scenario 6: Quick Actions from `/recent`

**Step 1:** Open `/recent`
```
/recent
```

**Step 2:** Click button actions
1. **👁️ View** → Should execute `/user [userId]`
   - Display user details card
   
2. **⬆️ Promote** → Should execute `/promote [userId]`
   - Upgrade to Premium (if not already)
   
3. **⬇️ Demote** → Should execute `/demote [userId]`
   - Downgrade from Premium (if Premium)
   
4. **🚫 Ban** → Should execute `/ban [userId]`
   - Ban user (if not banned)
   
5. **✅ Unban** → Should execute `/unban [userId]`
   - Unban user (if banned)

---

### Scenario 7: Error Handling

**Test 1:** Missing parameter
```
/promote
/demote
/ban
/unban
```
Expected: ❌ กรุณาระบุ User ID

**Test 2:** Invalid user ID
```
/promote InvalidUserId123
/ban U00000000000000000
```
Expected: ❌ ไม่พบผู้ใช้ ID: [...]

**Test 3:** Wrong collection
- Verify commands use `line_users` collection
- Should not query old `users` collection

---

### Scenario 8: Verify Firestore Updates

After each action, check Firestore console:

**After `/promote`:**
```json
{
  "isPremium": true,
  "premiumSince": "2024-12-XX...",
  "updatedAt": "2024-12-XX...",
  "updatedBy": "Ud9bec6d2ea945cf4330a69cb74ac93cf"
}
```

**After `/demote`:**
```json
{
  "isPremium": false,
  // premiumSince deleted
  "updatedAt": "2024-12-XX...",
  "updatedBy": "Ud9bec6d2ea945cf4330a69cb74ac93cf"
}
```

**After `/ban`:**
```json
{
  "isBanned": true,
  "bannedAt": "2024-12-XX...",
  "bannedBy": "Ud9bec6d2ea945cf4330a69cb74ac93cf",
  "updatedAt": "2024-12-XX..."
}
```

**After `/unban`:**
```json
{
  "isBanned": false,
  // bannedAt deleted
  // bannedBy deleted
  "unbannedAt": "2024-12-XX...",
  "unbannedBy": "Ud9bec6d2ea945cf4330a69cb74ac93cf",
  "updatedAt": "2024-12-XX..."
}
```

---

## Test Data Sheet

| Test # | Command | User ID | Expected Status | Result | Notes |
|--------|---------|---------|-----------------|--------|-------|
| 1 | /recent | - | Display users | ☐ | |
| 2 | /promote | | Premium | ☐ | |
| 3 | /promote | (same) | Warning | ☐ | |
| 4 | /demote | | Free | ☐ | |
| 5 | /demote | (same) | Warning | ☐ | |
| 6 | /ban | | Banned | ☐ | |
| 7 | /ban | (same) | Warning | ☐ | |
| 8 | /unban | | Active | ☐ | |
| 9 | /unban | (same) | Warning | ☐ | |
| 10 | /promote | (no param) | Error | ☐ | |
| 11 | /ban | InvalidID | Error | ☐ | |

---

## Performance Testing

### 1. Response Time
Measure time from command to response:
- Target: < 2 seconds
- Acceptable: < 5 seconds

### 2. Concurrent Actions
Test multiple commands in quick succession:
```
/promote [userId1]
/ban [userId2]
/demote [userId3]
```
Expected: All execute successfully without conflicts

### 3. Large User List
Test `/recent` with >15 users:
- Should paginate (5 per bubble)
- Carousel navigation should work

---

## Security Testing

### 1. Authorization
**Test as non-Super Admin:**
```
/promote [userId]
/ban [userId]
```
Expected: "คุณไม่มีสิทธิ์ใช้คำสั่งนี้" or command ignored

### 2. Self-Action
**Test as Super Admin:**
```
/ban Ud9bec6d2ea945cf4330a69cb74ac93cf
/demote Ud9bec6d2ea945cf4330a69cb74ac93cf
```
Verify: Should allow (no restriction on self-actions)

---

## Rollback Plan

If issues occur:

### 1. Revert Code
```bash
cd d:\Flutterapp\caculateapp\functions
git log --oneline
git revert [commit-hash]
firebase deploy --only functions
```

### 2. Manual Firestore Fix
If user data corrupted:
```javascript
// Restore user to previous state
db.collection('line_users').doc('[userId]').update({
  isPremium: false,
  isBanned: false,
  // delete added fields
})
```

---

## Success Criteria

✅ All 4 commands execute without errors
✅ Firestore updates correctly
✅ Audit trail logged (updatedBy, timestamps)
✅ Error messages display appropriately
✅ Duplicate actions prevented with warnings
✅ Quick action buttons in `/recent` work correctly
✅ Response time < 5 seconds
✅ No unauthorized access possible

---

**Testing Date:** __________
**Tested By:** __________
**Status:** ☐ Pass ☐ Fail ☐ Needs Review
**Notes:** ________________
