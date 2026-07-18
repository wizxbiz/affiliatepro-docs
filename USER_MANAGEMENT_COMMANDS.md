# User Management Commands Documentation

## Overview
Super Admin can now manage users directly from the `/recent` command interface with quick action buttons.

## Available Commands

### 1. `/promote [userId]`
**Purpose:** Upgrade user to Premium status

**Usage:**
```
/promote Ud9bec6d2ea945cf4330a69cb74ac93cf
```

**Features:**
- ✅ Validates user existence
- ✅ Checks if already Premium
- ✅ Updates Firestore with Premium status
- ✅ Logs who performed the action
- ✅ Sends confirmation message

**Firestore Updates:**
```javascript
{
  isPremium: true,
  premiumSince: ServerTimestamp,
  updatedAt: ServerTimestamp,
  updatedBy: [Super Admin ID]
}
```

### 2. `/demote [userId]`
**Purpose:** Downgrade user from Premium to Free

**Usage:**
```
/demote Ud9bec6d2ea945cf4330a69cb74ac93cf
```

**Features:**
- ✅ Validates user existence
- ✅ Checks if currently Premium
- ✅ Removes Premium status
- ✅ Logs who performed the action
- ✅ Sends confirmation message

**Firestore Updates:**
```javascript
{
  isPremium: false,
  premiumSince: DELETED,
  updatedAt: ServerTimestamp,
  updatedBy: [Super Admin ID]
}
```

### 3. `/ban [userId]`
**Purpose:** Ban user from system

**Usage:**
```
/ban Ud9bec6d2ea945cf4330a69cb74ac93cf
```

**Features:**
- ✅ Validates user existence
- ✅ Checks if already banned
- ✅ Sets banned status
- ✅ Logs ban timestamp and admin
- ✅ Sends confirmation message

**Firestore Updates:**
```javascript
{
  isBanned: true,
  bannedAt: ServerTimestamp,
  bannedBy: [Super Admin ID],
  updatedAt: ServerTimestamp
}
```

### 4. `/unban [userId]`
**Purpose:** Remove ban and restore user access

**Usage:**
```
/unban Ud9bec6d2ea945cf4330a69cb74ac93cf
```

**Features:**
- ✅ Validates user existence
- ✅ Checks if currently banned
- ✅ Removes banned status
- ✅ Logs unban timestamp and admin
- ✅ Sends confirmation message

**Firestore Updates:**
```javascript
{
  isBanned: false,
  bannedAt: DELETED,
  bannedBy: DELETED,
  unbannedAt: ServerTimestamp,
  unbannedBy: [Super Admin ID],
  updatedAt: ServerTimestamp
}
```

## Quick Action Buttons in `/recent`

The enhanced `/recent` command displays users with action buttons:

### User Card Actions:
1. **👁️ View** → `/user [userId]` - View detailed user information
2. **⬆️ Promote** → `/promote [userId]` - Upgrade to Premium
3. **⬇️ Demote** → `/demote [userId]` - Downgrade from Premium
4. **🚫 Ban** → `/ban [userId]` - Ban user
5. **✅ Unban** → `/unban [userId]` - Remove ban

### Trial Status Display:
- **💎 Premium** - Premium user (no countdown)
- **⏰ Trial 6d** - Active trial with 6 days remaining
  - 🟢 Green: >4 days
  - 🟡 Yellow: 3-4 days
  - 🔴 Red: ≤2 days
- **❌ Expired** - Trial expired
- **🆓 Free** - Never had trial or no premium

## Implementation Details

### File: `functions/index.js`
**Lines: 11521-11755** (approximately)

All 4 commands follow the same pattern:
1. Parse userId from command
2. Validate user exists in Firestore
3. Check current status (prevent duplicate actions)
4. Get user display name from LINE profile
5. Update Firestore `line_users` collection
6. Send success/error Flex Message

### Error Handling:
- ❌ Missing userId parameter
- ❌ User not found in database
- ⚠️ Already in target state (already premium, already banned, etc.)
- ❌ Firestore update errors

### Audit Trail:
All actions are logged with:
- `updatedAt` - Timestamp of action
- `updatedBy` / `bannedBy` / `unbannedBy` - Super Admin who performed action
- `premiumSince` / `bannedAt` / `unbannedAt` - Event timestamps

## Security

### Authorization:
- All commands check `if (userId === SUPER_ADMIN_ID)`
- Only Super Admin (Ud9bec6d2ea945cf4330a69cb74ac93cf) can execute
- Regular users and admins cannot access these commands

### Collection:
- Uses `line_users` collection (correct collection for user data)
- Atomic updates with `admin.firestore.FieldValue.serverTimestamp()`
- Field deletion with `admin.firestore.FieldValue.delete()`

## Testing Checklist

### Test Commands:
```
✅ /recent - View users with action buttons
✅ /promote [userId] - Upgrade to Premium
✅ /demote [userId] - Downgrade from Premium
✅ /ban [userId] - Ban user
✅ /unban [userId] - Remove ban
✅ /user [userId] - View updated user status
```

### Edge Cases:
```
✅ Promote already Premium user → Warning
✅ Demote non-Premium user → Warning
✅ Ban already banned user → Warning
✅ Unban non-banned user → Warning
✅ Invalid userId → Error
✅ Non-existent user → Error
```

## Future Enhancements (Optional)

### 1. Batch Actions:
```
/ban_multi [userId1] [userId2] [userId3]
/promote_multi [userId1] [userId2]
```

### 2. Action History:
```
/actions - View recent Super Admin actions
/actions [userId] - View actions for specific user
```

### 3. Reason Parameter:
```
/ban [userId] [reason]
/promote [userId] [reason]
```

### 4. Undo Actions:
```
/undo [actionId] - Revert last action
```

### 5. Scheduled Actions:
```
/schedule_premium [userId] [days]
/schedule_ban [userId] [date]
```

## Deployment Status

**Date:** 2024-12-XX
**Version:** v2.0 - User Management System
**Status:** ✅ Deployed to Firebase Functions
**URL:** https://linewebhook-47mhcx3iqq-uc.a.run.app

## Related Files

- `functions/index.js` - Command handlers (lines 11521-11755)
- `functions/adminFlexMessages.js` - Enhanced `/recent` UI (lines 1148-1480)
- `functions/trialSystem.js` - Trial management logic

## Super Admin Contact

**Super Admin ID:** Ud9bec6d2ea945cf4330a69cb74ac93cf
**Commands Access:** Full access to all admin commands
**Permissions:** Promote, Demote, Ban, Unban, View all users

---

**Documentation Version:** 1.0
**Last Updated:** December 2024
**Maintained by:** Development Team
