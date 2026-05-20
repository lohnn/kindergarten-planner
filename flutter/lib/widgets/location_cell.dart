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
        label = 'Unknown';
        borderColor = ext.border;
    }

    return GestureDetector(
      onTap: () => _toggleLocation(ref),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
          decoration: BoxDecoration(
            color: isToday ? ext.todayColBg : ext.bg,
            border: isUnknown
                ? Border.all(
                    color: ext.border,
                    width: 2,
                    strokeAlign: BorderSide.strokeAlignInside,
                  )
                : Border(
                    left: BorderSide(color: borderColor, width: 4),
                  ),
            borderRadius: isUnknown ? BorderRadius.circular(4) : null,
          ),
          child: Opacity(
            opacity: isUnknown ? 0.7 : 1.0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(icon, style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: TextStyle(fontSize: 10, color: ext.textMuted),
                ),
              ],
            ),
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
