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
    Color? cellBg;
    BoxBorder? cellBorder;

    if (!isAssigned) {
      // Unassigned: dashed-style border + muted text
      cellBg = null;
      cellBorder = Border.all(color: ext.border, width: 1);
      content = Opacity(
        opacity: 0.7,
        child: Text(
          'Unset',
          style: TextStyle(fontSize: 10, color: ext.textMuted),
        ),
      );
    } else {
      final user = users.where((u) => u.id == assignment!.userId).firstOrNull;
      final primaryUsers = users.where((u) => u.isPrimary).toList();
      final primaryIndex = primaryUsers.indexWhere((u) => u.id == assignment!.userId);
      final bool isA = primaryIndex == 0;
      final bool isB = primaryIndex == 1;

      Color pillColor;
      Color pillTextColor;
      Color lightBg;

      if (isA) {
        pillColor = ext.colorA;
        pillTextColor = Colors.white;
        lightBg = ext.colorALight;
      } else if (isB) {
        pillColor = ext.colorB;
        pillTextColor = Colors.white;
        lightBg = ext.colorBLight;
      } else {
        pillColor = ext.colorOcc;
        pillTextColor = Colors.white;
        lightBg = ext.colorALight; // fallback
      }

      cellBg = lightBg;
      cellBorder = Border.all(color: ext.border, width: 1);

      // Get initials (first 2 chars)
      final initials = (user?.name ?? '??').substring(0, 2).toUpperCase();

      content = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Pill only around initials
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: pillColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              initials,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: pillTextColor,
              ),
            ),
          ),
          if (assignment!.time != null) ...[
            const SizedBox(height: 2),
            Text(
              assignment!.time!,
              style: TextStyle(fontSize: 10, color: ext.textMuted),
            ),
          ],
        ],
      );
    }

    return GestureDetector(
      onTap: () => _showAssignPopup(context, ref),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Container(
          constraints: const BoxConstraints(minHeight: 48),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isToday ? ext.todayColBg : cellBg,
            border: cellBorder,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Center(child: content),
        ),
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
