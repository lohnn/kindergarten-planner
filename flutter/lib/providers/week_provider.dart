import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/week.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

/// Holds the current (year, weekNumber) being viewed.
final currentWeekIndexProvider = StateProvider<(int, int)>((ref) {
  final now = DateTime.now();
  // ISO week number calculation
  final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays + 1;
  final weekDay = now.weekday;
  final weekNumber = ((dayOfYear - weekDay + 10) / 7).floor();
  return (now.year, weekNumber);
});

/// Fetches the week data for the current week index.
final weekProvider = FutureProvider<Week>((ref) async {
  final (year, week) = ref.watch(currentWeekIndexProvider);
  final api = ref.read(apiServiceProvider);
  final json = await api.getWeek(year, week);
  return Week.fromJson(json, year, week);
});

/// Fetches settings from the API.
final settingsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.getSettings();
});
