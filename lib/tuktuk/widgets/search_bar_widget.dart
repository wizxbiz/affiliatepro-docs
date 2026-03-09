import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

import '../services/search_service.dart';

/// Enhanced search bar with autocomplete overlay and search history chips.
///
/// Usage:
/// ```dart
/// TukTukSearchBar(
///   onChanged: (q) => setState(() => _query = q),
///   onFilterTap: () async { ... },
///   activeFilterCount: _filters.activeCount,
/// )
/// ```
class TukTukSearchBar extends StatefulWidget {
  final ValueChanged<String> onChanged;
  final VoidCallback? onFilterTap;
  final int activeFilterCount;
  final String hintText;
  final TextEditingController? controller;

  const TukTukSearchBar({
    super.key,
    required this.onChanged,
    this.onFilterTap,
    this.activeFilterCount = 0,
    this.hintText = 'ค้นหาสินค้า...',
    this.controller,
  });

  @override
  State<TukTukSearchBar> createState() => _TukTukSearchBarState();
}

class _TukTukSearchBarState extends State<TukTukSearchBar> {
  late TextEditingController _ctrl;
  final FocusNode _focus = FocusNode();
  final LayerLink _layerLink = LayerLink();

  Timer? _debounce;
  OverlayEntry? _overlayEntry;
  List<String> _suggestions = [];
  List<String> _history = [];

  @override
  void initState() {
    super.initState();
    _ctrl = widget.controller ?? TextEditingController();
    _focus.addListener(_onFocusChange);
    _loadHistory();
  }

  @override
  void dispose() {
    if (widget.controller == null) _ctrl.dispose();
    _focus.removeListener(_onFocusChange);
    _focus.dispose();
    _debounce?.cancel();
    _removeOverlay();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final h = await SearchService().getHistory();
    if (mounted) setState(() => _history = h);
  }

  void _onFocusChange() {
    if (_focus.hasFocus && _ctrl.text.isEmpty && _history.isNotEmpty) {
      _showHistoryOverlay();
    } else if (!_focus.hasFocus) {
      // Small delay so tap on suggestion registers first
      Future.delayed(const Duration(milliseconds: 150), _removeOverlay);
    }
  }

  // ── Debounced input handler ────────────────────────────────────────────────

