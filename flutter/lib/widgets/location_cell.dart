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
    Color bgColor;
    switch (location) {
      case 'home':
        icon = '🏠';
        label = 'WFH';
        bgColor = const Color(0x1A22C55E); // green tint
        break;
      case 'office':
        icon = '🏢';
        label = 'Office';
        bgColor = const Color(0x1A3B82F6); // blue tint
        break;
      default:
        icon = '❓';
        label = '';
        bgColor = Colors.transparent;
    }

    return GestureDetector(
      onTap: () => _toggleLocation(ref),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: isToday ? ext.todayColBg : bgColor,
          borderRadius: BorderRadius.circular(4),
        ),
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
