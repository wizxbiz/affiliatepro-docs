// Social URL Resolver
// Resolves short/redirect social media URLs to their canonical form
// before building embed HTML in video_player_item.dart.
//
// Platforms handled:
//   TikTok : vm.tiktok.com/XXXXX  → https://www.tiktok.com/@user/video/ID
//            vt.tiktok.com/XXXXX  → same
//            tiktok.com/t/XXXXX   → same
//   Facebook: fb.watch/XXXXX      → https://www.facebook.com/video/xxxxx
//   YouTube : all standard formats already handled by YoutubePlayerController.convertUrlToId
import 'package:http/http.dart' as http;

class SocialUrlResolver {
  static const _timeout = Duration(seconds: 6);

  // ── Core redirect follower ────────────────────────────────────────────────

  /// Follows a single HTTP redirect and returns the Location URL.
  /// Returns [url] unchanged if there is no redirect or on any error.
  static Future<String> resolveRedirect(String url) async {
    final client = http.Client();
    try {
      final request = http.Request('HEAD', Uri.parse(url))
        ..followRedirects = false
        ..maxRedirects = 0;
      final response =
          await client.send(request).timeout(_timeout);
      final location = response.headers['location'];
      if (location == null || location.isEmpty) return url;
      // Resolve relative Location headers
      if (location.startsWith('/')) {
        final base = Uri.parse(url);
        return '${base.scheme}://${base.host}$location';
      }
      return location;
    } catch (_) {
      return url;
    } finally {
      client.close();
    }
  }

  // ── TikTok ────────────────────────────────────────────────────────────────

  /// Returns true when [url] is a TikTok short/share link that requires
  /// redirect-resolution before a numeric video ID can be extracted.
  static bool isTiktokShortLink(String url) {
    final lower = url.toLowerCase();
    return lower.contains('vm.tiktok.com') ||
        lower.contains('vt.tiktok.com') ||
        RegExp(r'tiktok\.com/t/').hasMatch(lower);
  }

  /// Resolves a TikTok URL to its canonical long-form URL.
  /// If [url] is already a long URL it is returned as-is.
  static Future<String> resolveTiktok(String url) async {
    if (!isTiktokShortLink(url)) return url;
    return resolveRedirect(url);
  }

  // ── Facebook ──────────────────────────────────────────────────────────────

  /// Resolves fb.watch short links to full facebook.com video URLs.
  static Future<String> resolveFacebook(String url) async {
    if (!url.toLowerCase().contains('fb.watch')) return url;
    return resolveRedirect(url);
  }

  // ── Reachability check ───────────────────────────────────────────────────

  /// Lightweight HEAD check to see if [url] is reachable.
  /// Used to decide whether to show a fallback card before even trying to load.
  static Future<bool> isReachable(String url) async {
    try {
      final response = await http
          .head(Uri.parse(url))
          .timeout(const Duration(seconds: 5));
      return response.statusCode < 400;
    } catch (_) {
      return false;
    }
  }

  // ── Unified entry point ───────────────────────────────────────────────────

  /// Resolves [url] for the given platform type string ('tiktok', 'facebook').
  /// Returns the resolved URL, or null if [url] is a short link and
  /// resolution completely fails (network error / non-redirect response).
  static Future<ResolveResult> resolve({
    required String url,
    required String platform, // 'tiktok' | 'facebook' | 'youtube' | 'other'
  }) async {
    try {
      String resolved;
      if (platform == 'tiktok') {
        resolved = await resolveTiktok(url);
      } else if (platform == 'facebook') {
        resolved = await resolveFacebook(url);
      } else {
        resolved = url;
      }
      return ResolveResult(url: resolved, ok: resolved != url || !_isShortLink(url, platform));
    } catch (_) {
      return ResolveResult(url: url, ok: false);
    }
  }

  static bool _isShortLink(String url, String platform) {
    if (platform == 'tiktok') return isTiktokShortLink(url);
    if (platform == 'facebook') return url.toLowerCase().contains('fb.watch');
    return false;
  }
}

/// Result from [SocialUrlResolver.resolve].
class ResolveResult {
  /// The resolved (or original) URL.
  final String url;

  /// True when the URL was either already canonical OR resolved successfully.
  /// False means it was a short link that we could NOT resolve.
  final bool ok;

  const ResolveResult({required this.url, required this.ok});
}
