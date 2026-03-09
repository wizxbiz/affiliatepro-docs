import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class TukTukLocationService {
  static final TukTukLocationService _instance =
      TukTukLocationService._internal();
  factory TukTukLocationService() => _instance;
  TukTukLocationService._internal();

  Position? _lastPosition;

  Future<Position?> getCurrentLocationAndSync({
    bool forceRefresh = false,
    LocationAccuracy desiredAccuracy = LocationAccuracy.high,
    Duration? timeout,
  }) async {
    if (!forceRefresh && _lastPosition != null) return _lastPosition;

    try {
      bool serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return null;
      }

      if (permission == LocationPermission.deniedForever) return null;

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: desiredAccuracy,
        timeLimit: timeout,
      );
      _lastPosition = position;
      return position;
    } catch (e) {
      debugPrint('Location Error: $e');
      return null;
    }
  }

  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  Future<bool> checkServiceAndPermission({BuildContext? context}) async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Position? getCachedPosition() {
    return _lastPosition;
  }

  String getLocationQualityDescription(dynamic accuracyOrPosition) {
    double accuracy = 0.0;
    if (accuracyOrPosition is Position) {
      accuracy = accuracyOrPosition.accuracy;
    } else if (accuracyOrPosition is double) {
      accuracy = accuracyOrPosition;
    } else {
      return 'Unknown';
    }

    if (accuracy < 7) return 'Perfect ✨';
    if (accuracy < 20) return 'High 📍';
    if (accuracy < 100) return 'Medium';
    return 'Low';
  }

  double calculateDistance(
      double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  String formatDistance(double distanceInMeters) {
    if (distanceInMeters < 1000) {
      return '${distanceInMeters.toStringAsFixed(0)} m';
    } else {
      return '${(distanceInMeters / 1000).toStringAsFixed(1)} km';
    }
  }

  Future<Map<String, String>> getAddressFromCoords(
      double lat, double lng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        final place = placemarks[0];
        return {
          'province': place.administrativeArea ?? '',
          'district': place.subAdministrativeArea ?? '',
          'subDistrict': place.locality ?? '',
          'street': place.street ?? '',
        };
      }
    } catch (e) {
      debugPrint('Geocoding Error: $e');
    }
    return {};
  }
}
