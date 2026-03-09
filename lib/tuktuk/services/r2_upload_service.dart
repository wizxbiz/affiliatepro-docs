import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;

/// Cloudflare R2 upload service using S3-compatible API with SigV4 signing.
///
/// Credentials are injected at build time via --dart-define:
///   --dart-define=R2_ACCESS_KEY_ID=xxx
///   --dart-define=R2_SECRET_ACCESS_KEY=yyy
///   --dart-define=R2_PUBLIC_BASE_URL=https://pub-xxx.r2.dev
class R2UploadService {
  static final R2UploadService _instance = R2UploadService._internal();
  factory R2UploadService() => _instance;
  R2UploadService._internal();

  static const _accountId = '3936ddcbff711649ab56a10375e82b67';
  static const _bucket = 'tuktuk-videos';
  static const _region = 'auto';
  static const _endpoint =
      'https://$_accountId.r2.cloudflarestorage.com';

  static const _accessKeyId =
      String.fromEnvironment('R2_ACCESS_KEY_ID');
  static const _secretKey =
      String.fromEnvironment('R2_SECRET_ACCESS_KEY');
  static const _publicBase =
      String.fromEnvironment('R2_PUBLIC_BASE_URL');

  /// Returns true when R2 credentials AND public base URL are all set.
  bool get isConfigured =>
      _accessKeyId.isNotEmpty &&
      _secretKey.isNotEmpty &&
      _publicBase.isNotEmpty;

  // ─── Public upload methods ───────────────────────────────────────────────

  /// Upload a [File] to folder [folder] in the R2 bucket.
  /// Returns the public URL or null on failure.
  Future<String?> upload(
    File file,
    String folder, {
    String? contentType,
  }) async {
    final ext = p.extension(file.path).toLowerCase().replaceFirst('.', '');
    final key = '$folder/${DateTime.now().millisecondsSinceEpoch}.$ext';
    final bytes = await file.readAsBytes();
    final ct = contentType ?? _guessContentType(ext);
    return _put(key, bytes, ct);
  }

  /// Upload raw [bytes] with an explicit [key] path inside the bucket.
  Future<String?> uploadBytes(
    Uint8List bytes,
    String key, {
    required String contentType,
  }) async {
    return _put(key, bytes, contentType);
  }

  // ─── Core PUT with SigV4 ─────────────────────────────────────────────────

  Future<String?> _put(
    String key,
    Uint8List bytes,
    String contentType,
  ) async {
    // Guard: if public URL is missing, uploading would store a private-endpoint
    // URL in Firestore that BetterPlayer cannot access (403 Forbidden).
    if (_publicBase.isEmpty) {
      debugPrint(
        'R2: R2_PUBLIC_BASE_URL is not set (--dart-define=R2_PUBLIC_BASE_URL=...).\n'
        'Upload aborted to prevent storing an inaccessible private-endpoint URL.',
      );
      return null;
    }

    try {
      final now = DateTime.now().toUtc();
      final dateStr = _fmtDate(now);    // e.g. 20241201
      final amzDate = _fmtAmzDate(now); // e.g. 20241201T120000Z

      const host = '$_accountId.r2.cloudflarestorage.com';
      final uri = Uri.parse('$_endpoint/$_bucket/$key');
      final payloadHash = sha256.convert(bytes).toString();

      // Canonical headers must be sorted lexicographically by key.
      final headers = <String, String>{
        'content-length': bytes.length.toString(),
        'content-type': contentType,
        'host': host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
      };

      final signedHeaderKeys = headers.keys.toList()..sort();
      final canonicalHeaders =
          signedHeaderKeys.map((k) => '$k:${headers[k]}').join('\n');
      final signedHeadersStr = signedHeaderKeys.join(';');

      // Canonical request
      final canonicalRequest = [
        'PUT',
        '/$_bucket/${_uriEncodePath(key)}',
        '', // empty query string
        '$canonicalHeaders\n',
        signedHeadersStr,
        payloadHash,
      ].join('\n');

      // Credential scope
      final credentialScope = '$dateStr/$_region/s3/aws4_request';

      // String to sign
      final stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        sha256.convert(utf8.encode(canonicalRequest)).toString(),
      ].join('\n');

      // Derived signing key
      final signingKey = _deriveSigningKey(dateStr);
      final signature = Hmac(sha256, signingKey)
          .convert(utf8.encode(stringToSign))
          .toString();

      // Authorization header
      final authorization = 'AWS4-HMAC-SHA256 '
          'Credential=$_accessKeyId/$credentialScope, '
          'SignedHeaders=$signedHeadersStr, '
          'Signature=$signature';

      // Send request
      final response = await http.put(
        uri,
        headers: {
          ...headers,
          'Authorization': authorization,
        },
        body: bytes,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final base = _publicBase.isNotEmpty ? _publicBase : '$_endpoint/$_bucket';
        return '$base/$key';
      }
      debugPrint(
          'R2: upload failed ${response.statusCode}: ${response.body}',
      );
      return null;
    } catch (e, st) {
      debugPrint('R2: upload error: $e\n$st');
      return null;
    }
  }

  // ─── SigV4 helpers ────────────────────────────────────────────────────────

  List<int> _deriveSigningKey(String dateStr) {
    final kDate = Hmac(sha256, utf8.encode('AWS4$_secretKey'))
        .convert(utf8.encode(dateStr))
        .bytes;
    final kRegion =
        Hmac(sha256, kDate).convert(utf8.encode(_region)).bytes;
    final kService =
        Hmac(sha256, kRegion).convert(utf8.encode('s3')).bytes;
    return Hmac(sha256, kService)
        .convert(utf8.encode('aws4_request'))
        .bytes;
  }

  String _fmtDate(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}'
      '${dt.month.toString().padLeft(2, '0')}'
      '${dt.day.toString().padLeft(2, '0')}';

  String _fmtAmzDate(DateTime dt) =>
      '${_fmtDate(dt)}T'
      '${dt.hour.toString().padLeft(2, '0')}'
      '${dt.minute.toString().padLeft(2, '0')}'
      '${dt.second.toString().padLeft(2, '0')}Z';

  /// URI-encode each path segment (but not the '/' separators).
  String _uriEncodePath(String path) => path
      .split('/')
      .map(Uri.encodeComponent)
      .join('/');

  // ─── Content-type detection ───────────────────────────────────────────────

  String _guessContentType(String ext) {
    switch (ext) {
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'mkv':
        return 'video/x-matroska';
      case 'webm':
        return 'video/webm';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'heic':
        return 'image/heic';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}
