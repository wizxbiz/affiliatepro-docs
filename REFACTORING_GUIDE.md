# คู่มือการ Refactor โค้ด Aichat.dart

## สรุปการแยกไฟล์ที่ทำไปแล้ว

### ✅ โครงสร้างโฟลเดอร์ที่สร้างแล้ว

```
lib/
├── models/
│   ├── chat_message.dart       ✅ สร้างแล้ว
│   ├── chat_session.dart       ✅ สร้างแล้ว
│   └── user_subscription.dart  ✅ สร้างแล้ว
├── services/
│   ├── storage_service.dart    ✅ สร้างแล้ว
│   ├── tts_service.dart        ✅ สร้างแล้ว
│   ├── speech_service.dart     ✅ สร้างแล้ว
│   ├── subscription_service.dart (ใช้จาก lib/signup/)
│   └── suggestion_engine.dart  ✅ สร้างแล้ว
├── utils/
│   ├── list_extensions.dart    ✅ สร้างแล้ว
│   └── app_localizations.dart  ✅ สร้างแล้ว
└── constants/
    └── storage_constants.dart  ✅ สร้างแล้ว
```

---

## 📋 ขั้นตอนที่เหลือที่ต้องทำ

### 1. สร้าง SuggestionEngine Service

สร้างไฟล์ `lib/services/suggestion_engine.dart`:

```dart
class SuggestionEngine {
  static const Map<String, List<String>> categorizedSuggestions = {
    'การทดลองฉีด': [
      'วิธีทดลองฉีดพลาสติกได้อย่างไร?',
      'ตั้งค่าเงื่อนไขการฉีดอย่างไร?',
      // ... คัดลอกจาก Aichat.dart บรรทัด 894-929
    ],
    // ... categories อื่นๆ
  };

  static const List<String> generalSuggestions = [
    'คุณช่วยอะไรได้บ้าง?',
    // ...
  ];

  static List<String> getContextualSuggestions(String input) {
    // คัดลอกจาก Aichat.dart บรรทัด 939-987
  }

  static List<String> _getRandomSuggestions() {
    // คัดลอกจาก Aichat.dart บรรทัด 989-997
  }

  static List<String> getCategorySuggestions(String category) {
    return categorizedSuggestions[category] ?? [];
  }

  static List<String> getAllCategories() {
    return categorizedSuggestions.keys.toList();
  }
}
```

### 2. สร้าง AppLocalizations Utility

สร้างไฟล์ `lib/utils/app_localizations.dart`:

```dart
import 'package:flutter/material.dart';

class AppLocalizations {
  AppLocalizations(this.locale);
  final Locale locale;

  static AppLocalizations of(BuildContext context) =>
      AppLocalizations(Localizations.localeOf(context));

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'clearChat': 'Clear Chat',
      'hint': 'Type your message here...',
      'shareChat': 'Share Chat',
      'title': 'Chat Bot',
      'language': 'Language',
      'copy': 'Copy',
    },
    'th': {
      'clearChat': 'ลบแชททั้งหมด',
      'hint': 'พิมพ์ข้อความที่นี่...',
      'shareChat': 'แชร์แชท',
      'title': 'แชทบอท',
      'language': 'ภาษา',
      'copy': 'คัดลอก',
    },
  };

  String get clearChat => _localizedValues[locale.languageCode]!['clearChat']!;
  String get hint => _localizedValues[locale.languageCode]!['hint']!;
  String get shareChat => _localizedValues[locale.languageCode]!['shareChat']!;
  String get title => _localizedValues[locale.languageCode]!['title']!;
  String get language => _localizedValues[locale.languageCode]!['language']!;
  String get copy => _localizedValues[locale.languageCode]!['copy']!;
}
```

### 3. สร้าง Storage Constants

สร้างไฟล์ `lib/constants/storage_constants.dart`:

```dart
class StorageConstants {
  static const String chatKey = 'chat_history';
  static const String settingsKey = 'app_settings';
  static const String chatBackupKey = 'chat_history_backup';
  static const String migrationKey = 'storage_migration_v2';
  static const String archiveFileName = 'chat_archive_history.json';

  static const int maxChatHistorySize = 10000;
  static const int maxMessageLength = 10000;
}
```

### 4. แก้ไขไฟล์ Aichat.dart ให้ใช้ Module ที่แยกออกมา

เปิดไฟล์ `lib/Question/Aichat.dart` และแก้ไขดังนี้:

#### 4.1 เพิ่ม imports

```dart
// ลบ class definitions เดิม และเพิ่ม imports
import '../models/chat_message.dart';
import '../models/chat_session.dart';
import '../models/user_subscription.dart';
import '../services/storage_service.dart';
import '../services/tts_service.dart';
import '../services/speech_service.dart';
import '../services/suggestion_engine.dart';
import '../utils/app_localizations.dart';
import '../utils/list_extensions.dart';
import '../signup/subscription_models.dart' show AppConfig;
import '../signup/subscription_service.dart' show SubscriptionService;
```

#### 4.2 ลบ class definitions ที่ย้ายไปแล้ว

