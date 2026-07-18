import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PrivacyNoticeScreen extends StatelessWidget {
  const PrivacyNoticeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text('นโยบายความเป็นส่วนตัว', style: GoogleFonts.kanit()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'เงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ... (เนื้อหานโยบายฉบับเต็ม)',
              style: GoogleFonts.kanit(color: Colors.white70, height: 1.6),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('ยอมรับและดำเนินการต่อ',
                    style: GoogleFonts.kanit(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
