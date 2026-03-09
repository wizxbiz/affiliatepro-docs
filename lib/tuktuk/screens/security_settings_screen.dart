import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SecuritySettingsScreen extends StatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  bool _biometricEnabled = false;
  bool _hidePhone = true;
  bool _hideEmail = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('ความปลอดภัยและความเป็นส่วนตัว',
            style:
                GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSectionHeader('การปกป้องบัญชี'),
          _buildSecurityGroup([
            _buildSecurityTile(
              Icons.lock_person_outlined,
              'เปลี่ยนรหัส PIN',
              'รหัสผ่านสำหรับการใช้งานบนเว็บและแดชบอร์ด',
              onTap: () {
                // TODO: Implement PIN change logic
                _showFeatureComingSoon(context, 'จัดการ PIN');
              },
            ),
            _buildSecurityTile(
              Icons.fingerprint_rounded,
              'เข้าใช้งานด้วยชีวมาตร',
              'ใช้ Face ID หรือนิ้วมือเพื่อเปิดแอป',
              trailing: Switch(
                value: _biometricEnabled,
                activeColor: Colors.orangeAccent,
                onChanged: (val) => setState(() => _biometricEnabled = val),
              ),
            ),
          ]),
          const SizedBox(height: 32),
          _buildSectionHeader('ความเป็นส่วนตัว'),
          _buildSecurityGroup([
            _buildSecurityTile(
              Icons.visibility_off_outlined,
              'ซ่อนเบอร์โทรศัพท์',
              'ไม่แสดงเบอร์โทรในโปรไฟล์สาธารณะ',
              trailing: Switch(
                value: _hidePhone,
                activeColor: Colors.orangeAccent,
                onChanged: (val) => setState(() => _hidePhone = val),
              ),
            ),
            _buildSecurityTile(
              Icons.mail_lock_outlined,
              'ซ่อนอีเมล',
              'ไม่แสดงอีเมลในโปรไฟล์สาธารณะ',
              trailing: Switch(
                value: _hideEmail,
                activeColor: Colors.orangeAccent,
                onChanged: (val) => setState(() => _hideEmail = val),
              ),
            ),
          ]),
          const SizedBox(height: 32),
          _buildSectionHeader('กิจกรรมการใช้งาน'),
          _buildSecurityGroup([
            _buildSecurityTile(
              Icons.devices_rounded,
              'อุปกรณ์ที่กำลังใช้งาน',
              'ตรวจสอบและจัดการอุปกรณ์ที่เข้าสู่ระบบปัจจุบัน',
              onTap: () => _showActiveSessions(context),
            ),
          ]),
          const SizedBox(height: 48),
          _buildSecurityGroup([
            _buildSecurityTile(
              Icons.no_accounts_outlined,
              'ขอลบบัญชีถาวร',
              'ลบข้อมูลส่วนตัวและหยุดใช้งานบัญชีนี้',
              color: Colors.redAccent.withValues(alpha: 0.8),
              onTap: () => _showDeleteAccountConfirm(context),
            ),
          ]),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(title,
          style: GoogleFonts.outfit(
              color: Colors.orangeAccent,
              fontSize: 13,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,),),
    );
  }

  Widget _buildSecurityGroup(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: children
            .asMap()
            .map((index, child) {
              return MapEntry(
                index,
                Column(
                  children: [
                    child,
                    if (index != children.length - 1)
                      const Divider(
                          height: 1,
                          thickness: 1,
                          color: Colors.white10,
                          indent: 60,),
                  ],
                ),
              );
            })
            .values
            .toList(),
      ),
    );
  }

  Widget _buildSecurityTile(IconData icon, String title, String sub,
      {Widget? trailing, VoidCallback? onTap, Color? color,}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: const BoxDecoration(
          color: Color(0xFF0F172A),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color ?? Colors.white70, size: 22),
      ),
      title: Text(title,
          style: TextStyle(
              color: color ?? Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 15,),),
      subtitle: Text(sub,
          style: const TextStyle(color: Colors.white38, fontSize: 11),),
      trailing: trailing ??
          const Icon(Icons.chevron_right_rounded, color: Colors.white10),
    );
  }

  void _showActiveSessions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('อุปกรณ์ที่กำลังใช้งาน',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,),),
            const SizedBox(height: 20),
            _buildSessionItem(
                'iPhone 15 Pro (คุณ)', 'กรุงเทพฯ, ไทย • กำลังใช้งาน', true,),
            const SizedBox(height: 12),
            _buildSessionItem(
                'Chrome บน Windows', 'สมุทรปราการ, ไทย • 2 ชม. ที่แล้ว', false,),
            const SizedBox(height: 20),
            Center(
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('ออกจากระบบอุปกรณ์อื่นทั้งหมด',
                    style: TextStyle(color: Colors.redAccent),),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionItem(String device, String details, bool isCurrent) {
    return Row(
      children: [
        Icon(
            device.contains('Windows')
                ? Icons.laptop_windows
                : Icons.phone_iphone,
            color: Colors.white38,),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(device,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w500,),),
              Text(details,
                  style: const TextStyle(color: Colors.white38, fontSize: 12),),
            ],
          ),
        ),
        if (isCurrent)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),),
            child: const Text('ปัจจุบัน',
                style: TextStyle(color: Colors.greenAccent, fontSize: 10),),
          ),
      ],
    );
  }

  void _showDeleteAccountConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('ยืนยันการลบบัญชี?',
            style: TextStyle(color: Colors.white),),
        content: const Text(
            'การลบบัญชีจะทำให้ข้อมูลโพสต์ สินค้า และประวัติการทำรายการทั้งหมดของคุณถูกลบอย่างถาวร ไม่สามารถกู้คืนได้',
            style: TextStyle(color: Colors.white70, fontSize: 14),),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('ยกเลิก'),),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('ลบบัญชีถาวร',
                style: TextStyle(color: Colors.white),),
          ),
        ],
      ),
    );
  }

  void _showFeatureComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('⚡ ระบบ $feature จะเปิดใช้งานเร็วๆ นี้')),
    );
  }
}