ลบ class เหล่านี้ออกจาก Aichat.dart (เพราะย้ายไปแล้ว):
- `ListExtensions` (บรรทัด 26-31)
- `ChatSession` (บรรทัด 32-66)
- `ChatMessage` (บรรทัด 316-348)
- `UserSubscription` (บรรทัด 72-173)
- `SubscriptionType` (บรรทัด 175)
- `SubscriptionService` (บรรทัด 184-315)
- `SpeechService` (บรรทัด 353-376)
- `StorageService` (บรรทัด 381-850)
- `AppLocalizations` (บรรทัด 855-887)
- `SuggestionEngine` (บรรทัด 892-1006)
- `TTSService` (บรรทัด 1011-1074)

---

## 🔧 วิธีการ Refactor ทีละส่วน

### แนวทางที่แนะนำ:

1. **อย่า Refactor ทั้งหมดพร้อมกัน** - ทำทีละส่วนเพื่อป้องกัน breaking changes
2. **ทดสอบหลังแต่ละขั้นตอน** - Build และ run app หลังจากย้าย class แต่ละตัว
3. **ใช้ Git** - Commit หลังจากย้ายแต่ละ service สำเร็จ

### ลำดับการทำ:

```bash
# Step 1: ทดสอบว่า imports ใหม่ทำงานได้
flutter pub get
flutter analyze

# Step 2: Build app เพื่อดู errors
flutter build apk --debug

# Step 3: แก้ไข errors ทีละตัว
# - Missing imports
# - Undefined classes
# - Path issues
```

---

## 🎯 ประโยชน์ที่ได้รับ

### ก่อน Refactor:
- ❌ ไฟล์ 7,671 บรรทัด
- ❌ ยาก maintain
- ❌ โหลดช้า
- ❌ ทำงานร่วมกันยาก

### หลัง Refactor:
- ✅ แยกเป็น 10+ ไฟล์เล็กๆ
- ✅ ง่ายต่อการ maintain
- ✅ Reusable
- ✅ ทำงานร่วมกันได้ง่าย
- ✅ ทดสอบได้แยกส่วน

---

## 🚀 Next Steps (ขั้นตอนถัดไป)

หลังจาก refactor เสร็จแล้ว ควรพิจารณา:

1. **State Management**
   - ใช้ Provider / Riverpod / Bloc
   - แยก business logic ออกจาก UI

2. **Database**
   - เปลี่ยนจาก SharedPreferences เป็น Hive หรือ SQLite
   - เพิ่ม pagination

3. **Testing**
   - เขียน Unit tests สำหรับแต่ละ service
   - เขียน Widget tests

4. **Performance**
   - ใช้ `const` constructors ให้มากขึ้น
   - Lazy loading สำหรับ chat history

---

## 📞 ติดต่อ

หากมีปัญหาในการ refactor สามารถดู:
- Flutter Documentation: https://docs.flutter.dev
- Effective Dart: https://dart.dev/guides/language/effective-dart

---

สร้างโดย Claude Code
วันที่: 2025-11-28

## 🔐 Admin Command Syntax (การแยกคำสั่งผู้ดูแลระบบ)

เพื่อแยกหน้าที่ของระบบผู้เชี่ยวชาญด้านการฉีดพลาสติกออกจากการสั่งงานระดับระบบ ให้ใช้ Syntax เฉพาะสำหรับคำสั่งผู้ดูแลระบบดังนี้:

- Prefix: ` / ` หรือ ` ! ` เพื่อระบุว่าเป็นคำสั่งระบบ (explicit admin command)
- รูปแบบ: `/<command> [args...]` หรือ `!<command> [args...]`

ตัวอย่างคำสั่งที่รองรับ (ตัวอย่างการใช้งาน):

- `/status`  — ตรวจสอบสถานะระบบอย่างรวดเร็ว (health summary)
- `/metrics 1h` — ดึงเมตริกของระบบย้อนหลัง 1 ชั่วโมง
- `/report weekly` — สร้างรายงานสรุปรายสัปดาห์ (จำลอง/สั่งงานสร้างรายงาน)
- `!deploy v1.2.3` — ขอให้ระบบเริ่มการ deploy ไปยังเวอร์ชัน `v1.2.3` (จำลองเท่านั้น)
- `/logs 300` — ดึง 300 บรรทัดล่าสุดจาก log (จำลอง)

Rationale:

- การแยกคำสั่งระบบด้วย prefix ช่วยลดความกำกวมของการตีความโดย AI
- Specialist AI จะรับผิดชอบเฉพาะคำถามเชิงเทคนิคด้าน Injection Molding
- คำสั่งระบบจะถูกส่งให้ `SystemArchitectAgent` เท่านั้น และจะไม่ถูกวิเคราะห์โดย agent ทางเทคนิคอื่นๆ

การใช้งานจริง:

- ตรวจสอบสิทธิ์และการยืนยันก่อนอนุญาตให้สั่งงานที่มีความเสี่ยง (เช่น `/deploy`).
- ใน production ควรให้คำสั่ง deploy/logs/metrics ถูกส่งผ่าน service ที่มีการตรวจสอบ (CI/CD, Monitoring API) แทนการทำใน Cloud Function โดยตรง.

