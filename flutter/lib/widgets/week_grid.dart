import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/week.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';
import 'day_header.dart';
import 'location_cell.dart';
import 'assignment_cell.dart';

class WeekGrid extends StatelessWidget {
  final Week week;

  const WeekGrid({super.key, required this.week});

  static const _dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final primaryUsers = week.users.where((u) => u.isPrimary).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              // Header row
              _buildHeaderRow(context, today),
              const Divider(height: 16),
              // Location rows for each primary user
              ...primaryUsers.map((user) =>
                  _buildLocationRow(context, user, primaryUsers, today)),
              const Divider(height: 16),
              // Assignment rows
              _buildAssignmentRow(context, 'Drop-off', 'dropoff', today),
              const SizedBox(height: 4),
              _buildAssignmentRow(context, 'Pick-up', 'pickup', today),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderRow(BuildContext context, String today) {
    return Row(
      children: [
        const SizedBox(width: 64), // label column
        ...week.days.map((day) {
          final isToday = day.date == today;
          final idx = week.days.indexOf(day);
          final dateLabel = day.date.substring(8); // DD
          return Expanded(
            child: DayHeader(
              label: _dayLabels[idx < 5 ? idx : 0],
              date: dateLabel,
              isToday: isToday,
              day: day,
              users: week.users,
            ),
          );
        }),
      ],
    );
  }

  Widget _buildLocationRow(
    BuildContext context,
    User user,
    List<User> primaryUsers,
    String today,
  ) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;
    final isA = primaryUsers.indexOf(user) == 0;
    final color = isA ? ext.colorA : ext.colorB;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            child: Text(
              user.name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
          ...week.days.map((day) {
            final location = day.locations[user.id] ?? 'unknown';
            return Expanded(
              child: LocationCell(
                date: day.date,
                userId: user.id,
                location: location,
                isToday: day.date == today,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildAssignmentRow(
    BuildContext context,
    String label,
    String type,
    String today,
  ) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 64,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                label,
                style: TextStyle(fontSize: 11, color: ext.textMuted),
              ),
            ),
          ),
          ...week.days.map((day) {
            final assignment = type == 'dropoff' ? day.dropoff : day.pickup;
            return Expanded(
              child: AssignmentCell(
                date: day.date,
                type: type,
                assignment: assignment,
                users: week.users,
                isToday: day.date == today,
              ),
            );
          }),
        ],
      ),
    );
  }
}
