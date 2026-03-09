import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;

import 'r2_upload_service.dart';

/// ============================================================
/// TukTukStorageBridge — Unified file upload facade
/// ============================================================
/// Upload strategy (in priority order):
///
///  1. Go backend presigned URL  ← preferred in production
///     • R2 credentials stay on the server (not baked into app)
///     • Flutter POSTs to /api/v1/presign → gets uploadUrl + publicUrl
///     • Flutter PUTs file bytes directly to uploadUrl (R2)
///
///  2. R2UploadService direct SigV4  ← fallback when Go backend unreachable
///     • Uses --dart-define=R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
///     • Same R2 bucket, same public URL format
///
/// Configuration:
///   --dart-define=GO_API_BASE=https://your-go-server.com
///
/// If GO_API_BASE is not set or the presign call fails,
/// falls back to R2UploadService automatically.
/// ============================================================
class TukTukStorageBridge {
  TukTukStorageBridge._();
  static final TukTukStorageBridge _instance = TukTukStorageBridge._();
  factory TukTukStorageBridge() => _instance;

  // Injected via --dart-define at build time.
  // e.g. --dart-define=GO_API_BASE=https://tuktuk-engine.fly.dev
  static const String _goApiBase =
      String.fromEnvironment('GO_API_BASE', defaultValue: '');

  final R2UploadService _r2 = R2UploadService();

  /// True when the Go backend URL is configured.
  bool get hasGoBackend => _goApiBase.isNotEmpty;

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Upload [file] to [folder] in R2, returning the public URL.
  /// Returns `null` on failure (both strategies exhausted).
  ///
  /// Example:
  /// ```dart
  /// final url = await TukTukStorageBridge().upload(
  ///   file,
  ///   'community_posts/images',
  ///   contentType: 'image/jpeg',
  /// );
  /// ```
  Future<String?> upload(
    File file,
    String folder, {
    String? contentType,
  }) async {
    final ext = p.extension(file.path).toLowerCase().replaceFirst('.', '');
    final ct = contentType ?? _guessContentType(ext);

    // Strategy 1 — Go backend presigned URL
    if (hasGoBackend) {
      final result = await _presignAndUpload(file, folder, ct);
      if (result != null) return result;
      debugPrint('[TukTukStorage] Presign failed, falling back to direct R2 upload');
    }

    // Strategy 2 — Direct R2 upload from Flutter
    return _r2.upload(file, folder, contentType: ct);
  }

  /// Upload raw [bytes] with an explicit object [key] (e.g. "videos/abc.mp4").
  /// Falls back to R2UploadService.uploadBytes directly (bytes path skips presign).
  Future<String?> uploadBytes(
    Uint8List bytes,
    String key, {
    required String contentType,
  }) {
    return _r2.uploadBytes(bytes, key, contentType: contentType);
  }

  // ── Presigned URL Strategy ─────────────────────────────────────────────────

  Future<String?> _presignAndUpload(
    File file,
    String folder,
    String contentType,
  ) async {
    try {
      final filename = p.basename(file.path);

      // Step 1: Ask Go backend for a presigned PUT URL
      final presignResp = await http
          .post(
            Uri.parse('$_goApiBase/api/v1/presign'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'folder': folder,
              'filename': filename,
              'contentType': contentType,
              'expirySecs': 3600,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (presignResp.statusCode != 200) {
        debugPrint(
          '[TukTukStorage] presign returned ${presignResp.statusCode}: ${presignResp.body}',
        );
        return null;
      }

      final data = jsonDecode(presignResp.body) as Map<String, dynamic>;
      final uploadUrl = data['uploadUrl'] as String?;
      final publicUrl = data['publicUrl'] as String?;
      if (uploadUrl == null || publicUrl == null) return null;

      // Step 2: PUT file bytes directly to R2 using the presigned URL
      final bytes = await file.readAsBytes();
      final putResp = await http
          .put(
            Uri.parse(uploadUrl),
            headers: {'Content-Type': contentType},
            body: bytes,
          )
          .timeout(const Duration(seconds: 120));

      if (putResp.statusCode == 200 || putResp.statusCode == 201) {
        debugPrint('[TukTukStorage] Presigned upload OK → $publicUrl');
        return publicUrl;
      }

      debugPrint(
        '[TukTukStorage] PUT to R2 failed ${putResp.statusCode}: ${putResp.body}',
      );
      return null;
    } catch (e) {
      debugPrint('[TukTukStorage] presign/upload error: $e');
      return null;
    }
  }

  // ── Content-type detection ─────────────────────────────────────────────────

  String _guessContentType(String ext) {
    switch (ext) {
      case 'mp4':  return 'video/mp4';
      case 'mov':  return 'video/quicktime';
      case 'avi':  return 'video/x-msvideo';
      case 'mkv':  return 'video/x-matroska';
      case 'webm': return 'video/webm';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png':  return 'image/png';
      case 'webp': return 'image/webp';
      case 'gif':  return 'image/gif';
      case 'heic': return 'image/heic';
      case 'pdf':  return 'application/pdf';
      default:     return 'application/octet-stream';
    }
  }
}
