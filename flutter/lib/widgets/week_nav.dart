import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/week_provider.dart';
import '../theme/app_theme.dart';

class WeekNav extends ConsumerWidget {
  const WeekNav({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (year, week) = ref.watch(currentWeekIndexProvider);
    final ext = Theme.of(context).extension<AppColorsExtension>()!;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => _navigate(ref, year, week, -1),
          ),
          Text(
            'Week $week, $year',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: ext.textMuted,
                ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () => _navigate(ref, year, week, 1),
          ),
        ],
      ),
    );
  }

  void _navigate(WidgetRef ref, int year, int week, int delta) {
    int newWeek = week + delta;
    int newYear = year;
    if (newWeek < 1) {
      newYear--;
      newWeek = 52;
    } else if (newWeek > 52) {
      newYear++;
      newWeek = 1;
    }
    ref.read(currentWeekIndexProvider.notifier).state = (newYear, newWeek);
  }
}
