import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import 'system_config_manager.dart';
import 'tuktuk_bridge.dart';

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
  late final TukTukBridge _bridge =
      TukTukBridge(); // lazy — avoids circular init
  final SystemConfigManager _configManager = SystemConfigManager();

  TukTukTokenomics._internal();

  /// 🎯 รับแต้มจากการทำภารกิจ (Enhanced Version)
  Future<bool> awardPoints(
    MissionType type, {
    String? refId,
    int pointsOverride = 0,
    String? description,
  }) async {
    final user = await _bridge.getCurrentUser();
    if (user == null || user['uid'] == null) return false;
    final uid = user['uid'];

    int points =
        pointsOverride > 0 ? pointsOverride : await _getDefaultPoints(type);

    try {
      // Get streak bonus config
      final streakConfig = await _configManager.getStreakBonusConfig();
      final streakBonusDays = streakConfig['days'] ?? 7;
      final streakBonusCoins = streakConfig['coins'] ?? 50;

      // 1. Transaction เพื่อความชัวร์ของ Data Consistency
      await _firestore.runTransaction((transaction) async {
        DocumentReference userRef = _firestore.collection('users').doc(uid);
        DocumentSnapshot userDoc = await transaction.get(userRef);

        // Fallback for LINE-only users who might be in 'line_users' collection
        if (!userDoc.exists) {
          userRef = _firestore.collection('line_users').doc(uid);
          userDoc = await transaction.get(userRef);
        }

        if (!userDoc.exists) return; // User not found in either collection

        // เช็คก่อนว่าภารกิจนี้ทำไปหรือยัง (สำหรับภารกิจแบบทำครั้งเดียว)
        if (type == MissionType.dailyLogin) {
          final today = DateTime.now().toIso8601String().substring(0, 10);
          final logRef = userRef.collection('point_logs').doc('login_$today');

          final logDoc = await transaction.get(logRef);
          if (logDoc.exists) return; // ทำไปแล้ว

          // ✅ Update Daily Streak
          final userData = userDoc.data() as Map<String, dynamic>?;
          final lastLoginDate = userData?['lastLoginDate']?.toString();
          final currentStreak = userData?['dailyStreak'] ?? 0;

          int newStreak = 1;
          if (lastLoginDate != null) {
            final yesterday = DateTime.now()
                .subtract(const Duration(days: 1))
                .toIso8601String()
                .substring(0, 10);
            if (lastLoginDate == yesterday) {
              newStreak = currentStreak + 1;
            }
          }

          // Bonus for streak milestones (use config)
          if (newStreak % streakBonusDays == 0) {
            points += streakBonusCoins;
          }

          transaction.set(logRef, {
            'type': type.toString(),
            'points': points,
            'streak': newStreak,
            'createdAt': FieldValue.serverTimestamp(),
          });

          transaction.update(userRef, {
            'dailyStreak': newStreak,
            'lastLoginDate': today,
          });
        }

        // อัปเดต User Balance
        transaction.update(userRef, {
          'coins': FieldValue.increment(points),
          'lifetimePoints': FieldValue.increment(points),
          'lastActivityAt': FieldValue.serverTimestamp(),
        });

        // บันทึก Log ทั่วไป (ถ้าไม่ใช่ Daily login ที่บันทึกไปแล้วข้างบน)
        if (type != MissionType.dailyLogin) {
          final newLogRef = _firestore
              .collection('users')
              .doc(uid)
              .collection('point_logs')
              .doc();

          transaction.set(newLogRef, {
            'type': type.toString(),
            'points': points,
            'description': description ?? _getMissionDescription(type),
            'refId': refId,
            'createdAt': FieldValue.serverTimestamp(),
          });
        }

        // ✅ Update Global Leaderboard
        final leaderboardRef = _firestore.collection('leaderboard').doc(uid);
        transaction.set(
          leaderboardRef,
          {
            'uid': uid,
            'displayName': user['displayName'] ?? 'User',
            'pictureUrl': user['pictureUrl'],
            'totalCoins': FieldValue.increment(points),
            'updatedAt': FieldValue.serverTimestamp(),
          },
          SetOptions(merge: true),
        );
      });

      debugPrint('💰 Awarded $points coins to $uid for $type');
      return true;
    } catch (e) {
      debugPrint('🛑 Error awarding points: $e');
      return false;
    }
  }

  /// 💰 แลกแต้มเป็นเงิน/ส่วนลด (Enhanced Version)
  Future<bool> redeemPoints(
    int amount,
    String rewardType, {
    String? description,
  }) async {
    final user = await _bridge.getCurrentUser();
    if (user == null) return false;
    final uid = user['uid'];

    try {
      // เช็คแต้มพอไหม
      final userDoc = await _firestore.collection('users').doc(uid).get();
      final currentCoins = userDoc.data()?['coins'] ?? 0;

      if (currentCoins < amount) {
        debugPrint('❌ Not enough coins');
        return false;
      }

      await _firestore.runTransaction((transaction) async {
        final userRef = _firestore.collection('users').doc(uid);

        transaction.update(userRef, {
          'coins': FieldValue.increment(-amount),
          'totalSpent': FieldValue.increment(amount),
        });

        // Log การแลกของ (ใน point_logs เพื่อให้อยู่ที่เดียวกัน)
        final logRef = _firestore
            .collection('users')
            .doc(uid)
            .collection('point_logs')
            .doc();

        transaction.set(logRef, {
          'type': 'spend',
          'amount': -amount,
          'points': -amount,
          'description': description ?? rewardType,
          'rewardType': rewardType,
          'createdAt': FieldValue.serverTimestamp(),
        });

        // สร้าง Reward Voucher
        final voucherRef = _firestore
            .collection('users')
            .doc(uid)
            .collection('vouchers')
            .doc();

        transaction.set(voucherRef, {
          'rewardType': rewardType,
          'cost': amount,
          'status': 'active',
          'expiresAt':
              Timestamp.fromDate(DateTime.now().add(const Duration(days: 30))),
          'createdAt': FieldValue.serverTimestamp(),
        });
      });

      return true;
    } catch (e) {
      debugPrint('Error redeeming: $e');
      return false;
    }
  }

  /// 📊 เช็คแต้มปัจจุบัน
  Stream<int> getUserCoins(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map((snapshot) {
      return (snapshot.data()?['coins'] ?? 0) as int;
    });
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
        .map((snapshot) {
      return snapshot.docs.map(CoinTransaction.fromFirestore).toList();
    });
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
          .doc('${type.toString()}_$today')
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
        'currentCoins': userData['coins'] ?? 0,
        'lifetimePoints': userData['lifetimePoints'] ?? 0,
        'totalSpent': userData['totalSpent'] ?? 0,
        'dailyStreak': userData['dailyStreak'] ?? 0,
        'totalTransactions': logsSnapshot.docs.length,
        'activeVouchers': vouchersSnapshot.docs.length,
      };
    } catch (e) {
      debugPrint('Error fetching user stats: $e');
      return {};
    }
  }

  Future<int> _getDefaultPoints(MissionType type) async {
    try {
      final config = await _configManager.getTokenomicsConfig();

      switch (type) {
        case MissionType.videoWatch:
          return config['videoWatch'] ?? 5;
        case MissionType.postCreation:
          return config['postCreation'] ?? 20;
        case MissionType.locationPin:
          return config['locationPin'] ?? 50;
        case MissionType.share:
          return config['share'] ?? 10;
        case MissionType.purchase:
          return config['purchase'] ?? 100;
        case MissionType.referral:
          return config['referral'] ?? 200;
        case MissionType.dailyLogin:
          return config['dailyLogin'] ?? 10;
        case MissionType.like:
          return config['like'] ?? 1;
        case MissionType.comment:
          return config['comment'] ?? 3;
        case MissionType.follow:
          return config['follow'] ?? 5;
      }
    } catch (e) {
      debugPrint('Error fetching coin config: $e');
      // Fallback to defaults
      switch (type) {
        case MissionType.videoWatch:
          return 5;
        case MissionType.postCreation:
          return 20;
        case MissionType.locationPin:
          return 50;
        case MissionType.share:
          return 10;
        case MissionType.purchase:
          return 100;
        case MissionType.referral:
          return 200;
        case MissionType.dailyLogin:
          return 10;
        case MissionType.like:
          return 1;
        case MissionType.comment:
          return 3;
        case MissionType.follow:
          return 5;
      }
    }
  }

  String _getMissionDescription(MissionType type) {
    switch (type) {
      case MissionType.videoWatch:
        return 'ดูวิดีโอครบ';
      case MissionType.postCreation:
        return 'สร้างโพสต์';
      case MissionType.locationPin:
        return 'ปักหมุดสถานที่';
      case MissionType.share:
        return 'แชร์คอนเทนต์';
      case MissionType.purchase:
        return 'ซื้อสินค้า';
      case MissionType.referral:
        return 'ชวนเพื่อน';
      case MissionType.dailyLogin:
        return 'เข้าสู่ระบบรายวัน';
      case MissionType.like:
        return 'กดไลค์';
      case MissionType.comment:
        return 'แสดงความคิดเห็น';
      case MissionType.follow:
        return 'ติดตามผู้ใช้';
    }
  }

  int getRewardCost(RewardType type) {
    switch (type) {
      case RewardType.discount20:
        return 200;
      case RewardType.boostPost:
        return 500;
      case RewardType.lineSticker:
        return 300;
      case RewardType.premiumMonth:
        return 1000;
      case RewardType.freeShipping:
        return 150;
    }
  }
}
