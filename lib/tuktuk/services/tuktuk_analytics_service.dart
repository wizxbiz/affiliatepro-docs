import 'package:flutter/foundation.dart';
import 'tuktuk_go_service.dart';

/// 📈 Economic Trend Model
class CommunityTrend {
  final String category;
  final double growth;
  final int transactionCount;
  final double volume;

  CommunityTrend({
    required this.category,
    required this.growth,
    required this.transactionCount,
    required this.volume,
  });

  factory CommunityTrend.fromJson(Map<String, dynamic> json) {
    return CommunityTrend(
      category: json['category'] ?? 'General',
      growth: (json['growth'] ?? 0.0).toDouble(),
      transactionCount: json['transactionCount'] ?? 0,
      volume: (json['volume'] ?? 0.0).toDouble(),
    );
  }
}

/// 🏆 Seller Performance Model (PostgreSQL Relational View)
class SellerReport {
  final double conversionRate;
  final double averageOrderValue;
  final List<double> dailyRevenue;
  final List<String> topSellingProducts;

  SellerReport({
    required this.conversionRate,
    required this.averageOrderValue,
    required this.dailyRevenue,
    required this.topSellingProducts,
  });

  factory SellerReport.fromJson(Map<String, dynamic> json) {
    return SellerReport(
      conversionRate: (json['conversionRate'] ?? 0.0).toDouble(),
      averageOrderValue: (json['averageOrderValue'] ?? 0.0).toDouble(),
      dailyRevenue: List<double>.from(json['dailyRevenue'] ?? []),
      topSellingProducts: List<String>.from(json['topSellingProducts'] ?? []),
    );
  }
}

/// 🏺 TukTuk Analytics Service
/// Bridges the gap between real-time Firestore and deep PostgreSQL analysis
class TuktukAnalyticsService {
  static final TuktukAnalyticsService _instance =
      TuktukAnalyticsService._internal();
  factory TuktukAnalyticsService() => _instance;
  TuktukAnalyticsService._internal();

  final TukTukGoService _goService = TukTukGoService();

  /// Gets community-level economic insights
  Future<List<CommunityTrend>> getEconomicInsights({String? province}) async {
    try {
      final data = await _goService.getCommunityAnalytics(province: province);
      if (data != null && data['trends'] != null) {
        return (data['trends'] as List)
            .map((t) => CommunityTrend.fromJson(t))
            .toList();
      }
    } catch (e) {
      debugPrint('AnalyticsService: getEconomicInsights error: $e');
    }
    return [];
  }

  /// Gets deep performance metrics for a specific seller
  Future<SellerReport?> getSellerDeepReport(String sellerId) async {
    try {
      final data = await _goService.getSellerReports(sellerId);
      if (data != null) {
        return SellerReport.fromJson(data);
      }
    } catch (e) {
      debugPrint('AnalyticsService: getSellerDeepReport error: $e');
    }
    return null;
  }
}
