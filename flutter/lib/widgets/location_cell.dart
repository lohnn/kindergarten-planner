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
    Color backgroundColor;
    Color borderColor;
    final bool isUnknown = location == 'unknown' || location.isEmpty;

    switch (location) {
      case 'home':
        icon = '🏠';
        label = 'WFH';
        backgroundColor = ext.locHomeBg;
        borderColor = ext.locHome;
        break;
      case 'office':
        icon = '🏢';
        label = 'Office';
        backgroundColor = ext.locOfficeBg;
        borderColor = ext.locOffice;
        break;
      default:
        icon = '—';
        label = 'Unknown';
        backgroundColor = ext.locUnknownBg;
        borderColor = ext.locUnknown;
    }

    return GestureDetector(
      onTapUp: (details) => _showLocationPopup(context, ref, details.globalPosition),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
          decoration: BoxDecoration(
            color: isToday ? ext.todayColBg : backgroundColor,
            border: isUnknown
                ? Border.all(
                    color: borderColor,
                    width: 1.5,
                    strokeAlign: BorderSide.strokeAlignInside,
                  )
                : Border(
                    left: BorderSide(color: borderColor, width: 4),
                  ),
            borderRadius: isUnknown ? BorderRadius.circular(4) : null,
          ),
          child: Opacity(
            opacity: isUnknown ? 0.9 : 1.0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(icon, style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    color: isUnknown ? borderColor : ext.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showLocationPopup(BuildContext context, WidgetRef ref, Offset position) async {
    final result = await showMenu<String>(
      context: context,
      position: RelativeRect.fromLTRB(position.dx, position.dy, position.dx + 1, position.dy + 1),
      items: const [
        PopupMenuItem(value: 'home', child: Text('🏠 Home')),
        PopupMenuItem(value: 'office', child: Text('🏢 Office')),
        PopupMenuItem(value: 'unknown', child: Text('— Unknown')),
      ],
    );
    if (result != null && result != location) {
      final api = ref.read(apiServiceProvider);
      api.updateLocation(date, userId, result).then((_) {
        ref.invalidate(weekProvider);
      });
    }
  }
}
