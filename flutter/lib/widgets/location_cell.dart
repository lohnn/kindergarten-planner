import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../providers/week_provider.dart';

class LocationCell extends ConsumerWidget {
  final String date;
  final int userId;
  final String location; // home, office, unknown
  final bool isToday;

  const LocationCell({
    super.key,
    required this.date,
    required this.userId,
    required this.location,
    required this.isToday,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;

    String icon;
    String label;
    Color borderColor;
    final bool isUnknown = location == 'unknown' || location.isEmpty;

    switch (location) {
      case 'home':
        icon = '🏠';
        label = 'WFH';
        borderColor = ext.locHome;
        break;
      case 'office':
        icon = '🏢';
        label = 'Office';
        borderColor = ext.locOffice;
        break;
      default:
        icon = '?';
        label = '';
        borderColor = ext.border;
    }

    // Background: subtle bg for non-today, today overlay on top
    final cellBg = isToday ? null : ext.bg;

    return GestureDetector(
      onTap: () => _toggleLocation(ref),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: cellBg,
          border: Border(
            left: BorderSide(
              color: borderColor,
              width: 4,
              style: isUnknown ? BorderStyle.solid : BorderStyle.solid,
            ),
          ),
        ),
        foregroundDecoration: isToday
            ? BoxDecoration(color: ext.todayColBg)
            : null,
        child: Opacity(
          opacity: isUnknown ? 0.7 : 1.0,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(icon, style: const TextStyle(fontSize: 16)),
              if (label.isNotEmpty)
                Text(
                  label,
                  style: TextStyle(fontSize: 10, color: ext.textMuted),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _toggleLocation(WidgetRef ref) {
    final next = switch (location) {
      'unknown' => 'home',
      'home' => 'office',
      'office' => 'unknown',
      _ => 'home',
    };
    final api = ref.read(apiServiceProvider);
    api.updateLocation(date, userId, next).then((_) {
      ref.invalidate(weekProvider);
    });
  }
}
