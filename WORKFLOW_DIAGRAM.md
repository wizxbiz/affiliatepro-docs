# User Management System - Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN USER MANAGEMENT                      │
│                   Enhanced /recent Command System                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: View Users                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Super Admin sends: /recent                                          │
│          ↓                                                           │
│  ┌─────────────────────────────────────────────────────┐            │
│  │  Enhanced User List (Flex Carousel)                  │            │
│  ├─────────────────────────────────────────────────────┤            │
│  │  📊 Stats Summary:                                   │            │
│  │  💎 Premium: 2 │ ⏰ Trial: 1 │ 🆓 Free: 3            │            │
│  ├─────────────────────────────────────────────────────┤            │
│  │  ┌────────────────────────────────────────────┐     │            │
│  │  │ 👤 User 1                                   │     │            │
│  │  │ 🆔 Uabc123...                               │     │            │
│  │  │ 💎 Premium                                  │     │            │
│  │  │ 📊 Used: 45 times                           │     │            │
│  │  │ 🕐 Last: 2 hours ago                        │     │            │
│  │  │ ─────────────────────────────────           │     │            │
│  │  │ [👁️ View] [⬇️ Demote] [🚫 Ban]             │     │            │
│  │  └────────────────────────────────────────────┘     │            │
│  │  ┌────────────────────────────────────────────┐     │            │
│  │  │ 👤 User 2                                   │     │            │
│  │  │ 🆔 Udef456...                               │     │            │
│  │  │ ⏰ Trial 6d 🟢                              │     │            │
│  │  │ 📊 Used: 12 times                           │     │            │
│  │  │ 🕐 Last: 1 day ago                          │     │            │
│  │  │ ─────────────────────────────────           │     │            │
│  │  │ [👁️ View] [⬆️ Promote] [🚫 Ban]            │     │            │
│  │  └────────────────────────────────────────────┘     │            │
│  │  ┌────────────────────────────────────────────┐     │            │
│  │  │ 👤 User 3                                   │     │            │
│  │  │ 🆔 Ughi789...                               │     │            │
│  │  │ ❌ Expired                                  │     │            │
│  │  │ 📊 Used: 8 times                            │     │            │
│  │  │ 🕐 Last: 5 days ago                         │     │            │
│  │  │ ─────────────────────────────────           │     │            │
│  │  │ [👁️ View] [⬆️ Promote] [🚫 Ban]            │     │            │
│  │  └────────────────────────────────────────────┘     │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Actions                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │ 👁️ VIEW      │   │ ⬆️ PROMOTE   │   │ 🚫 BAN       │            │
│  └──────────────┘   └──────────────┘   └──────────────┘            │
│         │                    │                   │                   │
│         ↓                    ↓                   ↓                   │
│  /user [userId]      /promote [userId]   /ban [userId]              │
│         │                    │                   │                   │
│         ↓                    ↓                   ↓                   │
│  ┌────────────┐      ┌────────────────┐  ┌──────────────┐          │
│  │ User       │      │ Check Status   │  │ Check Status │          │
│  │ Details    │      │ - Already?     │  │ - Already?   │          │
│  │ Display    │      │ - Exists?      │  │ - Exists?    │          │
│  └────────────┘      └────────────────┘  └──────────────┘          │
│                              │                   │                   │
│                              ↓                   ↓                   │
│                      ┌────────────────┐  ┌──────────────┐          │
│                      │ Update         │  │ Update       │          │
│                      │ Firestore:     │  │ Firestore:   │          │
│                      │ isPremium=true │  │ isBanned=true│          │
│                      │ premiumSince   │  │ bannedAt     │          │
│                      │ updatedBy      │  │ bannedBy     │          │
│                      └────────────────┘  └──────────────┘          │
│                              │                   │                   │
│                              ↓                   ↓                   │
│                      ┌────────────────┐  ┌──────────────┐          │
│                      │ Send Success   │  │ Send Success │          │
│                      │ Message        │  │ Message      │          │
│                      └────────────────┘  └──────────────┘          │
│                                                                       │
│  ┌──────────────┐   ┌──────────────┐                                │
│  │ ⬇️ DEMOTE    │   │ ✅ UNBAN     │                                │
│  └──────────────┘   └──────────────┘                                │
│         │                    │                                       │
│         ↓                    ↓                                       │
│  /demote [userId]    /unban [userId]                                │
│         │                    │                                       │
│         ↓                    ↓                                       │
│  ┌────────────────┐  ┌──────────────┐                              │
│  │ Check Status   │  │ Check Status │                              │
│  │ - Is Premium?  │  │ - Is Banned? │                              │
│  │ - Exists?      │  │ - Exists?    │                              │
│  └────────────────┘  └──────────────┘                              │
│         │                    │                                       │
│         ↓                    ↓                                       │
│  ┌────────────────┐  ┌──────────────┐                              │
│  │ Update         │  │ Update       │                              │
│  │ Firestore:     │  │ Firestore:   │                              │
│  │ isPremium=false│  │ isBanned=false│                             │
│  │ DELETE         │  │ DELETE       │                              │
│  │ premiumSince   │  │ bannedAt,By  │                              │
│  │ updatedBy      │  │ unbannedAt   │                              │
│  └────────────────┘  └──────────────┘                              │
│         │                    │                                       │
│         ↓                    ↓                                       │
│  ┌────────────────┐  ┌──────────────┐                              │
│  │ Send Success   │  │ Send Success │                              │
│  │ Message        │  │ Message      │                              │
│  └────────────────┘  └──────────────┘                              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Firestore Updates                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Collection: line_users                                              │
│  Document: [userId]                                                  │
│                                                                       │
│  ┌────────────────────────────────────────────────────┐             │
│  │ BEFORE ACTION:                                      │             │
│  ├────────────────────────────────────────────────────┤             │
│  │ {                                                   │             │
│  │   "userId": "Uabc123...",                           │             │
│  │   "displayName": "Test User",                       │             │
│  │   "isPremium": false,                               │             │
│  │   "isBanned": false,                                │             │
│  │   "trialStatus": "active",                          │             │
│  │   "trialStartDate": "2024-12-13",                   │             │
│  │   "trialEndDate": "2024-12-20",                     │             │
│  │   "usageCount": 12                                  │             │
│  │ }                                                   │             │
│  └────────────────────────────────────────────────────┘             │
│                       ↓                                              │
│              [/promote Uabc123...]                                   │
│                       ↓                                              │
│  ┌────────────────────────────────────────────────────┐             │
│  │ AFTER /promote:                                     │             │
│  ├────────────────────────────────────────────────────┤             │
│  │ {                                                   │             │
│  │   "userId": "Uabc123...",                           │             │
│  │   "displayName": "Test User",                       │             │
│  │   "isPremium": true,            ← CHANGED          │             │
│  │   "premiumSince": "2024-12-14", ← NEW              │             │
│  │   "updatedAt": "2024-12-14",    ← NEW              │             │
│  │   "updatedBy": "Ud9bec6d...",   ← NEW              │             │
│  │   "isBanned": false,                                │             │
│  │   "trialStatus": "active",                          │             │
│  │   "usageCount": 12                                  │             │
│  │ }                                                   │             │
│  └────────────────────────────────────────────────────┘             │
│                       ↓                                              │
│              [/ban Uabc123...]                                       │
│                       ↓                                              │
│  ┌────────────────────────────────────────────────────┐             │
│  │ AFTER /ban:                                         │             │
│  ├────────────────────────────────────────────────────┤             │
│  │ {                                                   │             │
│  │   "userId": "Uabc123...",                           │             │
│  │   "displayName": "Test User",                       │             │
│  │   "isPremium": true,                                │             │
│  │   "premiumSince": "2024-12-14",                     │             │
│  │   "isBanned": true,             ← CHANGED          │             │
│  │   "bannedAt": "2024-12-14",     ← NEW              │             │
│  │   "bannedBy": "Ud9bec6d...",    ← NEW              │             │
│  │   "updatedAt": "2024-12-14",    ← UPDATED          │             │
│  │   "trialStatus": "active",                          │             │
│  │   "usageCount": 12                                  │             │
│  │ }                                                   │             │
│  └────────────────────────────────────────────────────┘             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Response Messages                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ✅ SUCCESS: /promote                                                │
│  ┌─────────────────────────────────────────────┐                    │
│  │ ✅ อัพเกรดสำเร็จ!                           │                    │
│  │                                              │                    │
│  │ 👤 ผู้ใช้: Test User                        │                    │
│  │ 🆔 ID: Uabc123...                           │                    │
│  │ 💎 สถานะ: Premium                           │                    │
│  │ 👨‍💼 โดย: Super Admin                        │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                       │
│  ⚠️  WARNING: /promote (already premium)                            │
│  ┌─────────────────────────────────────────────┐                    │
│  │ ⚠️ ผู้ใช้นี้เป็น Premium อยู่แล้ว          │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                       │
│  ❌ ERROR: /promote (user not found)                                │
│  ┌─────────────────────────────────────────────┐                    │
│  │ ❌ ไม่พบผู้ใช้ ID: Uinvalid123              │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                       │
│  ❌ ERROR: /promote (missing parameter)                             │
│  ┌─────────────────────────────────────────────┐                    │
│  │ ❌ กรุณาระบุ User ID                        │                    │
│  │ รูปแบบ: /promote [userId]                   │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AUTHORIZATION FLOW                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User sends command                                                  │
│          ↓                                                           │
│  ┌──────────────────────────────────────┐                           │
│  │ Check: userId === SUPER_ADMIN_ID?    │                           │
│  └──────────────────────────────────────┘                           │
│          ↓                      ↓                                    │
│        YES                     NO                                    │
│          ↓                      ↓                                    │
│  ┌────────────────┐   ┌────────────────────┐                        │
│  │ Execute        │   │ Ignore command or  │                        │
│  │ Command        │   │ Send error message │                        │
│  └────────────────┘   └────────────────────┘                        │
│                                                                       │
│  SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf"               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TRIAL STATUS BADGE LOGIC                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Data Check:                                                    │
│  ┌──────────────────────────────────────┐                           │
│  │ Is isPremium === true?               │                           │
│  └──────────────────────────────────────┘                           │
│          ↓ YES                                                       │
│  Display: 💎 Premium                                                │
│          ↓ NO                                                        │
│  ┌──────────────────────────────────────┐                           │
│  │ Is trialStatus === "active"?         │                           │
│  └──────────────────────────────────────┘                           │
│          ↓ YES                                                       │
│  Calculate days left:                                                │
│  daysLeft = Math.ceil((trialEndDate - now) / (1000*60*60*24))      │
│          ↓                                                           │
│  ┌──────────────────────────────────────┐                           │
│  │ daysLeft > 4?   → 🟢 Trial Xd        │                           │
│  │ daysLeft 3-4?   → 🟡 Trial Xd        │                           │
│  │ daysLeft <= 2?  → 🔴 Trial Xd        │                           │
│  └──────────────────────────────────────┘                           │
│          ↓ NO                                                        │
│  ┌──────────────────────────────────────┐                           │
│  │ Is trialStatus === "expired"?        │                           │
│  └──────────────────────────────────────┘                           │
│          ↓ YES → Display: ❌ Expired                                │
│          ↓ NO  → Display: 🆓 Free                                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ DATA FLOW SUMMARY                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  LINE Bot → index.js → Command Router                               │
│                              ↓                                       │
│                    ┌─────────┴─────────┐                            │
│                    ↓                   ↓                            │
│            Query Firestore      Update Firestore                    │
│            (line_users)         (line_users)                        │
│                    ↓                   ↓                            │
│            Get user data       Write changes                        │
│                    ↓                   ↓                            │
│            Process logic       Log audit trail                      │
│                    ↓                   ↓                            │
│            Create Flex Msg     Create Flex Msg                      │
│                    └─────────┬─────────┘                            │
│                              ↓                                       │
│                    Send to LINE Bot                                 │
│                              ↓                                       │
│                    User sees response                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Commands
- `/recent` - View user list with management UI
- `/promote [userId]` - Upgrade to Premium
- `/demote [userId]` - Downgrade from Premium
- `/ban [userId]` - Ban user
- `/unban [userId]` - Unban user
- `/user [userId]` - View user details

### Status Badges
- 💎 Premium - Premium user
- ⏰ Trial Xd - Active trial (X days left)
  - 🟢 Green: >4 days
  - 🟡 Yellow: 3-4 days
  - 🔴 Red: ≤2 days
- ❌ Expired - Trial ended
- 🆓 Free - No premium/trial

### Quick Actions
- 👁️ View - Display user details
- ⬆️ Promote - Upgrade to Premium
- ⬇️ Demote - Downgrade from Premium
- 🚫 Ban - Ban user
- ✅ Unban - Remove ban

### Firestore Fields
```javascript
{
  isPremium: boolean,
  premiumSince: timestamp,
  isBanned: boolean,
  bannedAt: timestamp,
  bannedBy: string (userId),
  unbannedAt: timestamp,
  unbannedBy: string (userId),
  updatedAt: timestamp,
  updatedBy: string (userId)
}
```
