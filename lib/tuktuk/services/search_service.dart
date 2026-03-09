import 'package:fuzzy/fuzzy.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// A single scored search result wrapping a product map.
class SearchResult {
  final Map<String, dynamic> product;
  final double score;
  const SearchResult(this.product, this.score);
}

/// Centralized search service: fuzzy multi-field scoring + history.
class SearchService {
  static final SearchService _i = SearchService._();
  factory SearchService() => _i;
  SearchService._();

  static const _historyKey = 'tuktuk_search_history';
  static const _maxHistory = 10;

  // ── Fuzzy Search ────────────────────────────────────────────────────────────

  /// Score and rank [products] by relevance to [query].
  /// Fields: productName (×3), tags (×2), description (×1).
  /// Returns only matching results sorted by score descending.
  List<SearchResult> search(
    String query,
    List<Map<String, dynamic>> products,
  ) {
    if (query.trim().isEmpty) {
      return products.map((p) => SearchResult(p, 1.0)).toList();
    }

    final names = products
        .map((p) => '${p['productName'] ?? p['title'] ?? ''}')
        .toList();
    final descs =
        products.map((p) => '${p['description'] ?? ''}').toList();

    final fuzzyName = Fuzzy<String>(
      names,
      options: FuzzyOptions(threshold: 0.4, tokenize: true),
    );
    final fuzzyDesc = Fuzzy<String>(
      descs,
      options: FuzzyOptions(threshold: 0.5, tokenize: true),
    );

    final scores = List<double>.filled(products.length, 0.0);

    for (final r in fuzzyName.search(query)) {
      final idx = names.indexOf(r.item);
      if (idx >= 0) scores[idx] += r.score * 3.0;
    }
    for (final r in fuzzyDesc.search(query)) {
      final idx = descs.indexOf(r.item);
      if (idx >= 0) scores[idx] += r.score * 1.0;
    }

    // Exact tag match bonus
    final ql = query.toLowerCase();
    for (var i = 0; i < products.length; i++) {
      final tags = (products[i]['tags'] as List?)?.cast<String>() ?? [];
      if (tags.any((t) => t.toLowerCase().contains(ql))) scores[i] += 2.0;
    }

    final results = <SearchResult>[];
    for (var i = 0; i < products.length; i++) {
      if (scores[i] > 0) results.add(SearchResult(products[i], scores[i]));
    }
    results.sort((a, b) => b.score.compareTo(a.score));
    return results;
  }

  // ── Search History ───────────────────────────────────────────────────────────

  Future<List<String>> getHistory() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_historyKey) ?? [];
  }

  Future<void> addToHistory(String query) async {
    final q = query.trim();
    if (q.length < 2) return;
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList(_historyKey) ?? [];
    history.remove(q);
    history.insert(0, q);
    await prefs.setStringList(_historyKey, history.take(_maxHistory).toList());
  }

  Future<void> removeFromHistory(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList(_historyKey) ?? [];
    history.remove(query);
    await prefs.setStringList(_historyKey, history);
  }

  Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
  }
}
