import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// ============================================================
/// DiskCacheService — SQLite-backed persistent cache
/// ============================================================
/// Complements TukTukBridge._memoryCache (session-only, 5 min TTL)
/// with cross-session disk persistence.
///
/// TTL: entries older than [expiresAt] are treated as a miss.
/// Cleanup: call [purgeExpired()] once at startup (auto-called by init).
/// ============================================================
class DiskCacheService {
  DiskCacheService._();
  static final DiskCacheService _instance = DiskCacheService._();
  factory DiskCacheService() => _instance;

  static const String _dbName = 'tuktuk_disk_cache.db';
  static const String _table = 'cache_entries';
  static const int _version = 1;

  Database? _db;

  // ── Internal DB access ──────────────────────────────────────────────────────

  Future<Database> get _database async {
    if (_db != null && _db!.isOpen) return _db!;
    final dbPath = join(await getDatabasesPath(), _dbName);
    _db = await openDatabase(
      dbPath,
      version: _version,
      onCreate: _onCreate,
    );
    // Purge expired rows on first open each session
    await purgeExpired();
    return _db!;
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_table (
        key         TEXT    PRIMARY KEY,
        data        TEXT    NOT NULL,
        expires_at  INTEGER NOT NULL,
        created_at  INTEGER NOT NULL
      )
    ''');
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /// Retrieve cached data for [key], or `null` if missing / expired.
  Future<dynamic> get(String key) async {
    try {
      final db = await _database;
      final rows = await db.query(
        _table,
        columns: ['data', 'expires_at'],
        where: 'key = ?',
        whereArgs: [key],
        limit: 1,
      );
      if (rows.isEmpty) return null;

      final expiresAt = rows.first['expires_at'] as int;
      if (expiresAt < DateTime.now().millisecondsSinceEpoch) {
        // Expired — delete lazily
        unawaited(db.delete(_table, where: 'key = ?', whereArgs: [key]));
        return null;
      }

      final raw = rows.first['data'] as String;
      final decoded = jsonDecode(raw);
      // Unwrap the __list wrapper added by set() so callers always get the original type back
      if (decoded is Map && decoded['__list'] == true && decoded['items'] is List) {
        return decoded['items'];
      }
      return decoded;
    } catch (e) {
      debugPrint('[DiskCache] get($key) error: $e');
      return null;
    }
  }

  /// Convenience: get as `List<Map<String,dynamic>>`.
  Future<List<Map<String, dynamic>>?> getList(String key) async {
    final data = await get(key);
    if (data == null) return null;
    if (data is List) {
      return data.cast<Map<String, dynamic>>();
    }
    // Wrapped in {'items': [...]} format
    final items = (data as Map<String, dynamic>)['items'];
    if (items is List) return items.cast<Map<String, dynamic>>();
    return null;
  }

  /// Cache [data] under [key] with a [ttlSeconds] time-to-live.
  /// Default TTL: 15 minutes (900 s).
  /// [data] may be any JSON-serialisable value (Map, List, String, num, bool).
  Future<void> set(String key, dynamic data, {int ttlSeconds = 900}) async {
    try {
      final db = await _database;
      final now = DateTime.now().millisecondsSinceEpoch;
      final expiresAt = now + ttlSeconds * 1000;

      // Wrap lists to preserve type on decode
      final encoded = (data is List)
          ? jsonEncode({'__list': true, 'items': data})
          : jsonEncode(data);

      await db.insert(
        _table,
        {
          'key': key,
          'data': encoded,
          'expires_at': expiresAt,
          'created_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      debugPrint('[DiskCache] set($key) error: $e');
    }
  }

  /// Remove a single cache entry.
  Future<void> invalidate(String key) async {
    try {
      final db = await _database;
      await db.delete(_table, where: 'key = ?', whereArgs: [key]);
    } catch (e) {
      debugPrint('[DiskCache] invalidate($key) error: $e');
    }
  }

  /// Remove all entries whose TTL has expired.
  Future<void> purgeExpired() async {
    try {
      final db = await _database;
      final deleted = await db.delete(
        _table,
        where: 'expires_at < ?',
        whereArgs: [DateTime.now().millisecondsSinceEpoch],
      );
      if (deleted > 0) {
        debugPrint('[DiskCache] Purged $deleted expired entries');
      }
    } catch (e) {
      debugPrint('[DiskCache] purgeExpired error: $e');
    }
  }

  /// Wipe the entire cache (use carefully).
  Future<void> clear() async {
    try {
      final db = await _database;
      await db.delete(_table);
      debugPrint('[DiskCache] Cache cleared');
    } catch (e) {
      debugPrint('[DiskCache] clear error: $e');
    }
  }

  /// Return row count (for diagnostics).
  Future<int> get entryCount async {
    try {
      final db = await _database;
      final result =
          await db.rawQuery('SELECT COUNT(*) as cnt FROM $_table');
      return (result.first['cnt'] as int?) ?? 0;
    } catch (_) {
      return 0;
    }
  }
}

// ignore: non_constant_identifier_names
void unawaited(Future<void> f) {}
