import 'dart:async';
import 'dart:ui' as ui;

import 'package:animate_do/animate_do.dart';
import 'package:better_player_plus/better_player_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/models/text_overlay.dart';
import 'package:caculateapp/tuktuk/screens/post_detail_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_tokenomics.dart';
import 'package:caculateapp/tuktuk/services/social_url_resolver.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_video_parser.dart' as parser;
import 'package:caculateapp/tuktuk/widgets/poll_widget.dart';
import 'package:caculateapp/tuktuk/widgets/video_fallback_card.dart';
import 'package:caculateapp/tuktuk/widgets/video/greeting_overlay.dart';
import 'package:caculateapp/tuktuk/widgets/video/video_side_actions.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

// 🎥 VideoSourceType now imported from TuktukVideoParser

class VideoPlayerItem extends StatefulWidget {
  final String videoUrl;
  final Map<String, dynamic> postData;
  final bool isActive;
  final bool isAutoScrollEnabled;
  final bool shouldPreload; // ✅ Added for preloading support
  final bool isGlobalMuted; // 🔇 Global mute from notification pill
  final VoidCallback? onTimerEnd;
  final VoidCallback? onToggleAutoScroll;

  const VideoPlayerItem({
    super.key,
    required this.videoUrl,
    required this.postData,
    required this.isActive,
    this.isAutoScrollEnabled = false,
    this.shouldPreload = false, // Default to false
    this.isGlobalMuted = false, // Default unmuted
    this.onTimerEnd,
    this.onToggleAutoScroll,
  });

  @override
  State<VideoPlayerItem> createState() => _VideoPlayerItemState();
}

