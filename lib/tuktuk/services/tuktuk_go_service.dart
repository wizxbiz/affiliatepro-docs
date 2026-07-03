import 'dart:async';
import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class TukTukGoService {
  static final TukTukGoService _instance = TukTukGoService._internal();
  factory TukTukGoService() => _instance;
  TukTukGoService._internal();

  static bool _isAvailable = true; // Cache server status
  static DateTime? _lastCheck;

  static String get baseUrl {
    const fromEnv = String.fromEnvironment('GO_API_BASE', defaultValue: '');
    if (fromEnv.isNotEmpty) {
      return fromEnv.endsWith('/api/v1') ? fromEnv : '$fromEnv/api/v1';
    }
    // Production Cloudflare Worker API Gateway — used when GO_API_BASE not set
    // Local override: flutter run --dart-define=GO_API_BASE=http://localhost:8080
    return 'https://tuktukfeed-api.imtthailand2019.workers.dev/api/v1';
  }

  /// ✅ Smart Circuit Breaker
  /// Checks if the backend is alive without blocking the main workflow heavily
  Future<bool> _ensureAvailable() async {
    if (!_isAvailable &&
        _lastCheck != null &&
        DateTime.now().difference(_lastCheck!) < const Duration(minutes: 5)) {
      return false;
    }
    _lastCheck = DateTime.now();
    return true;
  }

  void _markUnavailable() {
    _isAvailable = false;
    _lastCheck = DateTime.now();
    debugPrint(
        '⚠️ Go Engine: Backend unreachable. Switching to Firestore Fallback.',);
  }

  /// ✅ Identity & Access Management (IAM) Header Injector
  /// Retrieves a fresh Firebase ID Token and builds the Authorization header
  Future<Map<String, String>> _getAuthHeaders({bool isJson = false}) async {
    final Map<String, String> headers = {};
    if (isJson) headers['Content-Type'] = 'application/json';

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final idToken = await user.getIdToken();
        if (idToken != null) {
          headers['Authorization'] = 'Bearer $idToken';
          // ✅ X-TukTuk-Source helps backend distinguish app requests
          headers['X-TukTuk-Source'] = 'TukTuk-App-Flutter';
        }
      }
    } catch (e) {
      debugPrint('IAM: Error getting ID token: $e');
    }
    return headers;
  }

  Future<Map<String, dynamic>?> getPowerfulFeed(String userId) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/feed?userId=$userId'), headers: headers)
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getPowerfulFeed error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return null;
  }

  Future<Map<String, dynamic>?> getTrendingFeed() async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/trending'), headers: headers)
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getTrendingFeed error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return null;
  }

  Future<bool> toggleLike(String userId, String postId) async {
    if (!await _ensureAvailable()) return false;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .post(
            Uri.parse('$baseUrl/posts/$postId/like?userId=$userId'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['liked'] ?? false;
      }
    } catch (e) {
      debugPrint('GoService: toggleLike error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return false;
  }

  Future<void> markAsViewed(String postId) async {
    if (!await _ensureAvailable()) return;
    try {
      final headers = await _getAuthHeaders();
      await http
          .post(Uri.parse('$baseUrl/posts/$postId/view'), headers: headers)
          .timeout(const Duration(seconds: 2));
    } catch (e) {
      debugPrint('GoService: markAsViewed error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
  }

  Future<Map<String, dynamic>?> getVerifiedNews() async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/news'), headers: headers)
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getVerifiedNews error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return null;
  }

  Future<Map<String, dynamic>?> getProducts(
      {int limit = 40, String? category, String? province,}) async {
    if (!await _ensureAvailable()) return null;
    try {
      var url = '$baseUrl/products?limit=$limit';
      if (category != null) url += '&category=$category';
      if (province != null) url += '&province=$province';

      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getProducts error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return null;
  }

  Future<List<Map<String, dynamic>>?> getLeaderboard(int limit) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/leaderboard?limit=$limit'), headers: headers)
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['sellers'] != null) {
          final rawList = data['sellers'];
          return (rawList is List)
              ? rawList
                  .whereType<Map>()
                  .map(Map<String, dynamic>.from)
                  .toList()
              : <Map<String, dynamic>>[];
        }
      }
    } catch (e) {
      debugPrint('GoService: getLeaderboard error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return null;
  }

  Future<Map<String, dynamic>?> getPresignedUrl(
      String folder, String filename, String contentType,) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders(isJson: true);
      final response = await http
          .post(
            Uri.parse('$baseUrl/presign'),
            headers: headers,
            body: json.encode({
              'folder': folder,
              'filename': filename,
              'contentType': contentType,
            }),
          )
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getPresignedUrl error: $e');
    }
    return null;
  }

  Future<List<Map<String, dynamic>>?> getLiveSessions({int limit = 10}) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/live?limit=$limit'), headers: headers)
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['liveSessions'] != null) {
          final rawList = data['liveSessions'];
          return (rawList is List)
              ? rawList
                  .whereType<Map>()
                  .map(Map<String, dynamic>.from)
                  .toList()
              : <Map<String, dynamic>>[];
        }
      }
    } catch (e) {
      debugPrint('GoService: getLiveSessions error: $e');
      if (e is TimeoutException) _markUnavailable();
    }
    return null;
  }

  Future<bool> updateLiveHeadline(
      String sessionId, List<String> headlines, String apiKey,) async {
    if (!await _ensureAvailable()) return false;
    try {
      final headers = await _getAuthHeaders(isJson: true);
      final response = await http
          .post(
            Uri.parse('$baseUrl/live/$sessionId/headline'),
            headers: headers,
            body: json.encode({
              'headlines': headlines,
              'apiKey': apiKey,
            }),
          )
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('GoService: updateLiveHeadline error: $e');
    }
    return false;
  }

  Future<String?> startLiveSession(
      Map<String, dynamic> sessionData, String apiKey,) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders(isJson: true);
      final response = await http
          .post(
            Uri.parse('$baseUrl/live/start?apiKey=$apiKey'),
            headers: headers,
            body: json.encode(sessionData),
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['sessionId']?.toString();
      }
    } catch (e) {
      debugPrint('GoService: startLiveSession error: $e');
    }
    return null;
  }

  Future<bool> endLiveSession(String sessionId, String apiKey) async {
    if (!await _ensureAvailable()) return false;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .post(
            Uri.parse('$baseUrl/live/end/$sessionId?apiKey=$apiKey'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('GoService: endLiveSession error: $e');
    }
    return false;
  }

  Future<Map<String, dynamic>?> getLiveSessionStatus(String sessionId) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/live/$sessionId/status'), headers: headers)
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getLiveSessionStatus error: $e');
    }
    return null;
  }

  Future<void> sendLiveHeartbeat(String sessionId, String action) async {
    if (!await _ensureAvailable()) return;
    try {
      final headers = await _getAuthHeaders(isJson: true);
      await http
          .post(
            Uri.parse('$baseUrl/live/$sessionId/heartbeat'),
            headers: headers,
            body: json.encode({'action': action}),
          )
          .timeout(const Duration(seconds: 3));
    } catch (e) {
      debugPrint('GoService: sendLiveHeartbeat error: $e');
    }
  }

  // ─────────────────────────────────────────────
  // 📊 RELATIONAL ANALYTICS (PostgreSQL Backed)
  // ─────────────────────────────────────────────

  /// Fetches aggregated economic insights from the PostgreSQL analytics engine
  Future<Map<String, dynamic>?> getCommunityAnalytics({
    String? province,
    String? category,
    String period = 'onemonth',
  }) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      var url = '$baseUrl/analytics/community?period=$period';
      if (province != null) url += '&province=$province';
      if (category != null) url += '&category=$category';

      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getCommunityAnalytics error: $e');
    }
    return null;
  }

  /// Fetches deep performance reports for sellers powered by relational joins
  Future<Map<String, dynamic>?> getSellerReports(String sellerId) async {
    if (!await _ensureAvailable()) return null;
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('$baseUrl/analytics/seller/$sellerId'),
              headers: headers,)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('GoService: getSellerReports error: $e');
    }
    return null;
  }
}
