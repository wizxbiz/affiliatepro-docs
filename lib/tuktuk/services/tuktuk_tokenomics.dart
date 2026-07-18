import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';


enum MissionType {
  videoWatch, // ดูคลิปครบ X นาที
  postCreation, // โพสต์คลิป/รูป
  locationPin, // ปักหมุดร้าน/สถานที่
  share, // แชร์คอนเทนต์
  purchase, // ซื้อสินค้า/บริการ
  referral, // ชวนเพื่อน
  dailyLogin, // ล็อกอินรายวัน
  like, // กดไลค์โพสต์
  comment, // แสดงความคิดเห็น
  follow, // ติดตามผู้ใช้
}

enum RewardType {
  discount20, // ส่วนลด 20 บาท
  boostPost, // Boost โพสต์
  lineSticker, // สติกเกอร์ไลน์
  premiumMonth, // Premium 1 เดือน
  freeShipping, // ส่งฟรี
}

/// 📦 Transaction Model
class CoinTransaction {
  final String id;
  final String type; // 'earn' or 'spend'
  final int amount;
  final String description;
  final DateTime createdAt;
  final String? refId;

  CoinTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
    this.refId,
  });

  factory CoinTransaction.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return CoinTransaction(
      id: doc.id,
      type: data['type'] ?? 'earn',
      amount: data['points'] ?? data['amount'] ?? 0,
      description: data['description'] ?? _getDescription(data),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      refId: data['refId'],
    );
  }

  static String _getDescription(Map<String, dynamic> data) {
    final type = data['type']?.toString() ?? '';
    if (type.contains('videoWatch')) return 'ดูวิดีโอครบ';
    if (type.contains('postCreation')) return 'สร้างโพสต์';
    if (type.contains('locationPin')) return 'ปักหมุดสถานที่';
    if (type.contains('share')) return 'แชร์คอนเทนต์';
    if (type.contains('dailyLogin')) return 'เข้าสู่ระบบรายวัน';
    if (type.contains('like')) return 'กดไลค์';
    if (type.contains('comment')) return 'แสดงความคิดเห็น';
    if (type.contains('follow')) return 'ติดตามผู้ใช้';
    return data['rewardType'] ?? 'รางวัล';
  }
}

class TukTukTokenomics {
  static final TukTukTokenomics _instance = TukTukTokenomics._internal();
  factory TukTukTokenomics() => _instance;

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  // _bridge removed: user identity is resolved server-side via request.auth.uid

  TukTukTokenomics._internal();

  // ── Mission type → string key used by the Cloud Function ──────────────────
  static String _missionKey(MissionType type) {
    switch (type) {
      case MissionType.videoWatch:   return 'videoWatch';
      case MissionType.postCreation: return 'postCreation';
      case MissionType.locationPin:  return 'locationPin';
      case MissionType.share:        return 'share';
      case MissionType.purchase:     return 'purchase';
      case MissionType.referral:     return 'referral';
      case MissionType.dailyLogin:   return 'dailyLogin';
      case MissionType.like:         return 'like';
      case MissionType.comment:      return 'comment';
      case MissionType.follow:       return 'follow';
    }
  }

  // ── Reward type → string key used by the Cloud Function ───────────────────
  static String _rewardKey(RewardType type) {
    switch (type) {
      case RewardType.discount20:    return 'discount20';
      case RewardType.boostPost:     return 'boostPost';
      case RewardType.lineSticker:   return 'lineSticker';
      case RewardType.premiumMonth:  return 'premiumMonth';
      case RewardType.freeShipping:  return 'freeShipping';
    }
  }

