import 'package:flutter/material.dart';

class RotatingMusicDisc extends StatelessWidget {
  final AnimationController animationController;
  final bool isSaving;
  final bool isSaved;
  final VoidCallback onTap;

  const RotatingMusicDisc({
    super.key,
    required this.animationController,
    required this.isSaving,
    required this.isSaved,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 50,
        height: 50,
        child: Stack(
          alignment: Alignment.center,
          children: [
            RotationTransition(
              turns: animationController,
              child: Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const SweepGradient(
                    colors: [Colors.black87, Colors.grey, Colors.black87],
                  ),
                  border: Border.all(color: Colors.black54, width: 6),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Container(
                  margin: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.black,
                  ),
                  child: Center(
                    child: isSaving
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.orange,),)
                        : Icon(
                            isSaved ? Icons.check : Icons.music_note,
                            color:
                                isSaved ? Colors.greenAccent : Colors.white70,
                            size: 14,
                          ),
                  ),
                ),
              ),
            ),
            if (isSaved)
              Positioned(
                bottom: -4,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(4),),
                  child: const Text("Saved",
                      style: TextStyle(
                          fontSize: 8,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,),),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