  void _onChanged(String value) {
    widget.onChanged(value);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (value.trim().length >= 2) {
        _fetchSuggestions(value.trim());
      } else if (value.isEmpty) {
        _showHistoryOverlay();
      } else {
        _removeOverlay();
      }
    });
  }

  void _onSubmitted(String value) {
    if (value.trim().isNotEmpty) {
      SearchService().addToHistory(value.trim());
      _loadHistory();
    }
    _removeOverlay();
    widget.onChanged(value);
  }

  // ── Autocomplete ───────────────────────────────────────────────────────────

  Future<void> _fetchSuggestions(String query) async {
    try {
      final fn = FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('getSearchSuggestions');
      final result = await fn.call({'query': query, 'limit': 8});
      final data = result.data as Map?;
      final list = (data?['suggestions'] as List?)?.cast<String>() ?? [];
      if (mounted) {
        setState(() => _suggestions = list);
        if (list.isNotEmpty) {
          _showSuggestionsOverlay();
        } else {
          _removeOverlay();
        }
      }
    } catch (_) {
      _removeOverlay();
    }
  }

  void _selectSuggestion(String text) {
    _ctrl.text = text;
    _ctrl.selection = TextSelection.collapsed(offset: text.length);
    SearchService().addToHistory(text);
    _loadHistory();
    widget.onChanged(text);
    _removeOverlay();
    _focus.unfocus();
  }

  void _selectHistory(String text) {
    _ctrl.text = text;
    _ctrl.selection = TextSelection.collapsed(offset: text.length);
    widget.onChanged(text);
    _removeOverlay();
    _focus.unfocus();
  }

  // ── Overlay management ─────────────────────────────────────────────────────

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _showSuggestionsOverlay() {
    _removeOverlay();
    _overlayEntry = _buildOverlay(_buildSuggestionItems());
    Overlay.of(context).insert(_overlayEntry!);
  }

  void _showHistoryOverlay() {
    _removeOverlay();
    _overlayEntry = _buildOverlay(_buildHistoryItems());
    Overlay.of(context).insert(_overlayEntry!);
  }

  OverlayEntry _buildOverlay(Widget child) {
    return OverlayEntry(
      builder: (ctx) => Positioned(
        width: MediaQuery.of(context).size.width - 32,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: const Offset(0, 52),
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(14),
            color: const Color(0xFF1E1E30),
            child: child,
          ),
        ),
      ),
    );
  }

  Widget _buildSuggestionItems() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: _suggestions.asMap().entries.map((e) {
        final i = e.key;
        final s = e.value;
        return ListTile(
          dense: true,
          leading: const Icon(Icons.search, color: Color(0xFF00C4CC), size: 18),
          title: Text(s, style: const TextStyle(color: Colors.white, fontSize: 14)),
          onTap: () => _selectSuggestion(s),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(
              top: i == 0 ? const Radius.circular(14) : Radius.zero,
              bottom: i == _suggestions.length - 1 ? const Radius.circular(14) : Radius.zero,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildHistoryItems() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 4, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('ค้นหาล่าสุด',
                  style: TextStyle(color: Colors.white54, fontSize: 12),),
              TextButton(
                onPressed: () async {
                  await SearchService().clearHistory();
                  _loadHistory();
                  _removeOverlay();
                },
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(40, 28),
                ),
                child: const Text('ล้าง',
                    style: TextStyle(color: Color(0xFF00C4CC), fontSize: 12),),
              ),
            ],
          ),
        ),
        ..._history.asMap().entries.map((e) {
          final i = e.key;
          final h = e.value;
          return ListTile(
            dense: true,
            leading: const Icon(Icons.history, color: Colors.white38, size: 18),
            title: Text(h, style: const TextStyle(color: Colors.white70, fontSize: 14)),
            trailing: IconButton(
              icon: const Icon(Icons.close, color: Colors.white38, size: 16),
              onPressed: () async {
                await SearchService().removeFromHistory(h);
                _loadHistory();
                if (_history.isEmpty) {
                  _removeOverlay();
                } else {
                  _showHistoryOverlay();
                }
              },
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            onTap: () => _selectHistory(h),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(
                bottom: i == _history.length - 1 ? const Radius.circular(14) : Radius.zero,
              ),
            ),
          );
        }),
      ],
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white10,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _focus.hasFocus
                ? const Color(0xFF00C4CC).withAlpha(180)
                : Colors.white24,
          ),
        ),
        child: Row(
          children: [
            const SizedBox(width: 12),
            const Icon(Icons.search, color: Colors.white54, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _ctrl,
                focusNode: _focus,
                onChanged: _onChanged,
                onSubmitted: _onSubmitted,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: InputDecoration(
                  hintText: widget.hintText,
                  hintStyle: const TextStyle(color: Colors.white38),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                  suffixIcon: _ctrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close, size: 18, color: Colors.white38),
                          onPressed: () {
                            _ctrl.clear();
                            widget.onChanged('');
                            _removeOverlay();
                            setState(() {});
                          },
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        )
                      : null,
                ),
              ),
            ),
            if (widget.onFilterTap != null) ...[
              const SizedBox(width: 4),
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: const Icon(Icons.tune_rounded, color: Colors.white70),
                    onPressed: widget.onFilterTap,
                    tooltip: 'ตัวกรอง',
                  ),
                  if (widget.activeFilterCount > 0)
                    Positioned(
                      right: 6,
                      top: 6,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: const BoxDecoration(
                          color: Color(0xFF00C4CC),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${widget.activeFilterCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(width: 4),
          ],
        ),
      ),
    );
  }
}
