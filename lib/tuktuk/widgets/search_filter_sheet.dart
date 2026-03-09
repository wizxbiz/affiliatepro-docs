import 'package:flutter/material.dart';

/// Immutable filter state passed between marketplace and filter sheet.
class SearchFilters {
  final double? minPrice;
  final double? maxPrice;
  final String? province;
  final bool isOtop;
  final String sortBy; // 'newest' | 'price_asc' | 'price_desc' | 'popular'

  const SearchFilters({
    this.minPrice,
    this.maxPrice,
    this.province,
    this.isOtop = false,
    this.sortBy = 'newest',
  });

  bool get isActive =>
      minPrice != null ||
      maxPrice != null ||
      province != null ||
      isOtop ||
      sortBy != 'newest';

  int get activeCount => [
        minPrice != null,
        province != null,
        isOtop,
        sortBy != 'newest',
      ].where((b) => b).length;

  SearchFilters clear() => const SearchFilters();

  SearchFilters copyWith({
    double? minPrice,
    double? maxPrice,
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    String? province,
    bool clearProvince = false,
    bool? isOtop,
    String? sortBy,
  }) {
    return SearchFilters(
      minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      province: clearProvince ? null : (province ?? this.province),
      isOtop: isOtop ?? this.isOtop,
      sortBy: sortBy ?? this.sortBy,
    );
  }
}

/// Shows a bottom sheet with price range, province, OTOP, and sort filters.
/// Returns updated [SearchFilters] or null if cancelled.
Future<SearchFilters?> showSearchFilterSheet(
  BuildContext context,
  SearchFilters current,
) {
  return showModalBottomSheet<SearchFilters>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _SearchFilterSheet(current: current),
  );
}

// ─────────────────────────────────────────────────────────────────────────────

class _SearchFilterSheet extends StatefulWidget {
  final SearchFilters current;
  const _SearchFilterSheet({required this.current});

  @override
  State<_SearchFilterSheet> createState() => _SearchFilterSheetState();
}

class _SearchFilterSheetState extends State<_SearchFilterSheet> {
  late String _sortBy;
  late bool _isOtop;
  late String? _province;
  late RangeValues _priceRange;

  static const _maxPrice = 100000.0;
  static const _divisions = 200;

  static const _provinces = [
    'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร',
    'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
    'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง',
    'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม',
    'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส',
    'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
    'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา',
    'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
    'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน',
    'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
    'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย',
    'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
    'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
    'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
    'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์',
    'อุทัยธานี', 'อุบลราชธานี',
  ];

  @override
  void initState() {
    super.initState();
    _sortBy = widget.current.sortBy;
    _isOtop = widget.current.isOtop;
    _province = widget.current.province;
    _priceRange = RangeValues(
      widget.current.minPrice ?? 0,
      widget.current.maxPrice ?? _maxPrice,
    );
  }

  String _formatPrice(double v) {
    if (v >= 1000) return '฿${(v / 1000).toStringAsFixed(0)}k';
    return '฿${v.toInt()}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A2E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        left: 20,
        right: 20,
        top: 8,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Title row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('ตัวกรอง', style: TextStyle(
                  color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold,),),
              TextButton(
                onPressed: () => setState(() {
                  _sortBy = 'newest';
                  _isOtop = false;
                  _province = null;
                  _priceRange = const RangeValues(0, _maxPrice);
                }),
                child: const Text('ล้างทั้งหมด',
                    style: TextStyle(color: Color(0xFF00C4CC)),),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // ── Sort ──────────────────────────────────────────────────────────
          const Text('เรียงลำดับ',
              style: TextStyle(color: Colors.white70, fontSize: 13),),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _sortChip('newest', 'ใหม่ล่าสุด'),
              _sortChip('price_asc', 'ราคา ↑'),
              _sortChip('price_desc', 'ราคา ↓'),
              _sortChip('popular', 'ยอดนิยม'),
            ],
          ),
          const SizedBox(height: 16),

          // ── OTOP toggle ────────────────────────────────────────────────────
          Container(
            decoration: BoxDecoration(
              color: _isOtop
                  ? const Color(0xFF00C4CC).withAlpha(30)
                  : Colors.white10,
              borderRadius: BorderRadius.circular(12),
            ),
            child: SwitchListTile(
              value: _isOtop,
              onChanged: (v) => setState(() => _isOtop = v),
              title: const Text('OTOP / ตลาดชุมชน',
                  style: TextStyle(color: Colors.white),),
              subtitle: const Text('แสดงเฉพาะสินค้าชุมชน',
                  style: TextStyle(color: Colors.white54, fontSize: 12),),
              secondary: const Text('🌾', style: TextStyle(fontSize: 22)),
              activeColor: const Color(0xFF00C4CC),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            ),
          ),
          const SizedBox(height: 16),

          // ── Province ───────────────────────────────────────────────────────
          const Text('จังหวัด',
              style: TextStyle(color: Colors.white70, fontSize: 13),),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white24),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String?>(
                value: _province,
                isExpanded: true,
                dropdownColor: const Color(0xFF1A1A2E),
                style: const TextStyle(color: Colors.white),
                hint: const Text('ทุกจังหวัด',
                    style: TextStyle(color: Colors.white54),),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('ทุกจังหวัด',
                        style: TextStyle(color: Colors.white70),),
                  ),
                  ..._provinces.map((p) => DropdownMenuItem<String?>(
                        value: p,
                        child: Text(p,
                            style: const TextStyle(color: Colors.white),),
                      ),),
                ],
                onChanged: (v) => setState(() => _province = v),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ── Price range ────────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('ช่วงราคา',
                  style: TextStyle(color: Colors.white70, fontSize: 13),),
              Text(
                '${_formatPrice(_priceRange.start)} – ${_formatPrice(_priceRange.end)}',
                style: const TextStyle(
                    color: Color(0xFF00C4CC), fontWeight: FontWeight.bold,),
              ),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFF00C4CC),
              thumbColor: const Color(0xFF00C4CC),
              inactiveTrackColor: Colors.white24,
              overlayColor: const Color(0xFF00C4CC).withAlpha(40),
            ),
            child: RangeSlider(
              values: _priceRange,
              min: 0,
              max: _maxPrice,
              divisions: _divisions,
              onChanged: (v) => setState(() => _priceRange = v),
            ),
          ),
          const SizedBox(height: 20),

          // ── Apply button ───────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                final filters = SearchFilters(
                  sortBy: _sortBy,
                  isOtop: _isOtop,
                  province: _province,
                  minPrice: _priceRange.start > 0 ? _priceRange.start : null,
                  maxPrice:
                      _priceRange.end < _maxPrice ? _priceRange.end : null,
                );
                Navigator.pop(context, filters);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C4CC),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),),
              ),
              child: const Text('แสดงผล',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _sortChip(String value, String label) {
    final selected = _sortBy == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => setState(() => _sortBy = value),
      selectedColor: const Color(0xFF00C4CC),
      backgroundColor: Colors.white10,
      labelStyle: TextStyle(
        color: selected ? Colors.white : Colors.white70,
        fontWeight: selected ? FontWeight.bold : FontWeight.normal,
      ),
      side: BorderSide(
          color: selected ? const Color(0xFF00C4CC) : Colors.white24,),
    );
  }
}
