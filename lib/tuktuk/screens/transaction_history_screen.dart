import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_tokenomics.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  final TukTukBridge _bridge = TukTukBridge();
  final TukTukTokenomics _tokenomics = TukTukTokenomics();
  String? _uid;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await _bridge.getCurrentUser();
    if (mounted) {
      setState(() {
        _uid = user?['uid'];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E1E2C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E1E2C),
        elevation: 0,
        title: Text('ประวัติธุรกรรม',
            style: GoogleFonts.kanit(color: Colors.white),),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _uid == null
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF00f2ea)),)
          : StreamBuilder<List<CoinTransaction>>(
              stream: _tokenomics.getTransactionHistory(_uid!),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                      child:
                          CircularProgressIndicator(color: Color(0xFF00f2ea)),);
                }

                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long,
                            size: 80, color: Colors.white.withValues(alpha: 0.2),),
                        const SizedBox(height: 20),
                        Text(
                          'ยังไม่มีประวัติธุรกรรม',
                          style: GoogleFonts.kanit(
                            color: Colors.white54,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                final transactions = snapshot.data!;

                return ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: transactions.length,
                  itemBuilder: (context, index) {
                    final transaction = transactions[index];
                    final isEarn =
                        transaction.type != 'spend' && transaction.amount > 0;
                    final date = DateFormat('dd MMM yyyy, HH:mm', 'th')
                        .format(transaction.createdAt);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2B2B40),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isEarn
                              ? Colors.green.withValues(alpha: 0.3)
                              : Colors.red.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isEarn
                                  ? Colors.green.withValues(alpha: 0.15)
                                  : Colors.red.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isEarn
                                  ? Icons.add_circle_outline
                                  : Icons.remove_circle_outline,
                              color: isEarn ? Colors.green : Colors.red,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  transaction.description,
                                  style: GoogleFonts.kanit(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  date,
                                  style: GoogleFonts.kanit(
                                    color: Colors.white54,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${isEarn ? '+' : ''}${transaction.amount}',
                            style: GoogleFonts.outfit(
                              color: isEarn ? Colors.green : Colors.red,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
