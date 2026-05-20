import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DayHeader extends StatelessWidget {
  final String label;
  final String date;
  final bool isToday;

  const DayHeader({
    super.key,
    required this.label,
    required this.date,
    required this.isToday,
  });

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: isToday ? ext.todayHeaderBg : Colors.transparent,
        borderRadius: BorderRadius.circular(6),
        border: isToday ? Border.all(color: ext.todayRing, width: 2) : null,
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: isToday ? ext.todayRing : ext.textMuted,
            ),
          ),
          Text(
            date,
            style: TextStyle(fontSize: 11, color: ext.textMuted),
          ),
        ],
      ),
    );
  }
}
