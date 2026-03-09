class TukTukAudio {
  final String id;
  final String originalVideoId;
  final String name;
  final String authorId;
  final String authorName;
  final String coverUrl;
  final String audioUrl; // Typically same as video URL if not separated
  final int durationSeconds;
  final int useCount;

  TukTukAudio({
    required this.id,
    required this.originalVideoId,
    required this.name,
    required this.authorId,
    required this.authorName,
    required this.coverUrl,
    required this.audioUrl,
    this.durationSeconds = 0,
    this.useCount = 0,
  });

  factory TukTukAudio.fromJson(Map<String, dynamic> json, String id) {
    return TukTukAudio(
      id: id,
      originalVideoId: json['originalVideoId'] ?? '',
      name: json['name'] ?? 'Original Sound',
      authorId: json['authorId'] ?? '',
      authorName: json['authorName'] ?? 'Unknown',
      coverUrl: json['coverUrl'] ?? '',
      audioUrl: json['audioUrl'] ?? '',
      durationSeconds: json['durationSeconds'] ?? 0,
      useCount: json['useCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'originalVideoId': originalVideoId,
      'name': name,
      'authorId': authorId,
      'authorName': authorName,
      'coverUrl': coverUrl,
      'audioUrl': audioUrl,
      'durationSeconds': durationSeconds,
      'useCount': useCount,
    };
  }
}
