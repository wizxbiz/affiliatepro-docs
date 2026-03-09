import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class PollWidget extends StatefulWidget {
  final String postId;
  final String collection;
  final Map<String, dynamic> pollData;

  const PollWidget({
    super.key,
    required this.postId,
    this.collection = 'community_posts',
    required this.pollData,
  });

  @override
  State<PollWidget> createState() => _PollWidgetState();
}

class _PollWidgetState extends State<PollWidget> {
  bool _hasVoted = false;
  final String? _currentUid = FirebaseAuth.instance.currentUser?.uid;

  @override
  void initState() {
    super.initState();
    final voters = List<String>.from(widget.pollData['voters'] ?? []);
    if (_currentUid != null && voters.contains(_currentUid)) {
      _hasVoted = true;
    }
  }

  Future<void> _handleVote(int index) async {
    if (_hasVoted || _currentUid == null) return;

    setState(() {
      _hasVoted = true;
    });

    try {
      final docRef = FirebaseFirestore.instance
          .collection(widget.collection)
          .doc(widget.postId);

      await FirebaseFirestore.instance.runTransaction((transaction) async {
        final snapshot = await transaction.get(docRef);
        if (!snapshot.exists) return;

        final Map<String, dynamic> poll =
            Map<String, dynamic>.from(snapshot.data()?['poll'] ?? {});
        final List<dynamic> options = List<dynamic>.from(poll['options'] ?? []);
        final List<dynamic> voters = List<dynamic>.from(poll['voters'] ?? []);

        if (voters.contains(_currentUid)) return;

        if (options[index] is Map) {
          options[index]['votes'] = (options[index]['votes'] ?? 0) + 1;
        } else if (options[index] is String) {
          // Convert string option to map on-the-fly to support voting
          options[index] = {
            'text': options[index],
            'votes': 1,
          };
        }
        voters.add(_currentUid);

        transaction.update(docRef, {
          'poll.options': options,
          'poll.voters': voters,
        });
      });
    } catch (e) {
      debugPrint('Vote Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final question = widget.pollData['question'] ?? 'คุณคิดอย่างไร?';
    final List<dynamic> options = widget.pollData['options'] ?? [];
    final voters = List<String>.from(widget.pollData['voters'] ?? []);
    final totalVotes = voters.length;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.poll, color: Colors.orange, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(options.length, (index) {
            final option = options[index];
            String text = '';
            int votes = 0;

            if (option is Map) {
              text = option['text']?.toString() ?? '';
              votes = (option['votes'] ?? 0) as int;
            } else if (option is String) {
              text = option;
              // If it's just a string, we might not have individual vote counts
              // unless we handle it elsewhere, but at least this avoids the crash.
            }

            final percent = totalVotes > 0 ? (votes / totalVotes) : 0.0;

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () => _handleVote(index),
                child: Stack(
                  children: [
                    // Progress Bar
                    Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white12,
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    if (_hasVoted)
                      FractionallySizedBox(
                        widthFactor: percent,
                        child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    // Content
                    Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      alignment: Alignment.centerLeft,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(text,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 14,),),
                          if (_hasVoted)
                            Text('${(percent * 100).toInt()}%',
                                style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,),),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          if (_hasVoted)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'ทั้งหมด $totalVotes โหวต',
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
            ),
        ],
      ),
    );
  }
}