  /// 🎯 รับแต้มจากการทำภารกิจ
  ///
  /// [refId]  — required for: like, follow, purchase, referral, videoWatch,
  ///            share, comment. Used as the idempotency key on the server.
  ///            Omit for: dailyLogin, postCreation, locationPin.
  ///
  /// NOTE: [pointsOverride] parameter removed — point values are now
  ///       determined server-side only to prevent manipulation.
  Future<bool> awardPoints(
    MissionType type, {
    String? refId,
    String? description,
  }) async {
    try {
      final callable = _functions.httpsCallable('awardPoints');
      final result = await callable.call<Map<String, dynamic>>({
        'missionType': _missionKey(type),
        'refId':       refId,
        'description': description,
      });

      final data = result.data;
      final coinsAwarded = data['coinsAwarded'] as int? ?? 0;
      debugPrint('💰 awardPoints: +$coinsAwarded coins for ${_missionKey(type)}');
      return data['success'] == true;
    } on FirebaseFunctionsException catch (e) {
      // 'already-awarded' is not an error — it means idempotency key exists
      if (e.code == 'already-exists') return true;
      debugPrint('🛑 awardPoints CF error [${e.code}]: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('🛑 awardPoints error: $e');
      return false;
    }
  }

  /// 💰 แลกแต้มเป็นรางวัล
  ///
  /// Balance check is now INSIDE the server transaction (atomic).
  /// No TOCTOU race possible.
  Future<bool> redeemPoints(
    RewardType rewardType, {
    String? description,
  }) async {
    try {
      final callable = _functions.httpsCallable('redeemPoints');
      final result = await callable.call<Map<String, dynamic>>({
        'rewardType':  _rewardKey(rewardType),
        'description': description,
      });

      final data = result.data;
      debugPrint('🎁 redeemPoints: ${_rewardKey(rewardType)}, newBalance: ${data['newBalance']}');
      return data['success'] == true;
    } on FirebaseFunctionsException catch (e) {
      if (e.code == 'failed-precondition') {
        // Insufficient coins — not a system error
        debugPrint('❌ redeemPoints: ${e.message}');
        return false;
      }
      debugPrint('🛑 redeemPoints CF error [${e.code}]: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('🛑 redeemPoints error: $e');
      return false;
    }
  }

  // ── Read-only helpers (still read Firestore directly — no write risk) ──────

  /// 📊 เช็คแต้มปัจจุบัน (real-time stream)
  Stream<int> getUserCoins(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map(
      (snapshot) => (snapshot.data()?['coins'] ?? 0) as int,
    );
  }

  /// 📜 ดึงประวัติธุรกรรม
  Stream<List<CoinTransaction>> getTransactionHistory(
    String uid, {
    int limit = 50,
  }) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('point_logs')
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map(CoinTransaction.fromFirestore).toList());
  }

  /// 🏆 ดึง Leaderboard
  Future<List<Map<String, dynamic>>> getLeaderboard({int limit = 100}) async {
    try {
      final snapshot = await _firestore
          .collection('leaderboard')
          .orderBy('totalCoins', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['rank'] = snapshot.docs.indexOf(doc) + 1;
        return data;
      }).toList();
    } catch (e) {
      debugPrint('Error fetching leaderboard: $e');
      return [];
    }
  }

  /// 🔥 ดึง Daily Streak
  Future<int> getDailyStreak(String uid) async {
    try {
      final userDoc = await _firestore.collection('users').doc(uid).get();
      return userDoc.data()?['dailyStreak'] ?? 0;
    } catch (e) {
      return 0;
    }
  }

  /// ✅ เช็คว่าทำภารกิจวันนี้แล้วหรือยัง
  Future<bool> isMissionCompletedToday(String uid, MissionType type) async {
    try {
      final today = DateTime.now().toIso8601String().substring(0, 10);
      final doc = await _firestore
          .collection('users')
          .doc(uid)
          .collection('point_logs')
          .doc('${_missionKey(type)}_$today')
          .get();
      return doc.exists;
    } catch (e) {
      return false;
    }
  }

  /// 📊 สถิติผู้ใช้
  Future<Map<String, dynamic>> getUserStats(String uid) async {
    try {
      final userDoc = await _firestore.collection('users').doc(uid).get();
      final userData = userDoc.data() ?? {};

      final logsSnapshot = await _firestore
          .collection('users')
          .doc(uid)
          .collection('point_logs')
          .get();

      final vouchersSnapshot = await _firestore
          .collection('users')
          .doc(uid)
          .collection('vouchers')
          .where('status', isEqualTo: 'active')
          .get();

      return {
        'currentCoins':      userData['coins']         ?? 0,
        'lifetimePoints':    userData['lifetimePoints'] ?? 0,
        'totalSpent':        userData['totalSpent']     ?? 0,
        'dailyStreak':       userData['dailyStreak']    ?? 0,
        'totalTransactions': logsSnapshot.docs.length,
        'activeVouchers':    vouchersSnapshot.docs.length,
      };
    } catch (e) {
      debugPrint('Error fetching user stats: $e');
      return {};
    }
  }

  /// Reward cost lookup (for UI display only — server is authoritative for actual cost)
  int getRewardCost(RewardType type) {
    switch (type) {
      case RewardType.discount20:   return 200;
      case RewardType.boostPost:    return 500;
      case RewardType.lineSticker:  return 300;
      case RewardType.premiumMonth: return 1000;
      case RewardType.freeShipping: return 150;
    }
  }
}
