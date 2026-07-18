import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// 🎛️ System Configuration Manager
/// จัดการการอ่านและแคชค่า config จาก Firestore
class SystemConfigManager {
  static final SystemConfigManager _instance = SystemConfigManager._internal();
  factory SystemConfigManager() => _instance;

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Cache
  Map<String, dynamic>? _tokenomicsConfig;
  Map<String, dynamic>? _systemSettings;
  DateTime? _lastFetch;

  SystemConfigManager._internal();

  /// ⏱️ Cache Duration (5 minutes)
  static const _cacheDuration = Duration(minutes: 5);

  /// 🔄 Force Refresh Config
  Future<void> refreshConfig() async {
    _lastFetch = null;
    await getTokenomicsConfig();
    await getSystemSettings();
  }

  /// 💰 Get Tokenomics Configuration
  Future<Map<String, dynamic>> getTokenomicsConfig() async {
    // Return cache if valid
    if (_tokenomicsConfig != null &&
        _lastFetch != null &&
        DateTime.now().difference(_lastFetch!) < _cacheDuration) {
      return _tokenomicsConfig!;
    }

    try {
      final doc =
          await _firestore.collection('system_config').doc('tokenomics').get();

      if (doc.exists) {
        _tokenomicsConfig = doc.data() ?? _getDefaultTokenomicsConfig();
      } else {
        _tokenomicsConfig = _getDefaultTokenomicsConfig();
        // Create default config in Firestore
        await _firestore
            .collection('system_config')
            .doc('tokenomics')
            .set(_tokenomicsConfig!);
      }

      _lastFetch = DateTime.now();
      return _tokenomicsConfig!;
    } catch (e) {
      debugPrint('Error fetching tokenomics config: $e');
      return _getDefaultTokenomicsConfig();
    }
  }

  /// ⚙️ Get System Settings
  Future<Map<String, dynamic>> getSystemSettings() async {
    // Return cache if valid
    if (_systemSettings != null &&
        _lastFetch != null &&
        DateTime.now().difference(_lastFetch!) < _cacheDuration) {
      return _systemSettings!;
    }

    try {
      final doc =
          await _firestore.collection('system_config').doc('settings').get();

      if (doc.exists) {
        _systemSettings = doc.data() ?? _getDefaultSystemSettings();
      } else {
        _systemSettings = _getDefaultSystemSettings();
        // Create default settings in Firestore
        await _firestore
            .collection('system_config')
            .doc('settings')
            .set(_systemSettings!);
      }

      return _systemSettings!;
    } catch (e) {
      debugPrint('Error fetching system settings: $e');
      return _getDefaultSystemSettings();
    }
  }

  /// 🎯 Get Specific Coin Reward
  Future<int> getCoinReward(String missionType) async {
    final config = await getTokenomicsConfig();
    return config[missionType] ?? 0;
  }

  /// 🔥 Get Streak Bonus Config
  Future<Map<String, int>> getStreakBonusConfig() async {
    final config = await getTokenomicsConfig();
    return {
      'days': config['streakBonusDays'] ?? 7,
      'coins': config['streakBonusCoins'] ?? 50,
    };
  }

  /// 📹 Get Video Watch Config
  Future<Map<String, int>> getVideoWatchConfig() async {
    final config = await getTokenomicsConfig();
    return {
      'minWatchTime': config['minWatchTime'] ?? 30,
      'maxRewardsPerDay': config['maxVideoRewardsPerDay'] ?? 50,
    };
  }

  /// 🚧 Check Maintenance Mode
  Future<bool> isMaintenanceMode() async {
    final settings = await getSystemSettings();
    return settings['maintenanceMode'] ?? false;
  }

  /// 📝 Check Registrations Allowed
  Future<bool> areRegistrationsAllowed() async {
    final settings = await getSystemSettings();
    return settings['allowRegistrations'] ?? true;
  }

  /// 📊 Get App Info
  Future<Map<String, String>> getAppInfo() async {
    final settings = await getSystemSettings();
    return {
      'name': settings['appName'] ?? 'TukTuk Thailand',
      'version': settings['appVersion'] ?? '2.0.0',
    };
  }

  /// 🔧 Default Tokenomics Config
  Map<String, dynamic> _getDefaultTokenomicsConfig() {
    return {
      'videoWatch': 5,
      'postCreation': 20,
      'locationPin': 50,
      'share': 10,
      'purchase': 100,
      'referral': 200,
      'dailyLogin': 10,
      'like': 1,
      'comment': 3,
      'follow': 5,
      'streakBonusDays': 7,
      'streakBonusCoins': 50,
      'minWatchTime': 30,
      'maxVideoRewardsPerDay': 50,
    };
  }

  /// 🔧 Default System Settings
  Map<String, dynamic> _getDefaultSystemSettings() {
    return {
      'appName': 'TukTuk Thailand',
      'appVersion': '2.0.0',
      'maintenanceMode': false,
      'allowRegistrations': true,
    };
  }

  /// 🔄 Listen to Config Changes
  Stream<Map<String, dynamic>> watchTokenomicsConfig() {
    return _firestore
        .collection('system_config')
        .doc('tokenomics')
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        _tokenomicsConfig = snapshot.data();
        return _tokenomicsConfig!;
      }
      return _getDefaultTokenomicsConfig();
    });
  }

  /// 🔄 Listen to Settings Changes
  Stream<Map<String, dynamic>> watchSystemSettings() {
    return _firestore
        .collection('system_config')
        .doc('settings')
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        _systemSettings = snapshot.data();
        return _systemSettings!;
      }
      return _getDefaultSystemSettings();
    });
  }
}
