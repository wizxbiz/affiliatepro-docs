import 'package:caculateapp/tuktuk/screens/idea_lab_screen.dart';
import 'package:caculateapp/tuktuk/screens/register_screen.dart';
import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:caculateapp/tuktuk/widgets/career_hub_view.dart';
import 'package:caculateapp/tuktuk/widgets/image_post_item.dart';
import 'package:caculateapp/tuktuk/widgets/info_card_item.dart';
import 'package:caculateapp/tuktuk/widgets/product_item_card.dart';
import 'package:caculateapp/tuktuk/widgets/video/live_player_card.dart';
import 'package:caculateapp/tuktuk/widgets/video_player_item.dart';
import 'package:caculateapp/tuktuk/widgets/win_rider_feed_card.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VerticalFeedView extends StatelessWidget {
  final int tabIndex;
  final dynamic state; // This is a _FeedTabState (ChangeNotifier)
  final bool isLoggedIn;
  final String? userId;
  final bool isAutoScrollEnabled;
  final VoidCallback onTimerEnd;
  final Function(int) onFetchMore;
  final VoidCallback onRefresh;
  final Widget Function(dynamic item, Key key)? buildWelcomeCard;
  final Widget Function(dynamic item, Key key)? buildFeaturedSellerCard;
  final Widget Function(Key key)? buildIdeaLabCard;
  final Widget Function(Key key)? buildRecommendationCard;

  const VerticalFeedView({
    super.key,
    required this.tabIndex,
    required this.state,
    required this.isLoggedIn,
    this.userId,
    required this.isAutoScrollEnabled,
    required this.onTimerEnd,
    required this.onFetchMore,
    required this.onRefresh,
    this.buildWelcomeCard,
    this.buildFeaturedSellerCard,
    this.buildIdeaLabCard,
    this.buildRecommendationCard,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) {
        if (state.isInitialLoading && state.items.isEmpty) {
          return const Center(
              child: CircularProgressIndicator(color: Colors.orange));
        }

        if (state.errorMessage != null && state.items.isEmpty) {
          return _buildFeedError(state.errorMessage!);
        }

        if (state.items.isEmpty && !state.isLoading) {
          return _buildFeedEmpty();
        }

        return Stack(
          children: [
            RefreshIndicator(
              onRefresh: () async => onRefresh(),
              color: Colors.orange,
              backgroundColor: Colors.black,
              child: PageView.builder(
                key: state.pageKey,
                controller: state.pageController,
                scrollDirection: Axis.vertical,
                physics: const PageScrollPhysics(),
                itemCount: state.items.length,
                onPageChanged: (index) {
                  state.currentPage = index;
                  if (index >= state.items.length - 3 &&
                      state.hasMore &&
                      !state.isLoading) {
                    onFetchMore(tabIndex);
                  }
                },
                itemBuilder: (context, index) {
                  final item = state.items[index];
                  final isActive = state.currentPage == index;
                  final itemKey = ValueKey('${item.type}_${item.id}');

                  if (item.type == TukTukItemType.welcome &&
                      buildWelcomeCard != null) {
                    return buildWelcomeCard!(item, itemKey);
                  } else if (item.type == TukTukItemType.video) {
                    final String videoUrl =
                        item.data['extractedVideoUrl'] ?? '';
                    return VideoPlayerItem(
                      key: itemKey,
                      videoUrl: videoUrl,
                      postData: item.data,
                      isActive: isActive,
                      isAutoScrollEnabled: isAutoScrollEnabled,
                      onTimerEnd: onTimerEnd,
                    );
                  } else if (item.type == TukTukItemType.product) {
                    return ProductItemCard(
                      key: itemKey,
                      productData: item.data,
                      isActive: isActive,
                      isAutoScrollEnabled: isAutoScrollEnabled,
                      onTimerEnd: onTimerEnd,
                    );
                  } else if (item.type == TukTukItemType.live) {
                    return LivePlayerCard(
                      key: itemKey,
                      liveData: item.data,
                      isActive: isActive,
                    );
                  } else if (item.type == TukTukItemType.infoCard) {
                    return InfoCardItem(
                      key: itemKey,
                      data: item.data,
                      isActive: isActive,
                      isAutoScrollEnabled: isAutoScrollEnabled,
                      onTimerEnd: onTimerEnd,
                    );
                  } else if (item.type == TukTukItemType.ideaLab) {
                    if (buildIdeaLabCard != null)
                      return buildIdeaLabCard!(itemKey);
                    return const IdeaLabScreen();
                  } else if (item.type == TukTukItemType.recommendation) {
                    if (buildRecommendationCard != null)
                      return buildRecommendationCard!(itemKey);
                    return const CareerHubView();
                  } else if (item.type == TukTukItemType.riderJob) {
                    return RiderJobFeedCard(
                      key: itemKey,
                      jobData: item.data,
                      currentRiderId: userId,
                    );
                  } else if (item.type == TukTukItemType.riderProfile) {
                    return WinRiderAvailableCard(
                      key: itemKey,
                      riderData: item.data,
                    );
                  } else if (item.type == TukTukItemType.winRider) {
                    return WinRiderPromoCard(
                      key: itemKey,
                      onRegisterTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const RegisterScreen(), // Needs RegisterScreen or specific rider registration screen depending on imports. Usually register is used.
                        ),
                      ),
                    );
                  } else if (item.type == TukTukItemType.image) {
                    return ImagePostItem(
                      key: itemKey,
                      postData: item.data,
                      isActive: isActive,
                      isAutoScrollEnabled: isAutoScrollEnabled,
                      onTimerEnd: onTimerEnd,
                    );
                  } else {
                    return ProductItemCard(
                      key: itemKey,
                      productData: item.data,
                      isActive: isActive,
                      isAutoScrollEnabled: isAutoScrollEnabled,
                      onTimerEnd: onTimerEnd,
                    );
                  }
                },
              ),
            ),
            if (state.isLoading && !state.isInitialLoading)
              const Positioned(
                bottom: 20,
                left: 0,
                right: 0,
                child: Center(
                    child: CircularProgressIndicator(
                        color: Colors.orange, strokeWidth: 2)),
              ),
          ],
        );
      },
    );
  }

  Widget _buildFeedEmpty() {
    final bool isNearbyTab = tabIndex == 1;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isNearbyTab ? Icons.explore_outlined : Icons.movie_filter_outlined,
            size: 60,
            color: Colors.white
                .withOpacity(0.05), // Using withOpacity instead of withValues
          ),
          const SizedBox(height: 30),
          if (isNearbyTab) ...[
            ElevatedButton(
              onPressed: onRefresh,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white.withOpacity(0.05),
                padding:
                    const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                  side: BorderSide(color: Colors.white.withOpacity(0.1)),
                ),
              ),
              child: Text(
                'เลื่อนเพื่อรีเฟรชหรือกดตรงนี้',
                style: GoogleFonts.kanit(color: Colors.white30, fontSize: 13),
              ),
            ),
          ] else
            Text(
              'กำลังเตรียมสิ่งใหม่ๆ ให้คุณ...',
              style: GoogleFonts.kanit(color: Colors.white12, fontSize: 14),
            ),
        ],
      ),
    );
  }

  Widget _buildFeedError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 70, color: Colors.orange),
            const SizedBox(height: 20),
            Text(error,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 30),
            ElevatedButton(
                onPressed: onRefresh, child: const Text('ลองใหม่อีกครั้ง')),
          ],
        ),
      ),
    );
  }
}
