import 'dart:async';

import 'package:caculateapp/tuktuk/screens/community_post_screen.dart';
import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:caculateapp/tuktuk/widgets/community_feed_view.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

// ─────────────────────────────────────────────────────────────────────────────
// CommunityHubScreen
//   Full-screen Scaffold wrapping CommunityFeedView.
//   Accepts an optional [initialFilter] so "ช่าง & บริการ" can pre-select
//   the eco_pros occupational group directly.
// ─────────────────────────────────────────────────────────────────────────────
class CommunityHubScreen extends StatefulWidget {
  final String? initialFilter;

  const CommunityHubScreen({super.key, this.initialFilter});

  @override
  State<CommunityHubScreen> createState() => _CommunityHubScreenState();
}

class _CommunityHubScreenState extends State<CommunityHubScreen> {
  List<TukTukItem> _items = [];
  bool _isLoading = true;
  bool _hasMore = true;
  DocumentSnapshot? _lastDoc;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _filter = widget.initialFilter ?? 'all';
    _load();
  }

  Future<void> _load({bool refresh = true}) async {
    if (!refresh && !_hasMore) return;

    try {
      Query q = FirebaseFirestore.instance
          .collection('posts')
          .orderBy('createdAt', descending: true)
          .limit(20);

      if (_filter != 'all' && !_filter.startsWith('eco_')) {
        q = q.where('category', isEqualTo: _filter);
      }

      if (!refresh && _lastDoc != null) {
        q = q.startAfterDocument(_lastDoc!);
      }

      final snap = await q.get().timeout(const Duration(seconds: 12));
      final newItems = snap.docs.map(TukTukItem.fromPost).toList();

      if (mounted) {
        setState(() {
          if (refresh) {
            _items = newItems;
          } else {
            _items.addAll(newItems);
          }
          _lastDoc =
              snap.docs.isNotEmpty ? snap.docs.last : _lastDoc;
          _hasMore = snap.docs.length >= 20;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0F1E),
      body: CommunityFeedView(
        items: _items,
        isLoading: _isLoading,
        hasMore: _hasMore,
        onRefresh: _load,
        onLoadMore: () => _load(refresh: false),
        onFilterChanged: (f) {
          setState(() {
            _filter = f;
            _items = [];
            _lastDoc = null;
            _isLoading = true;
          });
          _load();
        },
        onPostTap: () async {
          final result = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => Container(
              height: MediaQuery.of(context).size.height * 0.9,
              decoration: const BoxDecoration(
                color: Color(0xFF111827),
                borderRadius:
                    BorderRadius.vertical(top: Radius.circular(24)),
              ),
              clipBehavior: Clip.antiAlias,
              child: const CommunityPostScreen(),
            ),
          );
          if (result == true && mounted) unawaited(_load());
        },
        onCameraTap: () async {
          final img = await ImagePicker()
              .pickImage(source: ImageSource.camera);
          if (img != null) debugPrint('Camera: ${img.path}');
        },
        onVoiceTap: () {},
      ),
    );
  }
}
