import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class FeedTabState extends ChangeNotifier {
  final int tabIndex;
  List<TukTukItem> _items = [];
  bool _isInitialLoading = true;
  bool _isLoading = false;
  int _currentPage = 0;
  DocumentSnapshot? _lastPostDoc;
  DocumentSnapshot? _lastProductDoc;
  bool _hasMore = true;
  String? _errorMessage;
  final PageController pageController = PageController();
  final PageStorageKey pageKey;

  List<TukTukItem> get items => _items;
  bool get isInitialLoading => _isInitialLoading;
  bool get isLoading => _isLoading;
  int get currentPage => _currentPage;
  DocumentSnapshot? get lastPostDoc => _lastPostDoc;
  DocumentSnapshot? get lastProductDoc => _lastProductDoc;
  bool get hasMore => _hasMore;
  String? get errorMessage => _errorMessage;

  set items(List<TukTukItem> value) {
    _items = value;
    notifyListeners();
  }

  set isInitialLoading(bool value) {
    _isInitialLoading = value;
    notifyListeners();
  }

  set isLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  set currentPage(int value) {
    _currentPage = value;
    notifyListeners();
  }

  set lastPostDoc(DocumentSnapshot? value) {
    _lastPostDoc = value;
    notifyListeners();
  }

  set lastProductDoc(DocumentSnapshot? value) {
    _lastProductDoc = value;
    notifyListeners();
  }

  set hasMore(bool value) {
    _hasMore = value;
    notifyListeners();
  }

  set errorMessage(String? value) {
    _errorMessage = value;
    notifyListeners();
  }

  FeedTabState(this.tabIndex)
      : pageKey = PageStorageKey('tuktuk_feed_$tabIndex');

  void appendItems(List<TukTukItem> newItems) {
    _items.addAll(newItems);
    notifyListeners();
  }

  void insertItem(int index, TukTukItem item) {
    _items.insert(index, item);
    notifyListeners();
  }

  void removeItemAt(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      notifyListeners();
    }
  }

  void replaceItems(List<TukTukItem> items) {
    _items.clear();
    _items.addAll(items);
    _lastPostDoc = null;
    _lastProductDoc = null;
    notifyListeners();
  }

  void clearItems() {
    _items.clear();
    _lastPostDoc = null;
    _lastProductDoc = null;
    notifyListeners();
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }
}