class _VideoPlayerItemState extends State<VideoPlayerItem>
    with
        TickerProviderStateMixin,
        WidgetsBindingObserver,
        AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  BetterPlayerController? _betterPlayerController;
  YoutubePlayerController? _youtubeController;
  WebViewController? _webViewController;

  // 🎥 Universal Video Parser - State
  parser.VideoSourceType _sourceType = parser.VideoSourceType.native;

  bool _isYoutube = false; // Kept for backward compatibility
  bool _isWebEmbed = false; // Kept for backward compatibility
  bool _isImageOnly = false;
  late AnimationController _discAnimationController;
  bool _isInitialized = false;
  bool _isInitializing = false; // ✅ Guard against multiple inits
  bool _isLiked = false;
  bool _hasError = false;
  bool _isMuted = false;
  String? _errorDetail;
  bool _isFastForwarding = false;
  bool _isPlaying = true;
  bool _isUserPaused = false; // New: Tracks if user explicitly paused
  bool _showTapFeedback = false;
  bool _lastTapWasPlay = true;
  bool _viewTracked = false; // Track if view has been counted
  Timer? _autoSkipTimer; // Timer to skip video on permanent error
  bool _isDisposed = false; // Flag to check if widget is still alive
  bool _useWebViewFallback =
      false; // New: Flag to use WebView if native player fails
  // Tracks consecutive WebView resource errors for social embeds.
  // When >= 4 errors occur the embed is considered broken and VideoFallbackCard is shown.
  int _webViewErrorCount = 0;
  bool _isAudioSaved = false; // For audio saving feature
  bool _isAudioSaving = false; // For audio saving feature

  // Double tap heart animation
  double _heartOpacity = 0.0;
  Offset _heartPosition = Offset.zero;
  late AnimationController _heartAnimationController;

  // UI Visibility Animation
  bool _showUi = true;
  Timer? _hideTimer;
  late AnimationController _uiSlideController;
  late Animation<Offset> _sidePanelSlideAnimation;
  late Animation<Offset> _bottomInfoSlideAnimation;

  String _authorName = 'Member';
  String? _authorPic;
  int _followersCount = 0;
  int _viewsCount = 0;
  int _likesCount = 0;
  bool _isVerified = false;
  DateTime? _lastSeen;
  Timer? _autoScrollSafetyTimer;

  // ✅ OPTIMIZATION: Debouncer for expensive operations
  Timer? _debounceTimer;

  // ✅ FEATURE: Greeting Overlay
  bool _showGreeting = false;
  String _greetingMessage = '';
  double _greetingOpacity = 0.0;
  List<Color> _greetingGradientColors = [Colors.orange, Colors.deepOrange];
  Timer? _greetingTimer;

  // ✅ OPTIMIZATION: Cache thumbnail URL to avoid recalculation

  // ✅ FEATURE: Intelligent Watch Tracking
  Timer? _watchTimer; // Timer to count actual watch seconds
  int _secondsWatched = 0; // Cumulative watch time for this session
  final Set<int> _reportedMilestones =
      {}; // Track reported milestones (5, 10, 20, 30)

  @override
  void initState() {
    super.initState();
    final Map<String, dynamic> p = widget.postData;
    _authorName = (p['displayName']?.toString().isNotEmpty == true
            ? p['displayName']
            : null) ??
        (p['name']?.toString().isNotEmpty == true ? p['name'] : null) ??
        (p['authorName']?.toString().isNotEmpty == true
            ? p['authorName']
            : null) ??
        (p['sellerName']?.toString().isNotEmpty == true
            ? p['sellerName']
            : null) ??
        (p['userName']?.toString().isNotEmpty == true ? p['userName'] : null) ??
        'Member';

    _authorPic = (p['pictureUrl']?.toString().isNotEmpty == true
            ? p['pictureUrl']
            : null) ??
        (p['photoURL']?.toString().isNotEmpty == true ? p['photoURL'] : null) ??
        (p['authorPictureUrl']?.toString().isNotEmpty == true
            ? p['authorPictureUrl']
            : null) ??
        (p['authorAvatar']?.toString().isNotEmpty == true
            ? p['authorAvatar']
            : null) ??
        (p['sellerPictureUrl']?.toString().isNotEmpty == true
            ? p['sellerPictureUrl']
            : null) ??
        (p['userPic']?.toString().isNotEmpty == true ? p['userPic'] : null);
    _followersCount = widget.postData['followersCount'] ?? 0;
    _viewsCount = widget.postData['views'] ?? 0;

    debugPrint('TukTuk: initState for post ID: ${widget.postData['id']}');
    debugPrint('TukTuk: Video URL: ${widget.videoUrl}');
    debugPrint('TukTuk: Author: $_authorName');

    _discAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
      // ✅ OPTIMIZATION: Lower animation frame rate
      animationBehavior: AnimationBehavior.preserve,
    );

    // Standard rotation animation - RotationTransition handles repaints automatically
    if (widget.isActive && _isPlaying) {
      _discAnimationController.repeat();
    }

    _heartAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _uiSlideController = AnimationController(
      vsync: this,
      duration: const Duration(
        milliseconds: 300,
      ), // ✅ Reduced from 600ms for faster UI
    );

    _sidePanelSlideAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0.3, 0), // Slide out slightly to the right
    ).animate(
      CurvedAnimation(
        parent: _uiSlideController,
        curve: Curves.easeOutCubic,
      ),
    );

    _bottomInfoSlideAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0, 0.2), // Slide down slightly
    ).animate(
      CurvedAnimation(
        parent: _uiSlideController,
        curve: Curves.easeOutCubic,
      ),
    );

    _sourceType = parser.TuktukVideoParser.detectSource(widget.videoUrl);

    // Sync legacy flags for compatibility - using the new parser logic
    _isYoutube = _sourceType == parser.VideoSourceType.youtube;
    _isWebEmbed = _sourceType == parser.VideoSourceType.tiktok ||
        _sourceType == parser.VideoSourceType.facebook ||
        _sourceType == parser.VideoSourceType.instagram ||
        _sourceType == parser.VideoSourceType.twitter ||
        _sourceType == parser.VideoSourceType.webEmbed ||
        _isYoutube;
    _isImageOnly = _sourceType == parser.VideoSourceType.image;

    // ✅ OPTIMIZATION: Initialize if active OR marked for preload
    // This prevents hardware decoder exhaustion on PageView pre-rendering
    if (widget.isActive || widget.shouldPreload) {
      // ✅ Use microtask to prevent blocking main thread
      scheduleMicrotask(() {
        if (!_isDisposed && mounted) {
          _initializePlayer();
        }
      });
    }

    // ✅ OPTIMIZATION: Defer non-critical operations
    Future.microtask(() {
      if (!_isDisposed && mounted) {
        _fetchAuthorDetails();
        _trackViewIfNeeded();
      }
    });

    if (_isWebEmbed) {
      _initializeWebView();
    }
    _startHideTimer();
    _trackViewIfNeeded();

    // ✅ FEATURE: Trigger Greeting Animation
    if (widget.isActive) {
      _triggerGreeting();
    }

    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didUpdateWidget(VideoPlayerItem oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 1. Handle Active State Change (User scrolled to/away)
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        // BECAME ACTIVE
        if ((_betterPlayerController != null ||
                _youtubeController != null ||
                _webViewController != null) &&
            _isInitialized) {
          // If was preloaded, it might be paused or muted. WAKE IT UP!
          // Note: _youtubeController is always null (YouTube uses WebView path),
          // so _isYoutube is treated the same as _isWebEmbed here.
          if (_isYoutube || _isWebEmbed || _useWebViewFallback) {
            _playWebView();
          } else {
            _betterPlayerController?.play();
            if (!_isMuted) _betterPlayerController?.setVolume(1.0);
          }

          _safeSetState(() => _isPlaying = true);
          _discAnimationController.repeat();
          _triggerGreeting();
          _trackViewIfNeeded();
          _startWatchTimer(); // ✅ Start counting watch time
        } else if (!_isInitialized && !_isInitializing) {
          // If not ready, init now
          _initializePlayer();
        }
      } else {
        // BECAME INACTIVE
        // Pause to save resources, but keep state for quick back-swipe
        _betterPlayerController?.pause();
        _youtubeController?.pauseVideo();
        _pauseWebView();

        setState(() => _isPlaying = false);
        _discAnimationController.stop();
        _stopWatchTimer(); // ✅ Stop counting
      }
    }

    // 2. Handle Preload Trigger (User scrolled to potential next)
    if (widget.shouldPreload && !oldWidget.shouldPreload && !_isInitialized) {
      _initializePlayer();
    }

    // 3. 🔇 Handle Global Mute Change (from notification pill)
    if (widget.isGlobalMuted != oldWidget.isGlobalMuted) {
      _toggleMute(forcedMuted: widget.isGlobalMuted);
    }
  }

  void _triggerGreeting() {
    // Only show greeting once per session/view for this item to avoid annoyance
    if (_showGreeting) return;

    final hour = DateTime.now().hour;
    String greeting = '';
    String action = '';
    List<Color> colors = [];

    if (hour >= 5 && hour < 12) {
      greeting = 'สวัสดีตอนเช้า ☀️';
      action = 'หาอะไรทานด้วยนะครับ';
      colors = [Colors.orange, Colors.amber];
    } else if (hour >= 12 && hour < 14) {
      greeting = 'พักเที่ยงแล้ว 🍱';
      action = 'ทานข้าวให้อร่อยนะ';
      colors = [Colors.redAccent, Colors.deepOrange];
    } else if (hour >= 14 && hour < 17) {
      greeting = 'บ่ายแล้ว ☕';
      action = 'พักจิบกาแฟบ้าง ';
      colors = [Colors.brown, Colors.orangeAccent]; // Coffee vibe
    } else if (hour >= 17 && hour < 20) {
      greeting = 'เลิกงานแล้ว 🏠';
      action = 'วันนี้เป็นไงบ้าง?';
      colors = [Colors.deepPurple, Colors.purpleAccent];
    } else {
      greeting = 'ราตรีสวัสดิ์ 🌙';
      action = 'พักผ่อนเยอะๆ นะครับ';
      colors = [Colors.indigo, Colors.black87];
    }

    _greetingMessage = "$greeting\n$action";
    _greetingGradientColors = colors;

    // Delay slightly to let video start
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && widget.isActive) {
        _safeSetState(() {
          _showGreeting = true;
          _greetingOpacity = 1.0;
        });

        // Hide after 4 seconds
        _greetingTimer?.cancel();
        _greetingTimer = Timer(const Duration(seconds: 4), () {
          if (mounted) {
            _safeSetState(() {
              _greetingOpacity = 0.0;
            });
          }
        });
      }
    });
  }

  void _trackViewIfNeeded() {
    if (widget.isActive && !_viewTracked) {
      final postId = widget.postData['id']?.toString();
      if (postId != null && postId.trim().isNotEmpty) {
        final collectionName =
            widget.postData['originCollection'] ?? 'posts';
        // ✅ OPTIMIZATION: Debounce view tracking
        _debounceTimer?.cancel();
        _debounceTimer = Timer(const Duration(milliseconds: 500), () {
          if (!_isDisposed && mounted) {
            TukTukBridge().trackView(postId, collectionName);
            _viewTracked = true;
          }
        });
      }
    }
  }

  // ✅ INTELLIGENT FEED: Watch Time Tracking
  void _startWatchTimer() {
    final postId = widget.postData['id']?.toString();
    if (postId == null || postId.trim().isEmpty) return;

    _stopWatchTimer(); // Ensure no duplicates
    debugPrint('TukTuk: Starting intelligent watch timer for $postId');
    _watchTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && widget.isActive && _isPlaying && !_isUserPaused) {
        // Only count if truly watching
        _secondsWatched++;
        _checkWatchMilestones();
      }
    });
  }

  void _stopWatchTimer() {
    _watchTimer?.cancel();
    _watchTimer = null;
  }

  void _checkWatchMilestones() {
    // ✅ Reward at 10s as per new vision
    final milestones = [5, 10, 20, 30];
    for (final milestone in milestones) {
      if (_secondsWatched >= milestone &&
          !_reportedMilestones.contains(milestone)) {
        // Milestone Reached!
        _reportedMilestones.add(milestone);
        _reportWatchInterest(milestone);

        // ✅ Gamification: Reward Watch Engagement at 30s
        if (milestone == 30) {
          final postId = widget.postData['id']?.toString();
          debugPrint(
            'TukTuk Gamification: User earned 5 coins for 30s watch time!',
          );
          TukTukTokenomics().awardPoints(
            MissionType.videoWatch,
            refId: postId,
            description: 'ดูวิดีโอครบ 30 วินาที',
          );
        }
      }
    }
  }

  // Refactored to parser.TuktukVideoParser.detectSource

  void _reportWatchInterest(int seconds) {
    if (widget.postData['id'] == null) return;
    final postId = widget.postData['id'].toString();
    if (postId.trim().isEmpty) return;

    final collectionName =
        widget.postData['originCollection'] ?? 'posts';
    final category = widget.postData['category']?.toString();

    debugPrint(
      'TukTuk Intelligence: User watched $postId for $seconds seconds. Sending signal...',
    );

    // Asynchronously send signal without blocking UI
    TukTukBridge()
        .trackVideoWatchTime(postId, collectionName, category, seconds);
  }

  void _safeSetState(VoidCallback fn) {
    if (_isDisposed || !mounted) return;
    // ✅ OPTIMIZATION: Check scheduler phase before using postFrameCallback
    if (WidgetsBinding.instance.schedulerPhase ==
        SchedulerPhase.persistentCallbacks) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_isDisposed || !mounted) return;
        setState(fn);
      });
    } else {
      setState(fn);
    }
  }

  // Refactored to parser.TuktukVideoParser.getThumbnailUrl

  // Refactored to parser.TuktukVideoParser.isVideoFile

  // Async so that TikTok/Facebook short URLs can be resolved before building
  // the embed HTML. Callers fire-and-forget (no await needed).
  Future<void> _initializeWebView() async {
    if (_isDisposed || !mounted) return;

    // Resolve short/redirect URLs before building embed HTML.
    // vm.tiktok.com/XXXXX → full URL with numeric video ID
    // fb.watch/XXXXX      → full facebook.com/video/... URL
    String resolvedUrl = widget.videoUrl;
    if (_sourceType == parser.VideoSourceType.tiktok &&
        SocialUrlResolver.isTiktokShortLink(widget.videoUrl)) {
      resolvedUrl = await SocialUrlResolver.resolveTiktok(widget.videoUrl);
      // If resolution returned the same short URL, the link is broken
      if (resolvedUrl == widget.videoUrl && mounted) {
        _safeSetState(() {
          _hasError = true;
          _errorDetail = 'ลิงก์ TikTok นี้ไม่สามารถโหลดได้';
        });
        return;
      }
    } else if (_sourceType == parser.VideoSourceType.facebook &&
        widget.videoUrl.toLowerCase().contains('fb.watch')) {
      resolvedUrl = await SocialUrlResolver.resolveFacebook(widget.videoUrl);
    }

    if (_isDisposed || !mounted) return;

    final htmlContent = parser.TuktukVideoParser.getEmbedHtml(
      url: resolvedUrl,
      isAutoScrollEnabled: widget.isAutoScrollEnabled,
    );

    // Reset error counter on each fresh init
    _webViewErrorCount = 0;

    // Platform-specific configuration for unmuted autoplay
    late final PlatformWebViewControllerCreationParams params;
    if (WebViewPlatform.instance is WebKitWebViewPlatform) {
      params = WebKitWebViewControllerCreationParams(
        allowsInlineMediaPlayback: true,
      );
    } else if (WebViewPlatform.instance is AndroidWebViewPlatform) {
      params = const PlatformWebViewControllerCreationParams();
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    if (_isDisposed) return;

    final controller = WebViewController.fromPlatformCreationParams(params);
    _webViewController = controller;

    // Each setter returns Future<void> — await them individually since
    // _initializeWebView is now async (cascade .. would leave futures unawaited).
    await controller.setJavaScriptMode(JavaScriptMode.unrestricted);
    await controller.setBackgroundColor(Colors.black);
    await controller.setNavigationDelegate(
      NavigationDelegate(
        onWebResourceError: (error) {
          debugPrint('TukTuk WebView Error: ${error.description}');
          // Count consecutive errors; after 4 assume the embed is broken
          // and switch to the fallback card.
          if (!mounted || _hasError) return;
          _webViewErrorCount++;
          if (_webViewErrorCount >= 4) {
            _safeSetState(() {
              _hasError = true;
              _errorDetail = 'วิดีโอนี้ไม่สามารถแสดงผลได้';
            });
          }
        },
      ),
    );
    await controller.addJavaScriptChannel(
      'AutoScroll',
      onMessageReceived: (message) {
        if (message.message == 'ended' &&
            widget.isActive &&
            widget.isAutoScrollEnabled &&
            widget.onTimerEnd != null &&
            mounted) {
          widget.onTimerEnd!();
        }
      },
    );
    await controller.setOnConsoleMessage((message) {
      debugPrint('TukTuk WebView Log: ${message.message}');
    });

    // Android specific configuration must happen BEFORE loading the URL
    if (controller.platform is AndroidWebViewController) {
      await AndroidWebViewController.enableDebugging(true);
      await (controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);
    }

    // Delay loading slightly to ensure the platform view and controller are fully linked
    Future.delayed(const Duration(milliseconds: 100), () {
      if (!_isDisposed && mounted) {
        controller.loadHtmlString(htmlContent);
      }
    });

    _safeSetState(() {
      _isInitialized = true;
      _isInitializing = false;
    });
    if (widget.isActive && widget.isAutoScrollEnabled) {
      _startAutoScrollSafetyTimer();
    }
    if (widget.isActive) {
      _startWatchTimer(); // ✅ Start timer if active
    }
  }

  // _getEmbedHtml logic moved to TuktukVideoParser for modularity

  void _startHideTimer() {
    _cancelHideTimer();
    _hideTimer = Timer(const Duration(seconds: 10), () {
      if (mounted && _showUi) {
        _toggleUi(false);
      }
    });
  }

  void _cancelHideTimer() {
    _hideTimer?.cancel();
  }

  void _toggleUi(bool show) {
    if (!mounted) return;
    // ✅ OPTIMIZATION: Avoid redundant re-renders
    if (_showUi == show) return;

    _safeSetState(() {
      _showUi = show;
      if (_showUi) {
        _uiSlideController.reverse();
        _startHideTimer();
      } else {
        _uiSlideController.forward();
      }
    });
  }

  Future<void> _fetchAuthorDetails() async {
    final authorId = widget.postData['authorId']?.toString();
    // ✅ Safety Check: Prevent crash on empty author ID
    if (authorId == null || authorId.trim().isEmpty) return;

    if (authorId == 'admin') {
      if (mounted) {
        _safeSetState(() {
          _authorName = 'TukTuk Team';
          _authorPic = null; // Use default logo
        });
      }
      return;
    }

    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(authorId)
          .get()
          .timeout(const Duration(seconds: 5)); // ✅ OPTIMIZATION: Add timeout

      if (userDoc.exists && mounted) {
        final userData = userDoc.data();
        if (userData != null) {
          _safeSetState(() {
            final Map<String, dynamic> p = widget.postData;
            _authorName = (userData['displayName']?.toString().isNotEmpty ==
                        true
                    ? userData['displayName']
                    : null) ??
                (userData['name']?.toString().isNotEmpty == true
                    ? userData['name']
                    : null) ??
                (userData['username']?.toString().isNotEmpty == true
                    ? userData['username']
                    : null) ??
                (p['displayName']?.toString().isNotEmpty == true
                    ? p['displayName']
                    : null) ??
                (p['name']?.toString().isNotEmpty == true ? p['name'] : null) ??
                (p['authorName']?.toString().isNotEmpty == true
                    ? p['authorName']
                    : null) ??
                (p['sellerName']?.toString().isNotEmpty == true
                    ? p['sellerName']
                    : null) ??
                (p['userName']?.toString().isNotEmpty == true
                    ? p['userName']
                    : null) ??
                'สมาชิก';

            _authorPic = (userData['pictureUrl']?.toString().isNotEmpty == true
                    ? userData['pictureUrl']
                    : null) ??
                (userData['photoURL']?.toString().isNotEmpty == true
                    ? userData['photoURL']
                    : null) ??
                (userData['avatar']?.toString().isNotEmpty == true
                    ? userData['avatar']
                    : null) ??
                (userData['picture']?.toString().isNotEmpty == true
                    ? userData['picture']
                    : null) ??
                (p['pictureUrl']?.toString().isNotEmpty == true
                    ? p['pictureUrl']
                    : null) ??
                (p['photoURL']?.toString().isNotEmpty == true
                    ? p['photoURL']
                    : null) ??
                (p['authorPictureUrl']?.toString().isNotEmpty == true
                    ? p['authorPictureUrl']
                    : null) ??
                (p['authorAvatar']?.toString().isNotEmpty == true
                    ? p['authorAvatar']
                    : null) ??
                (p['sellerPictureUrl']?.toString().isNotEmpty == true
                    ? p['sellerPictureUrl']
                    : null) ??
                (p['userPic']?.toString().isNotEmpty == true
                    ? p['userPic']
                    : null) ??
                _authorPic;

            _isVerified = userData['isVerified'] == true ||
                userData['verified'] == true ||
                authorId == 'admin';
            _lastSeen = (userData['lastSeen'] as Timestamp?)?.toDate();

            // Critical: Sanitize authorPic if it's invalid string
            if (_authorPic != null &&
                (!_authorPic!.startsWith('http') || _authorPic!.length < 10) &&
                !_authorPic!.startsWith('assets/')) {
              _authorPic = null;
            }
            _followersCount = userData['followersCount'] ?? _followersCount;
          });
        }
      }

      // 1. Check if liked
      final collectionName =
          widget.postData['originCollection'] ?? 'posts';

      bool liked = false;
      final postId = widget.postData['id']?.toString();
      if (postId != null && postId.trim().isNotEmpty) {
        liked = await TukTukBridge().hasLiked(postId, collectionName);
      }

      // 2. Check if following (could add a generic hasFollowed in Bridge, for now dummy or implement)
      // For now let's just use the bridge if it exists, otherwise assume false

      if (mounted) {
        _safeSetState(() {
          _isLiked = liked;
          _likesCount = widget.postData['likes'] ?? 0;
        });
      }
    } catch (e) {
      debugPrint('Error fetching author details: $e');
    }
  }

  String _formatLastSeen(DateTime lastSeen) {
    final diff = DateTime.now().difference(lastSeen);
    if (diff.inMinutes < 5) return 'ออนไลน์ตอนนี้';
    if (diff.inHours < 1) return '${diff.inMinutes} นาทีที่แล้ว';
    if (diff.inDays < 1) return '${diff.inHours} ชม. ที่แล้ว';
    return '${diff.inDays} วันที่แล้ว';
  }

  Future<void> _handleLike({bool isDoubleTap = false}) async {
    final postId = widget.postData['id']?.toString();
    if (postId == null || postId.trim().isEmpty) return;

    // If double tap, only like (don't toggle if already liked)
    if (isDoubleTap && _isLiked) {
      _showDoubleTapHeart();
      return;
    }

    if (isDoubleTap) {
      _showDoubleTapHeart();
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.lightImpact();
    }

    // Optimistic UI update
    _safeSetState(() {
      if (_isLiked) {
        _likesCount--;
      } else {
        _likesCount++;
      }
      _isLiked = !_isLiked;
    });

    final collectionName =
        widget.postData['originCollection'] ?? 'posts';

    final success = await TukTukBridge().toggleLike(postId, collectionName);
    if (!success && mounted) {
      // Rollback on failure
      _safeSetState(() {
        if (_isLiked) {
          _likesCount--;
        } else {
          _likesCount++;
        }
        _isLiked = !_isLiked;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ไม่สามารถดำเนินการได้ในขณะนี้')),
      );
    }
  }

  void _showDoubleTapHeart() {
    _safeSetState(() {
      _heartOpacity = 1.0;
    });

    _heartAnimationController.forward(from: 0).then((_) {
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted) _safeSetState(() => _heartOpacity = 0.0);
      });
    });
  }

  void _initializePlayer() {
    if (_isInitialized || _isInitializing) return;
    _isInitializing = true;

    final String url = parser.TuktukVideoParser.normalizeUrl(widget.videoUrl);
    if (url.isEmpty) {
      debugPrint('Error: Video URL is empty');
      _safeSetState(() {
        _hasError = true;
        _errorDetail = 'ไม่พบลิงก์วิดีโอ';
        _isInitializing = false;
      });
      return;
    }

    debugPrint('TukTuk: Initializing player for URL: $url');

    // Detect source type using the modular parser
    _sourceType = parser.TuktukVideoParser.detectSource(url);

    // Sync flags
    _isYoutube = _sourceType == parser.VideoSourceType.youtube;
    _isWebEmbed = _sourceType == parser.VideoSourceType.tiktok ||
        _sourceType == parser.VideoSourceType.facebook ||
        _sourceType == parser.VideoSourceType.instagram ||
        _sourceType == parser.VideoSourceType.twitter ||
        _sourceType == parser.VideoSourceType.webEmbed ||
        _isYoutube;
    _isImageOnly = _sourceType == parser.VideoSourceType.image;

    if (_isWebEmbed) {
      debugPrint('TukTuk: Player Type detected: Web Embed (WebView)');
      _safeSetState(() {
        _useWebViewFallback = true;
      });
      _initializeWebView();
    } else if (_isImageOnly) {
      debugPrint('TukTuk: Player Type detected: Image');
      _safeSetState(() {
        _isInitialized = true;
        _isInitializing = false;
      });
    } else {
      final typeLabel = _sourceType == parser.VideoSourceType.hls
          ? 'HLS Stream (BetterPlayer)'
          : 'Native (BetterPlayer)';
      debugPrint('TukTuk: Player Type detected: $typeLabel');
      _initializeBetterPlayer();
    }
  }

  void _initializeBetterPlayer() {
    try {
      // Ensure URL is properly encoded
      final String encodedUrl = widget.videoUrl.trim();
      String sourceUrl = encodedUrl;

      try {
        final uri = Uri.parse(encodedUrl);
        sourceUrl = uri.toString();
      } catch (e) {
        debugPrint("URL Parsing error: $e");
      }

      if (sourceUrl.contains('#')) {
        sourceUrl = sourceUrl.split('#')[0];
      }

      final isHls = _sourceType == parser.VideoSourceType.hls;

      final BetterPlayerDataSource dataSource = BetterPlayerDataSource(
        BetterPlayerDataSourceType.network,
        sourceUrl,
        // HLS streams use explicit HLS format; all others use 'other' for
        // broad R2/CDN compatibility (avoids format mismatch errors).
        videoFormat:
            isHls ? BetterPlayerVideoFormat.hls : BetterPlayerVideoFormat.other,
        liveStream: isHls,
        cacheConfiguration: isHls
            ? null // Never cache live HLS streams
            : const BetterPlayerCacheConfiguration(
                useCache: true,
                preCacheSize: 40 * 1024 * 1024,
                maxCacheSize: 200 * 1024 * 1024,
              ),
        bufferingConfiguration: isHls
            ? const BetterPlayerBufferingConfiguration(
                // Low-latency buffering for live streams
                minBufferMs: 1000,
                maxBufferMs: 5000,
                bufferForPlaybackMs: 500,
                bufferForPlaybackAfterRebufferMs: 1500,
              )
            : const BetterPlayerBufferingConfiguration(
                minBufferMs: 2000,
                maxBufferMs: 10000,
                bufferForPlaybackMs: 300,
                bufferForPlaybackAfterRebufferMs: 1000,
              ),
      );

      final BetterPlayerConfiguration configuration = BetterPlayerConfiguration(
        aspectRatio: 9 / 16,
        autoPlay: (widget.isActive || widget.shouldPreload) &&
            !_isUserPaused, // ✅ Allow autoplay during preload (BetterPlayer handles pausing when not visible/active if managed well, OR we might need to manually pause preloaded items)
        looping: !widget.isAutoScrollEnabled,
        handleLifecycle: true,
        autoDispose: true,
        fullScreenByDefault: false,
        placeholderOnTop: true,
        placeholder:
            _buildThumbnailPlaceholder(), // 🚀 Show image while loading
        fit: BoxFit.cover,
        playerVisibilityChangedBehavior: (visibilityFraction) {
          if (!mounted) return;

          final controller = _betterPlayerController;
          if (controller == null || _isUserPaused) return;

          try {
            if (visibilityFraction < 0.5) {
              if (controller.isPlaying() == true) {
                controller.pause();
                _safeSetState(() => _isPlaying = false);
                _discAnimationController.stop();
              }
            } else if (widget.isActive && !_isUserPaused) {
              // Only auto-resume if this is the ACTIVE widget
              if (controller.isPlaying() == false) {
                controller
                    .play()
                    .catchError((e) => debugPrint("Play fail: $e"));
                // Force volume on if not explicitly muted by user
                if (!_isMuted) {
                  controller.setVolume(1.0);
                }
                _safeSetState(() => _isPlaying = true);
                _discAnimationController.repeat();
                _trackView();
              }
            }
          } catch (e) {
            debugPrint('Visibility handling error: $e');
          }
        },
        controlsConfiguration: const BetterPlayerControlsConfiguration(
          showControls: false,
          showControlsOnInitialize: false,
        ),
      );

      // Timeout for initialization (Codec issues sometimes hang)
      Timer(const Duration(seconds: 12), () {
        if (mounted &&
            !_isInitialized &&
            !_hasError &&
            !_isWebEmbed &&
            !_isYoutube &&
            !_useWebViewFallback) {
          // Double check if actually playing despite flags
          if (_betterPlayerController?.isPlaying() == true) {
            _isInitialized = true;
            return;
          }

          debugPrint(
            'TukTuk: BetterPlayer init timeout. Forcing WebView Fallback.',
          );
          _isInitializing = false; // ✅ Reset init flag on timeout
          _handlePlaybackException(
            {'exception': 'Initialization Timeout (Codec/Codec hang)'},
          );
        }
      });

      _betterPlayerController = BetterPlayerController(
        configuration,
        betterPlayerDataSource: dataSource,
      );

      _betterPlayerController?.addEventsListener((event) {
        if (_isDisposed || !mounted) return;

        if (event.betterPlayerEventType == BetterPlayerEventType.initialized) {
          _safeSetState(() {
            _isInitialized = true;
            _isInitializing = false; // ✅ Reset init flag
            _hasError = false;
            _isPlaying =
                widget.isActive && !_isUserPaused; // Reflect actual play state
          });
          if (widget.isActive && !_isUserPaused) {
            // Only play if active and not user-paused
            _betterPlayerController
                ?.play()
                .catchError((e) => debugPrint('Play error: $e'));

            if (!_isMuted) {
              _betterPlayerController?.setVolume(1.0);
            } else {
              _betterPlayerController?.setVolume(0.0);
            }

            debugPrint(
              'TukTuk: BetterPlayer initialized and setVolume(${_isMuted ? 0 : 1}.0) called',
            );
            _discAnimationController.repeat();
            _trackView();
            _startWatchTimer(); // ✅ Start
          }
        } else if (event.betterPlayerEventType == BetterPlayerEventType.play) {
          _safeSetState(() => _isPlaying = true);
          _discAnimationController.repeat();
          _trackView(); // Track view when playback starts
          _startWatchTimer(); // ✅ Start/Resume
        } else if (event.betterPlayerEventType == BetterPlayerEventType.pause) {
          _safeSetState(() => _isPlaying = false);
          _discAnimationController.stop();
          _stopWatchTimer(); // ✅ Pause
        } else if (event.betterPlayerEventType ==
            BetterPlayerEventType.finished) {
          if (widget.isActive &&
              widget.isAutoScrollEnabled &&
              widget.onTimerEnd != null) {
            widget.onTimerEnd!();
          }
        } else if (event.betterPlayerEventType ==
            BetterPlayerEventType.exception) {
          _handlePlaybackException(event.parameters);
        }
      });
    } catch (e) {
      _isInitializing = false; // ✅ Reset on catch
      _handlePlaybackException({'exception': e.toString()});
    }
  }

  void _pauseWebView() {
    _webViewController
        ?.runJavaScript("document.querySelector('video')?.pause();");
    _webViewController?.runJavaScript(
      "document.querySelector('iframe')?.contentWindow.postMessage('{\"event\":\"command\",\"func\":\"pauseVideo\",\"args\":\"\"}', '*');",
    );
  }

  void _playWebView() {
    _webViewController
        ?.runJavaScript("document.querySelector('video')?.play();");
    _webViewController?.runJavaScript(
      "document.querySelector('iframe')?.contentWindow.postMessage('{\"event\":\"command\",\"func\":\"playVideo\",\"args\":\"\"}', '*');",
    );
  }

  void _trackView() {
    if (!_viewTracked) {
      final postId = widget.postData['id']?.toString();
      if (postId != null) {
        final collectionName =
            widget.postData['originCollection'] ?? 'posts';
        TukTukBridge().trackView(postId, collectionName);
        _viewTracked = true;
        debugPrint("View tracked for $postId");
      }
    }
  }

  int _retryCount = 0;
  bool _isRetrying = false;

  void _handlePlaybackException(Map<String, dynamic>? params) {
    _isInitializing = false;
    debugPrint("BetterPlayer Exception: $params");
    debugPrint('Failing URL: ${widget.videoUrl}');

    // Strategy: If it fails, try again without cache or with different config once
    if (_retryCount < 1 && mounted && !_isRetrying) {
      _retryCount++;
      _safeSetState(() => _isRetrying = true);

      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          debugPrint('Retrying video initialization (Attempt $_retryCount)...');
          _betterPlayerController?.dispose();
          _betterPlayerController = null;
          _isInitialized = false;
          _hasError = false;

          // Force a state rebuild before re-initializing
          _safeSetState(() {});

          // Re-init with a clean slate
          _initializeBetterPlayer();
          _safeSetState(() => _isRetrying = false);
        }
      });
      return;
    }

    if (mounted) {
      final String exception = params?['exception']?.toString() ?? '';

      // Critical Check: If it's a Renderer error (VP9/HEVC etc.), switch to WebView fallback
      if (exception.contains('Renderer error') ||
          exception.contains('MediaCodec') ||
          exception.contains('ExoPlaybackException') ||
          exception.contains('HEVC') ||
          exception.contains('hvc1') ||
          exception.contains('decoder') || // Log says mtk.hevc.decoder
          exception.contains('delay') || // Log says max output delay
          exception.contains('YouTube Error')) {
        // Added YouTube error check
        debugPrint(
          'Renderer/YouTube Error detected. Switching to WebView Fallback.',
        );
        _safeSetState(() {
          _useWebViewFallback = true;
          _isInitialized = false;
          _isYoutube = false; // Ensure YouTube player is not used
          _isWebEmbed = true; // Mark as web embed
        });
        _initializeWebView();
        return;
      }

      String errorMsg = 'ไม่สามารถโหลดวิดีโอได้';

      if (exception.contains('MediaCodec') ||
          exception.contains('Renderer error')) {
        errorMsg =
            'อุปกรณ์ไม่รองรับการเล่นวิดีโอรูปแบบนี้ชั่วคราว (แนะนำให้ลองใหม่อีกครั้ง)';
      } else if (exception.contains('Network') ||
          exception.contains('timeout')) {
        errorMsg = 'การเชื่อมต่ออินเทอร์เน็ตไม่เสถียร';
      } else {
        errorMsg =
            exception.isNotEmpty ? exception : 'เกิดข้อผิดพลาดในการเล่นวิดีโอ';
      }

      _safeSetState(() {
        _hasError = true;
        _errorDetail = '$errorMsg\n(URL: ${widget.videoUrl})';
      });

      // Auto-skip logic: If auto-scroll is on, skip this broken video after 5 seconds
      if (widget.isAutoScrollEnabled) {
        _autoSkipTimer?.cancel();
        _autoSkipTimer = Timer(const Duration(seconds: 5), () {
          if (mounted && _hasError && widget.onTimerEnd != null) {
            widget.onTimerEnd!();
          }
        });
      }
    }
  }

  @override
  void dispose() {
    _isDisposed = true; // Mark as disposed immediately

    // ✅ OPTIMIZATION: Cancel all timers first to prevent memory leaks
    _cancelHideTimer();
    _autoSkipTimer?.cancel();
    _stopAutoScrollSafetyTimer();
    _debounceTimer?.cancel(); // ✅ Cancel debounce timer
    _stopWatchTimer(); // ✅ Stop intelligent watch tracking

    // ✅ OPTIMIZATION: Dispose players with error handling
    try {
      _betterPlayerController?.dispose();
    } catch (e) {
      debugPrint('TukTuk: Error disposing BetterPlayer: $e');
    }

    try {
      _youtubeController?.close();
    } catch (e) {
      debugPrint('TukTuk: Error disposing YouTube controller: $e');
    }

    _webViewController = null; // Dispose WebView controller if needed
    _discAnimationController.dispose();
    _uiSlideController.dispose();
    _heartAnimationController.dispose();
    _greetingTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  List<Color> _getPostColors() {
    // Example: Dynamically choose colors based on post category or author
    // For now, return the greeting colors
    return _greetingGradientColors;
  }

  void _toggleSaveAudio() async {
    if (_isAudioSaving) return;

    _safeSetState(() {
      _isAudioSaving = true;
    });

    try {
      final postId = widget.postData['id']?.toString();
      if (postId == null || postId.isEmpty) {
        throw Exception('Post ID is missing');
      }

      final success = await TukTukBridge().toggleSaveAudio(postId);
      if (mounted) {
        _safeSetState(() {
          _isAudioSaved = success; // Update based on actual result
          _isAudioSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success ? 'บันทึกเสียงแล้ว' : 'ยกเลิกการบันทึกเสียงแล้ว',
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error toggling audio save: $e');
      if (mounted) {
        _safeSetState(() {
          _isAudioSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ไม่สามารถบันทึกเสียงได้')),
        );
      }
    }
  }

  void _handleShare() {
    final title = widget.postData['title'] ??
        widget.postData['description'] ??
        'ชมวิดีโอนี้บน TukTuk Feed';
    final postId = widget.postData['id'] ?? '';

    // Create shareable deep link with post ID
    String shareUrl;
    if (postId.isNotEmpty) {
      // Use app deep link format that can be handled by the app
      // Use web standard share URL
      shareUrl = 'https://wizmobiz.com/community-share?id=$postId';
    } else {
      // Fallback to direct video URL
      shareUrl = widget.videoUrl;
    }

    final shareText = '''$title

🎬 ดูวิดีโอนี้บน TukTuk Feed:
$shareUrl

📲 ดาวน์โหลดแอป TukTuk เพื่อดูวิดีโอสนุกๆ อีกมากมาย!''';

    SharePlus.instance.share(ShareParams(text: shareText));
  }

  void _toggleMute({bool? forcedMuted}) {
    _safeSetState(() {
      _isMuted = forcedMuted ?? !_isMuted;
      // 1. BetterPlayer
      _betterPlayerController?.setVolume(_isMuted ? 0 : 1);

      // 2. Youtube
      if (_isMuted) {
        _youtubeController?.mute();
      } else {
        _youtubeController?.unMute();
      }

      // 3. WebView
      final mutedValue = _isMuted ? "true" : "false";
      _webViewController?.runJavaScript(
        "const v = document.querySelector('video'); if(v) { v.muted = $mutedValue; console.log('TukTuk WebView: JS Mute set to $mutedValue'); }",
      );
    });
    debugPrint('TukTuk: _toggleMute called, _isMuted is now $_isMuted');
  }

  void _togglePlayPause() {
    if (!_isInitialized) return;

    final controller = _betterPlayerController;
    final bool wasPlaying;

    if (_isYoutube) {
      wasPlaying = _isPlaying;
    } else if (_useWebViewFallback || _isWebEmbed) {
      wasPlaying = _isPlaying;
    } else {
      wasPlaying = controller?.isPlaying() ?? false;
    }

    _safeSetState(() {
      _showTapFeedback = true;
      _lastTapWasPlay = !wasPlaying;
      _isUserPaused = wasPlaying;
    });

    // 1. Manage UI Slide based on Play/Pause
    if (wasPlaying) {
      // Logic: Pause = Slide IN (Show)
      _cancelHideTimer();
      _uiSlideController.reverse();
    } else {
      // Logic: Play = Slide OUT (Hide) after a small delay
      _startHideTimer();
      _uiSlideController.forward();
    }

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _safeSetState(() => _showTapFeedback = false);
    });

    if (wasPlaying) {
      if (_isYoutube) {
        _youtubeController?.pauseVideo();
      } else if (_useWebViewFallback || _isWebEmbed) {
        _pauseWebView();
      } else {
        _betterPlayerController?.pause();
      }
      _safeSetState(() => _isPlaying = false);
      _discAnimationController.stop();
      _stopWatchTimer(); // ✅ Pause tracking
    } else {
      if (_isYoutube) {
        _youtubeController?.playVideo();
        _youtubeController?.unMute();
      } else if (_useWebViewFallback || _isWebEmbed) {
        _playWebView();
      } else {
        _betterPlayerController
            ?.play()
            .catchError((e) => debugPrint('Play toggle error: $e'));
        _betterPlayerController?.setVolume(1.0);
      }
      _safeSetState(() => _isPlaying = true);
      _discAnimationController.repeat();
      _startWatchTimer(); // ✅ Resume tracking
    }
  }

  void _startFastForward() {
    if (_betterPlayerController == null) return;
    try {
      (_betterPlayerController as dynamic)
          .setPlaybackSpeed(2.0); // Changed to 2x
    } catch (e) {
      debugPrint('Error setting speed: $e');
    }
    _safeSetState(() {
      _isFastForwarding = true;
    });
  }

  void _stopFastForward() {
    if (_betterPlayerController == null) return;
    try {
      (_betterPlayerController as dynamic).setPlaybackSpeed(1.0);
    } catch (e) {
      debugPrint('Error resetting speed: $e');
    }
    _safeSetState(() {
      _isFastForwarding = false;
    });
  }

  void _showMoreOptions() async {
    final user = await TukTukBridge().getCurrentUser();

    // Improved Owner check (Matches both Firebase UID and LINE User ID)
    final String? currentUid = user?['uid']?.toString();
    final String? currentLineId = user?['lineUserId']?.toString();
    final String? postAuthorId = widget.postData['authorId']?.toString();

    final bool isOwner = user != null &&
        postAuthorId != null &&
        (currentUid == postAuthorId || currentLineId == postAuthorId);

    debugPrint(
      'MoreOptions: isOwner=$isOwner (user=$currentUid, line=$currentLineId, author=$postAuthorId)',
    );

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.grey[900]?.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
          border: Border.all(color: Colors.white10),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              _buildOptionTile(
                icon: widget.isAutoScrollEnabled
                    ? Icons.auto_mode
                    : Icons.play_disabled_rounded,
                label: widget.isAutoScrollEnabled
                    ? 'เล่นอัตโนมัติ (เปิดอยู่)'
                    : 'เล่นอัตโนมัติ (ปิดอยู่)',
                color: widget.isAutoScrollEnabled ? Colors.orange : Colors.grey,
                onTap: () {
                  Navigator.pop(context);
                  if (widget.onToggleAutoScroll != null) {
                    widget.onToggleAutoScroll!();
                  }
                },
              ),
              _buildOptionTile(
                icon: Icons.web_rounded,
                label: _useWebViewFallback
                    ? 'เล่นแบบปกติ'
                    : 'เล่นด้วยระบบสำรอง (WebView)',
                color: Colors.greenAccent,
                onTap: () {
                  Navigator.pop(context);
                  _safeSetState(() {
                    _useWebViewFallback = !_useWebViewFallback;
                    _isInitialized = false;
                  });
                  if (_useWebViewFallback) {
                    _initializeWebView();
                  } else {
                    _initializePlayer();
                  }
                },
              ),
              _buildOptionTile(
                icon: Icons.open_in_browser_rounded,
                label: 'เปิดในเบราว์เซอร์',
                color: Colors.white70,
                onTap: () {
                  Navigator.pop(context);
                  launchUrl(
                    Uri.parse(widget.videoUrl),
                    mode: LaunchMode.externalApplication,
                  );
                },
              ),
              if (isOwner) ...[
                _buildOptionTile(
                  icon: Icons.edit_note,
                  label: 'แก้ไขโพสต์',
                  color: Colors.blueAccent,
                  onTap: () {
                    Navigator.pop(context);
                    _editPost();
                  },
                ),
                _buildOptionTile(
                  icon: Icons.delete_outline,
                  label: 'ลบโพสต์',
                  color: Colors.redAccent,
                  onTap: () {
                    Navigator.pop(context);
                    _confirmDelete();
                  },
                ),
              ],
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  void _startAutoScrollSafetyTimer() {
    _stopAutoScrollSafetyTimer();
    // For embeds or fallbacks, we might not get a reliable "ended" event
    // So we use a 60 second safety timer if auto-scroll is enabled
    if (widget.isAutoScrollEnabled && widget.onTimerEnd != null) {
      debugPrint('Starting Auto-Scroll Safety Timer (60s)');
      _autoScrollSafetyTimer = Timer(const Duration(seconds: 60), () {
        if (mounted && widget.isActive && widget.onTimerEnd != null) {
          debugPrint('Auto-Scroll Safety Timer Triggered');
          widget.onTimerEnd!();
        }
      });
    }
  }

  void _stopAutoScrollSafetyTimer() {
    _autoScrollSafetyTimer?.cancel();
    _autoScrollSafetyTimer = null;
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(label, style: const TextStyle(color: Colors.white)),
      onTap: onTap,
    );
  }

  Future<void> _confirmDelete() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('ยืนยันการลบ', style: TextStyle(color: Colors.white)),
        content: const Text(
          'คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('ยกเลิก', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ลบ', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      try {
        final postId = widget.postData['id'];
        if (postId == null) return;

        // Extract media URLs for storage cleanup
        final List<String> mediaUrls = [];
        if (widget.videoUrl.isNotEmpty) mediaUrls.add(widget.videoUrl);

        final success = await TukTukBridge()
            .deleteCommunityPost(postId, mediaUrls: mediaUrls);

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('ลบโพสต์สำเร็จ')),
          );
        }
      } catch (e) {
        debugPrint('Delete error: $e');
      }
    }
  }

  void _editPost() {
    final TextEditingController descController = TextEditingController(
      text: widget.postData['description'] ?? widget.postData['title'] ?? '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'แก้ไขคำบรรยาย',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 15),
              TextField(
                controller: descController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'เขียนคำบรรยายของคุณ...',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.05),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'ยกเลิก',
                        style: TextStyle(color: Colors.white54),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: () async {
                        final String newDesc = descController.text.trim();
                        final String postId = widget.postData['id'] ?? '';

                        if (postId.isNotEmpty) {
                          final success =
                              await TukTukBridge().updateCommunityPost(
                            postId,
                            {'description': newDesc},
                          );
                          if (success && mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('อัปเดตโพสต์แล้ว')),
                            );
                            // In a real app, you might want to call a refresh
                            // callback here, but for now we rely on the next
                            // feed refresh or state update.
                          }
                        }
                      },
                      child: const Text(
                        'บันทึก',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  @override
  @override
  Widget build(BuildContext context) {
    super.build(context); // ✅ REQUIRED FOR AutomaticKeepAliveClientMixin

    return Stack(
      fit: StackFit.expand,
      children: [
        // Video Background
        GestureDetector(
          behavior: HitTestBehavior.opaque, // Fix tap not working sometimes
          onTap: _togglePlayPause,
          onDoubleTapDown: (details) {
            _safeSetState(() {
              _heartPosition = details.localPosition;
            });
            _handleLike(isDoubleTap: true);
          },
          onDoubleTap: () {
            // Handled by onDoubleTapDown for position but kept to trigger correct gesture timing
          },
          onLongPress: _startFastForward,
          onLongPressUp: _stopFastForward,
          child: _hasError
              ? _buildErrorWidget()
              : RepaintBoundary(
                  child: Stack(
                    children: [
                      () {
                        Widget content;
                        if ((_useWebViewFallback || _isWebEmbed) &&
                            _webViewController != null) {
                          content = WebViewWidget(
                            controller: _webViewController!,
                          );
                        } else if (_isYoutube && _youtubeController != null) {
                          content = Center(
                            child: YoutubePlayer(
                              key: ValueKey(
                                'youtube_player_${widget.postData['id']}',
                              ), // Add a key for YouTube player
                              controller: _youtubeController!,
                              aspectRatio: 9 / 16,
                            ),
                          );
                        } else if (_isImageOnly) {
                          content = CachedNetworkImage(
                            imageUrl: widget.videoUrl,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => _buildLoadingWidget(),
                            errorWidget: (_, __, ___) => _buildErrorWidget(),
                          );
                        } else {
                          final controller = _betterPlayerController;
                          if (controller != null) {
                            content = BetterPlayer(controller: controller);
                          } else {
                            content = _buildLoadingWidget();
                          }
                        }
                        // Wrap with IgnorePointer to allow tap gestures to pass through
                        return IgnorePointer(
                          child: _wrapWithFilter(content),
                        );
                      }(),

                      // Text Overlays
                      if (!_isWebEmbed) ..._buildOverlays(),

                      // Pause Overlay Icon (Persistent when paused)
                      if (_isUserPaused)
                        IgnorePointer(
                          child: Center(
                            child: FadeIn(
                              duration: const Duration(milliseconds: 200),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: const BoxDecoration(
                                  color: Colors.black26,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.play_arrow_rounded,
                                  size: 70,
                                  color: Colors.white.withValues(alpha: 0.8),
                                ),
                              ),
                            ),
                          ),
                        ),

                      // ✅ FEATURE: Greeting Overlay Animation
                      GreetingOverlay(
                        showGreeting: _showGreeting,
                        greetingOpacity: _greetingOpacity,
                        greetingMessage: _greetingMessage,
                        gradientColors: _getPostColors(),
                      ),

                      // Fast Forward Overlay
                      if (_isFastForwarding)
                        Positioned(
                          top: 100,
                          left: 0,
                          right: 0,
                          child: IgnorePointer(
                            child: Center(
                              child: FadeIn(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.black54,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.fast_forward_rounded,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        '2.0x Speed',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                      // Tap Feedback Animation
                      if (_showTapFeedback)
                        IgnorePointer(
                          child: Center(
                            child: TweenAnimationBuilder<double>(
                              tween: Tween(begin: 0.8, end: 1.2),
                              duration: const Duration(milliseconds: 200),
                              builder: (context, scale, child) {
                                return Transform.scale(
                                  scale: scale,
                                  child: AnimatedOpacity(
                                    opacity: scale > 1.1 ? 0.0 : 0.8,
                                    duration: const Duration(milliseconds: 200),
                                    child: Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        color:
                                            Colors.black.withValues(alpha: 0.3),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        _lastTapWasPlay
                                            ? Icons.play_arrow_rounded
                                            : Icons.pause_rounded,
                                        size: 50,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),

                      // Elegant Single-Heart Animation (Reverted)
                      if (_heartOpacity > 0)
                        Positioned(
                          left: _heartPosition.dx - 50,
                          top: _heartPosition.dy - 50,
                          child: IgnorePointer(
                            child: FadeTransition(
                              opacity: CurvedAnimation(
                                parent: _heartAnimationController,
                                curve: const Interval(
                                  0.0,
                                  0.8,
                                  curve: Curves.easeIn,
                                ),
                              ),
                              child: ScaleTransition(
                                scale:
                                    Tween<double>(begin: 0.0, end: 1.5).animate(
                                  CurvedAnimation(
                                    parent: _heartAnimationController,
                                    curve: Curves.elasticOut,
                                  ),
                                ),
                                child: Image.asset(
                                  'assets/images/finger_heart.png',
                                  width: 100,
                                  height: 100,
                                  errorBuilder: (context, error, stackTrace) =>
                                      const Icon(
                                    Icons.favorite,
                                    color: Colors.pinkAccent,
                                    size: 80,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
        ),

        // Dark Gradient for readability
        _buildGradientOverlay(),

        // TukTuk Choice Badge (Top Left)
        Positioned(
          top: MediaQuery.of(context).padding.top + 10,
          left: 15,
          child: IgnorePointer(child: _buildTukTukChoiceBadge()),
        ),

        // Volume button removed — mute is now controlled globally via the notification pill in the top nav

        // ✅ FEATURE: Greeting Overlay Animation (Top Center alternative)
        // Placed here if we want it above everything, but inside Stack is fine too.

        // Profile & Description Overlay (Bottom Left)
        Positioned(
          left: 15,
          bottom: 85,
          right: 90,
          child: RepaintBoundary(
            child: SlideTransition(
              position: _bottomInfoSlideAnimation,
              child: FadeTransition(
                opacity: ReverseAnimation(_uiSlideController),
                child: _buildProfileSection(),
              ),
            ),
          ),
        ),

        Positioned(
          right: 8,
          bottom: 105,
          child: RepaintBoundary(
            child: SlideTransition(
              position: _sidePanelSlideAnimation,
              child: FadeTransition(
                opacity: ReverseAnimation(_uiSlideController),
                child: VideoSideActions(
                  postData: widget.postData,
                  isLiked: _isLiked,
                  likesCount: _likesCount,
                  authorPic: _authorPic,
                  isPlaying: _isPlaying,
                  isAudioSaved: _isAudioSaved,
                  isAudioSaving: _isAudioSaving,
                  discAnimationController: _discAnimationController,
                  onLike: _handleLike,
                  onShare: _handleShare,
                  onTogglePlay: _togglePlayPause,
                  onToggleSaveAudio: _toggleSaveAudio,
                  onShowMore: _showMoreOptions,
                  onPauseVideo: () {
                    _betterPlayerController?.pause();
                    _youtubeController?.pauseVideo();
                    _safeSetState(() => _isPlaying = false);
                  },
                  onResumeVideo: (shouldPlay) {
                    if (widget.isActive && shouldPlay) {
                      _betterPlayerController?.play();
                      _youtubeController?.playVideo();
                      _safeSetState(() => _isPlaying = true);
                    }
                  },
                ),
              ),
            ),
          ),
        ),

        // Permanent Progress Bar (Always visible but thinner when HUD is hidden)
        Positioned(
          bottom: 78,
          left: 0,
          right: 0,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 300),
            opacity: _showUi ? 1.0 : 0.4,
            child: IgnorePointer(child: _buildProgressBar()),
          ),
        ),
      ],
    );
  }

  // TukTuk Choice Badge
  Widget _buildTukTukChoiceBadge() {
    final isTukTukChoice = widget.postData['isTukTukChoice'] == true ||
        widget.postData['featured'] == true;

    if (!isTukTukChoice) return const SizedBox.shrink();

    return FadeInLeft(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Colors.greenAccent,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.greenAccent,
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'TukTuk Choice',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Profile Section (Bottom Left)
  Widget _buildProfileSection() {
    return FadeInUp(
      duration: const Duration(milliseconds: 500),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.postData['poll'] != null)
            PollWidget(
              postId: widget.postData['id']?.toString() ?? '',
              pollData: Map<String, dynamic>.from(widget.postData['poll']),
            ),
          const SizedBox(height: 12),
          // Author Info Row
          Row(
            children: [
              // Avatar with border
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.orange,
                    width: 2,
                  ),
                ),
                child: CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.grey[900],
                  backgroundImage:
                      (_authorPic != null && _authorPic!.startsWith('http'))
                          ? CachedNetworkImageProvider(_authorPic!)
                          : null,
                  child: (_authorPic == null || !_authorPic!.startsWith('http'))
                      ? const Icon(Icons.person, color: Colors.white, size: 18)
                      : null,
                ),
              ),
              const SizedBox(width: 10),
              // Author Name & Stats
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          _authorName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            shadows: [
                              Shadow(blurRadius: 10, color: Colors.black),
                            ],
                          ),
                        ),
                        if (_isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.verified,
                            color: Colors.orange,
                            size: 14,
                          ),
                        ],
                      ],
                    ),
                    Row(
                      children: [
                        Text(
                          '$_followersCount ผู้ติดตาม • $_viewsCount ดู',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 11,
                          ),
                        ),
                        if (_lastSeen != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            width: 3,
                            height: 3,
                            decoration: const BoxDecoration(
                              color: Colors.white30,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _formatLastSeen(_lastSeen!),
                            style: TextStyle(
                              color: const Color(0xFF00f2ea)
                                  .withValues(alpha: 0.8),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          if (widget.postData['isTukTukChoice'] == true ||
              widget.postData['featured'] == true)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'TukTuk Choice',
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

          // Description that opens detail
          GestureDetector(
            onTap: () {
              // Pause video before navigating
              _betterPlayerController?.pause();
              _youtubeController?.pauseVideo();
              _safeSetState(() => _isPlaying = false);

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      PostDetailScreen(postData: widget.postData),
                ),
              ).then((_) {
                // Resume if needed when coming back
                if (widget.isActive && !_isUserPaused) {
                  _betterPlayerController?.play();
                  _youtubeController?.playVideo();
                  _safeSetState(() => _isPlaying = true);
                }
              });
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.postData['description'] ??
                      widget.postData['title'] ??
                      widget.postData['content'] ??
                      '',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    height: 1.4,
                    shadows: [Shadow(blurRadius: 10, color: Colors.black)],
                  ),
                ),
                if (widget.postData['description'] != null &&
                    widget.postData['description'].length > 60)
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text(
                      'อ่านเพิ่มเติมเละดูความคิดเห็น...',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Music/Sound Row
          Row(
            children: [
              const Icon(Icons.music_note, color: Colors.white70, size: 16),
              const SizedBox(width: 6),
              Expanded(
                child: GestureDetector(
                  onTap: _toggleSaveAudio,
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(
                          widget.postData['soundName'] ??
                              '$_authorName - Original Sound',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      if (_isAudioSaved) ...[
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.check_circle,
                          color: Colors.greenAccent,
                          size: 12,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Side Actions Panel (Glassmorphism Style)
  Widget _buildGradientOverlay() {
    return Positioned.fill(
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.black.withValues(alpha: 0.3),
                Colors.transparent,
                Colors.transparent,
                Colors.black.withValues(alpha: 0.7),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: const [0.0, 0.2, 0.6, 1.0],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    // Optimized: Only build stream if we are actually viewing this video
    if (!widget.isActive || !_isInitialized) {
      return Container();
    }

    return StreamBuilder(
      stream: Stream.periodic(const Duration(milliseconds: 500))
          .takeWhile((_) => widget.isActive),
      builder: (context, snapshot) {
        Duration position = Duration.zero;
        Duration duration = const Duration(seconds: 1);

        if (_isYoutube && _youtubeController != null) {
          // For YouTube, we'd ideally use the stream, but for the universal bar,
          // we can try to get it if the controller provides it.
          // In this version of youtube_player_iframe, it's reactive.
          // We'll leave it empty for now or try to use a more complex approach if needed.
          return Container(); // YouTube typically has its own built-in progress if enabled, but we hide it.
        } else if ((_useWebViewFallback || _isWebEmbed) &&
            _webViewController != null) {
          // WebView progress is tricky, we can try to inject JS to get it
          // but it's async. We'll skip for now to avoid lag.
          return Container();
        } else {
          final controller = _betterPlayerController;
          if (controller == null) return Container();
          position =
              controller.videoPlayerController?.value.position ?? Duration.zero;
          duration = controller.videoPlayerController?.value.duration ??
              const Duration(seconds: 1);
        }

        final progress = duration.inMilliseconds > 0
            ? position.inMilliseconds / duration.inMilliseconds
            : 0.0;

        final posStr = _formatDuration(position);
        final durStr = _formatDuration(duration);

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_showUi && duration.inSeconds > 0)
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      '$posStr / $durStr',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        shadows: [Shadow(blurRadius: 4, color: Colors.black)],
                      ),
                    ),
                  ],
                ),
              ),
            Container(
              height: 2,
              margin: const EdgeInsets.only(left: 15, right: 15, bottom: 8),
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(1)),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(1),
                child: LinearProgressIndicator(
                  value: progress.clamp(0.0, 1.0),
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    final String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    final String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    if (duration.inHours > 0) {
      return "${twoDigits(duration.inHours)}:$twoDigitMinutes:$twoDigitSeconds";
    }
    return "$twoDigitMinutes:$twoDigitSeconds";
  }

  Widget _buildThumbnailPlaceholder() {
    final thumbUrl = parser.TuktukVideoParser.getThumbnailUrl(widget.postData);
    if (thumbUrl == null) return _buildLoadingWidget();

    return Stack(
      fit: StackFit.expand,
      children: [
        CachedNetworkImage(
          imageUrl: thumbUrl,
          fit: BoxFit.cover,
          placeholder: (_, __) => _buildLoadingWidget(),
          errorWidget: (_, __, ___) => _buildLoadingWidget(),
        ),
        // Glassy overlay
        _buildLoadingWidget(),
      ],
    );
  }

  Widget _buildErrorWidget() {
    // For ALL video failures show a content-rich fallback card instead of
    // the generic error screen so the feed slot remains useful.
    return VideoFallbackCard(
      failedUrl: widget.videoUrl,
      mediaType: 'video',
      onRetry: () {
        _safeSetState(() {
          _hasError = false;
          _isInitialized = false;
          _webViewErrorCount = 0;
          _useWebViewFallback = false;
        });
        _initializePlayer();
      },
    );
  }

  Widget _buildErrorButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingWidget() {
    final thumbUrl = parser.TuktukVideoParser.getThumbnailUrl(widget.postData);

    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (thumbUrl != null)
            CachedNetworkImage(
              imageUrl: thumbUrl,
              fit: BoxFit.cover,
              color: Colors.black.withValues(alpha: 0.3),
              colorBlendMode: BlendMode.darken,
            ),
          // Blur effect for professional look
          if (thumbUrl != null)
            Positioned.fill(
              child: BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(color: Colors.black.withValues(alpha: 0.2)),
              ),
            ),
          const Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    color: Colors.orange,
                    strokeWidth: 2,
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  'กำลังโหลด...',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _wrapWithFilter(Widget child) {
    final int filterId = widget.postData['filter_id'] ?? 0;
    List<double>? matrix;

    switch (filterId) {
      case 1: // Smooth / Beauty
        matrix = <double>[
          1.1,
          0,
          0,
          0,
          0,
          0,
          1.05,
          0,
          0,
          0,
          0,
          0,
          1.05,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];
        break;
      case 2: // Vibrant
        matrix = <double>[
          1.2,
          0,
          0,
          0,
          0,
          0,
          1.2,
          0,
          0,
          0,
          0,
          0,
          1.2,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];
        break;
      case 3: // Soft / Cool
        matrix = <double>[
          1.0,
          0,
          0,
          0,
          0,
          0,
          1.0,
          0,
          0,
          0,
          0,
          0,
          1.1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];
        break;
      default:
        matrix = null;
    }

    if (matrix != null) {
      return ColorFiltered(
        colorFilter: ColorFilter.matrix(matrix),
        child: child,
      );
    }
    return child;
  }

  List<Widget> _buildOverlays() {
    if (widget.postData['images'] == null) return [];

    // Find the image object matching current URL
    final List<dynamic> images = widget.postData['images'];
    final imageObj = images.firstWhere(
      (img) =>
          (img is Map && img['url'] == widget.videoUrl) ||
          (img is String && img == widget.videoUrl),
      orElse: () => null,
    );

    if (imageObj == null || imageObj is! Map || imageObj['overlays'] == null) {
      return [];
    }

    final List<dynamic> overlaysData = imageObj['overlays'];

    return overlaysData.map((data) {
      final overlay = TextOverlay.fromJson(data);
      return Positioned(
        left: MediaQuery.of(context).size.width * overlay.x - 100,
        top: MediaQuery.of(context).size.height * overlay.y - 50,
        child: IgnorePointer(
          child: Transform.scale(
            scale: overlay.scale,
            child: Container(
              constraints: const BoxConstraints(minWidth: 50, maxWidth: 300),
              padding: const EdgeInsets.all(8),
              decoration: overlay.style == TextStyleType.box
                  ? BoxDecoration(
                      color: overlay.color,
                      borderRadius: BorderRadius.circular(8),
                    )
                  : null,
              child: Text(
                overlay.text,
                textAlign: TextAlign.center,
                style: _getTextStyle(overlay),
              ),
            ),
          ),
        ),
      );
    }).toList();
  }

  TextStyle _getTextStyle(TextOverlay overlay) {
    const double fontSize = 24.0;

    // Apply Font
    final TextStyle baseStyle = GoogleFonts.getFont(overlay.fontName);

    switch (overlay.style) {
      case TextStyleType.classic:
        return baseStyle.copyWith(
          color: overlay.color,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 2,
              offset: const Offset(1, 1),
            ),
          ],
        );
      case TextStyleType.neon:
        return baseStyle.copyWith(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(color: overlay.color, blurRadius: 10),
            Shadow(color: overlay.color, blurRadius: 20),
            Shadow(color: overlay.color, blurRadius: 30),
          ],
        );
      case TextStyleType.outline:
        return baseStyle.copyWith(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          foreground: Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 3
            ..color = overlay.color,
        );
      case TextStyleType.box:
        return baseStyle.copyWith(
          color: overlay.color.computeLuminance() > 0.5
              ? Colors.black
              : Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        );
    }
  }
}
