import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../screens/profile_screen.dart';
import '../comments_sheet.dart';
import 'rotating_music_disc.dart';

class VideoSideActions extends StatelessWidget {
  final Map<String, dynamic> postData;
  final bool isLiked;
  final int likesCount;
  final String? authorPic;
  final bool isPlaying;
  final bool isAudioSaved;
  final bool isAudioSaving;
  final AnimationController discAnimationController;
  final VoidCallback onLike;
  final VoidCallback onShare;
  final VoidCallback onTogglePlay;
  final VoidCallback onToggleSaveAudio;
  final VoidCallback onShowMore;
  final Function(bool) onResumeVideo;
  final VoidCallback onPauseVideo;

  const VideoSideActions({
    super.key,
    required this.postData,
    required this.isLiked,
    required this.likesCount,
    this.authorPic,
    required this.isPlaying,
    required this.isAudioSaved,
    required this.isAudioSaving,
    required this.discAnimationController,
    required this.onLike,
    required this.onShare,
    required this.onTogglePlay,
    required this.onToggleSaveAudio,
    required this.onShowMore,
    required this.onResumeVideo,
    required this.onPauseVideo,
  });

  @override
  Widget build(BuildContext context) {
    return FadeInRight(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: Colors.white12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // More Options
            _buildActionIcon(
              icon: Icons.more_horiz,
              onTap: onShowMore,
            ),

            const SizedBox(height: 10),

            // Author Avatar
            GestureDetector(
              onTap: () {
                onPauseVideo();
                final authorId = postData['authorId'];
                if (authorId != null) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProfileScreen(
                        userId: authorId,
                        isBackButtonEnabled: true,
                      ),
                    ),
                  ).then((_) => onResumeVideo(true));
                }
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white12, width: 1.5),
                ),
                child: ClipOval(
                  child: (authorPic != null && authorPic!.startsWith('http'))
                      ? CachedNetworkImage(
                          imageUrl: authorPic!,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              Container(color: Colors.grey[900]),
                          errorWidget: (context, url, err) =>
                              const Icon(Icons.person, color: Colors.white70),
                        )
                      : Container(
                          color: Colors.grey[800],
                          child:
                              const Icon(Icons.person, color: Colors.white70),
                        ),
                ),
              ),
            ),

            const SizedBox(height: 10),

            // Like Button with real-time count
            StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance
                  .collection(postData['originCollection'] ?? 'community_posts')
                  .doc(postData['id']?.toString())
                  .snapshots(),
              builder: (context, snapshot) {
                int displayLikes = likesCount;
                if (snapshot.hasData && snapshot.data?.data() != null) {
                  final data = snapshot.data!.data() as Map<String, dynamic>;
                  displayLikes = data['likesCount'] ?? data['likes'] ?? 0;
                }

                return GestureDetector(
                  onTap: onLike,
                  child: Column(
                    children: [
                      isLiked
                          ? const Icon(
                              Icons.favorite,
                              color: Colors.redAccent,
                              size: 30,
                              shadows: [
                                Shadow(color: Colors.black54, blurRadius: 10),
                              ],
                            )
                          : Image.asset(
                              'assets/images/finger_heart.png',
                              width: 40,
                              height: 40,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.favorite_border,
                                      color: Colors.white, size: 30,),
                            ),
                      const SizedBox(height: 4),
                      Text(
                        '$displayLikes',
                        style: TextStyle(
                          color: isLiked ? Colors.redAccent : Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: 10),

            // Save/Bookmark Button
            _buildActionButton(
              icon: Icons.bookmark_border,
              label: 'บันทึก',
              onTap: onLike, // In original logic, like also saves
            ),

            const SizedBox(height: 10),

            // Comment Button
            StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance
                  .collection(postData['originCollection'] ?? 'community_posts')
                  .doc(postData['id']?.toString())
                  .snapshots(),
              builder: (context, snapshot) {
                int commentsCount = postData['commentsCount'] ?? 0;
                if (snapshot.hasData && snapshot.data?.data() != null) {
                  final data = snapshot.data!.data() as Map<String, dynamic>;
                  commentsCount =
                      data['commentsCount'] ?? data['commentCount'] ?? 0;
                }

                return _buildActionButton(
                  icon: Icons.chat_bubble_outline,
                  label: '$commentsCount',
                  onTap: () {
                    final postId = postData['id']?.toString();
                    if (postId == null) return;
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (context) => CommentsSheet(
                        postId: postId,
                        collection:
                            postData['originCollection'] ?? 'community_posts',
                      ),
                    );
                  },
                );
              },
            ),

            const SizedBox(height: 10),

            // Share Button
            _buildActionButton(
              icon: Icons.reply,
              label: 'แชร์',
              onTap: onShare,
            ),

            const SizedBox(height: 10),

            // Play/Pause Button
            _buildActionButton(
              icon: isPlaying
                  ? Icons.pause_circle_outline
                  : Icons.play_circle_outline,
              label: isPlaying ? 'หยุด' : 'เล่น',
              color: isPlaying ? Colors.white : Colors.orangeAccent,
              onTap: onTogglePlay,
            ),

            const SizedBox(height: 12),

            // Rotating Music Disc
            RotatingMusicDisc(
              animationController: discAnimationController,
              isSaving: isAudioSaving,
              isSaved: isAudioSaved,
              onTap: onToggleSaveAudio,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionIcon({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Icon(
        icon,
        color: Colors.white70,
        size: 24,
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color? color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: color ?? Colors.white,
            size: 28,
            shadows: const [
              Shadow(color: Colors.black54, blurRadius: 10),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color ?? Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
