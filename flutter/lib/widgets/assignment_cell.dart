import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/day.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';
import '../providers/week_provider.dart';

class AssignmentCell extends ConsumerWidget {
  final String date;
  final String type; // 'dropoff' or 'pickup'
  final Assignment? assignment;
  final List<User> users;
  final bool isToday;

  const AssignmentCell({
    super.key,
    required this.date,
    required this.type,
    required this.assignment,
    required this.users,
    required this.isToday,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;
    final isAssigned = assignment?.isAssigned ?? false;

    Widget content;
    if (!isAssigned) {
      content = Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: ext.conflictBg,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: ext.conflict, width: 2),
        ),
        child: const Center(
          child: Text('⚠️', style: TextStyle(fontSize: 14)),
        ),
      );
    } else {
      final user = users.where((u) => u.id == assignment!.userId).firstOrNull;
      final userIndex = users.indexWhere((u) => u.id == assignment!.userId);
      final isA = userIndex == 0;
      final pillColor = isA ? ext.colorALight : ext.colorBLight;
      final textColor = isA ? ext.colorAText : ext.colorBText;

      content = Container(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
        decoration: BoxDecoration(
          color: pillColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              user?.name ?? '?',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
            if (assignment!.time != null)
              Text(
                assignment!.time!,
                style: TextStyle(fontSize: 10, color: textColor),
              ),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: () => _showAssignPopup(context, ref),
      child: Container(
        decoration: BoxDecoration(
          color: isToday ? null : ext.bg,
          borderRadius: BorderRadius.circular(4),
        ),
        foregroundDecoration: isToday
            ? BoxDecoration(
                color: ext.todayColBg,
                borderRadius: BorderRadius.circular(4),
              )
            : null,
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Center(child: content),
      ),
    );
  }

  void _showAssignPopup(BuildContext context, WidgetRef ref) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;
    final primaryUsers = users.where((u) => u.isPrimary).toList();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          type == 'dropoff' ? 'Assign Drop-off' : 'Assign Pick-up',
          style: const TextStyle(fontSize: 16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: primaryUsers.map((user) {
            final isA = primaryUsers.indexOf(user) == 0;
            final color = isA ? ext.colorA : ext.colorB;
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: color.withValues(alpha: 0.2),
                child: Text(user.name[0], style: TextStyle(color: color)),
              ),
              title: Text(user.name),
              onTap: () {
                Navigator.of(ctx).pop();
                _assign(ref, user.id);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _assign(WidgetRef ref, int userId) {
    final api = ref.read(apiServiceProvider);
    final defaultTime = type == 'dropoff' ? '08:00' : '15:00';
    if (type == 'dropoff') {
      api
          .updateAssignment(
            date: date,
            dropoffUserId: userId,
            dropoffTime: defaultTime,
          )
          .then((_) => ref.invalidate(weekProvider));
    } else {
      api
          .updateAssignment(
            date: date,
            pickupUserId: userId,
            pickupTime: defaultTime,
          )
          .then((_) => ref.invalidate(weekProvider));
    }
  }
}
