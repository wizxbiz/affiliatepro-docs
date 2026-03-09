class ProfanityFilter {
  static final List<String> _badWords = [
    // General Thai Profanity
    'ไอ้เหี้ย', 'ไอ้สัส', 'ไอ้สัตว์', 'ควย', 'หี', 'แตด', 'เย็ด', 'มึง', 'กู',
    'ส้นตีน', 'ตีน',
    'หัวควย', 'กระหรี่', 'ร่าน', 'บ้า', 'โง่', 'ควาย', 'เหี้ย', 'สัส', 'จัญไร',
    'ระยำ',
    'ชั่ว', 'เลว', 'กาก', 'ขยะ', 'ดอกทอง', 'กะหรี่', 'สันดาน', 'อีควาย',
    'อีตัว',
    // Lèse-majesté / Sensitive
    '112', 'สถาบัน', 'กษัตริย์', 'ในหลวง', 'ราชวงศ์', 'เบื้องสูง', 'มาตรา 112',
    'ปฏิรูปสถาบัน',
    'ล้มล้าง', 'หมิ่น', 'หมิ่นพระบรม', 'ล้มเจ้า', 'ปฏิวัติ',
    // Gambling / Drugs / Illegal
    'การพนัน', 'เว็บพนัน', 'สล็อต', 'บาคาร่า', 'แทงบอล', 'หวยออนไลน์', 'UFA',
    'คาสิโนออนไลน์',
    'ยาบ้า', 'ยาไอซ์', 'กัญชา', 'เฮโรอีน', 'โคเคน', 'ยาเค', 'ยาเสพติด',
    'ขายบริการ', 'ไซด์ไลน์',
    'โสเภณี', 'ค้าประเวณี', 'อาวุธปืน', 'ปืนเถื่อน', 'ระเบิด', 'ฆ่า', 'ข่มขืน',
    'รุมโทรม',
    // English defaults
    'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'damn', 'hell', 'pussy', 'dick',
    'bastard',
    'motherfucker', 'fucker', 'slut', 'whore', 'nigger', 'faggot', 'porn',
    'sex', 'anal', 'oral',
    'hee', 'hum',
  ];

  static bool hasProfanity(String text) {
    if (text.isEmpty) return false;
    final lowerText = text.toLowerCase();
    for (final word in _badWords) {
      if (lowerText.contains(word)) {
        return true;
      }
    }
    return false;
  }

  static String censor(String text) {
    String censored = text;
    for (final word in _badWords) {
      if (censored.toLowerCase().contains(word)) {
        censored = censored.replaceAll(
            RegExp(word, caseSensitive: false), '*' * word.length,);
      }
    }
    return censored;
  }
}
