import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/week.dart';
import '../models/day.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

/// Holds the current (year, weekNumber) being viewed.
///
/// Migrated from `StateProvider` to a `Notifier` for Riverpod 3.x (StateProvider
/// is now legacy). Callers mutate via `ref.read(currentWeekIndexProvider.notifier)`.
final currentWeekIndexProvider =
    NotifierProvider<CurrentWeekIndexNotifier, (int, int)>(
        CurrentWeekIndexNotifier.new);

class CurrentWeekIndexNotifier extends Notifier<(int, int)> {
  @override
  (int, int) build() {
    final now = DateTime.now();
    // ISO week number calculation
    final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays + 1;
    final weekDay = now.weekday;
    final weekNumber = ((dayOfYear - weekDay + 10) / 7).floor();
    return (now.year, weekNumber);
  }

  void set((int, int) value) => state = value;

  void update((int, int) Function((int, int) current) updater) =>
      state = updater(state);
}

/// Fetches and holds the current week.
///
/// Exposed as an [AsyncNotifier] (instead of a plain [FutureProvider]) so the
/// realtime layer can surgically merge incoming SSE events into a single day's
/// assignment/location in place, without refetching the whole week or
/// replacing the record (which would disrupt in-flight edits / open popups).
///
/// The public surface stays identical to the old `FutureProvider<Week>`:
/// `ref.watch(weekProvider)` yields `AsyncValue<Week>` and `ref.invalidate`
/// still triggers a full refetch.
final weekProvider = AsyncNotifierProvider<WeekNotifier, Week>(WeekNotifier.new);

class WeekNotifier extends AsyncNotifier<Week> {
  @override
  Future<Week> build() async {
    final (year, week) = ref.watch(currentWeekIndexProvider);
    final api = ref.read(apiServiceProvider);
    final json = await api.getWeek(year, week);
    return Week.fromJson(json, year, week);
  }

  /// Re-fetch the current week from the server (used on tab-visible catch-up).
  /// Unlike `ref.invalidate`, this keeps the previous data visible during the
  /// fetch and never throws to the caller.
  Future<void> refetch() async {
    final (year, week) = ref.read(currentWeekIndexProvider);
    final api = ref.read(apiServiceProvider);
    try {
      final json = await api.getWeek(year, week);
      state = AsyncData(Week.fromJson(json, year, week));
    } catch (_) {
      // Keep existing state on transient failures; SSE/next refetch will heal.
    }
  }

  /// Merge a partial assignment row (from an SSE `assignment` event) into the
  /// day it belongs to. Only the fields present (non-undefined) are applied;
  /// the rest of the day/record is preserved.
  void mergeAssignment(Map<String, dynamic> data) {
    final week = state.value;
    if (week == null) return;
    final date = data['date'] as String?;
    if (date == null) return;

    // The assignment event carries the FULL assignment row for the date (same
    // shape PUT returns), so we replace dropoff/pickup/note for that day. An
    // assignment with neither user nor time is "unassigned" -> null, matching
    // Day.fromJson semantics so the cell renders identically.
    final dropoff = _assignmentOrNull(
      _asInt(data['dropoff_user_id']),
      data['dropoff_time'] as String?,
    );
    final pickup = _assignmentOrNull(
      _asInt(data['pickup_user_id']),
      data['pickup_time'] as String?,
    );
    final note = (data['note'] as String?)?.trim();

    final updated = week.withUpdatedDay(date, (current) {
      return current.copyWith(
        dropoff: dropoff,
        pickup: pickup,
        note: (note == null || note.isEmpty) ? null : note,
      );
    });
    if (!identical(updated, week)) state = AsyncData(updated);
  }

  /// Merge a partial day/location row (from an SSE `day` event) into the
  /// matching day, updating only the one user's location in place.
  void mergeDay(Map<String, dynamic> data) {
    final week = state.value;
    if (week == null) return;
    final date = data['date'] as String?;
    final userId = _asInt(data['user_id']);
    final location = data['work_location'] as String?;
    if (date == null || userId == null || location == null) return;

    final updated = week.withUpdatedDay(date, (current) {
      final newLocations = Map<int, String>.from(current.locations);
      newLocations[userId] = location;
      return current.copyWith(locations: newLocations);
    });
    if (!identical(updated, week)) state = AsyncData(updated);
  }

  static Assignment? _assignmentOrNull(int? userId, String? time) {
    if (userId == null && time == null) return null;
    return Assignment(userId: userId, time: time);
  }

  static int? _asInt(Object? v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v);
    return null;
  }
}

/// Fetches and holds settings.
///
/// Also an [AsyncNotifier] so the realtime layer can merge `settings` SSE
/// events field-by-field into the existing map.
final settingsProvider =
    AsyncNotifierProvider<SettingsNotifier, Map<String, dynamic>>(
        SettingsNotifier.new);

class SettingsNotifier extends AsyncNotifier<Map<String, dynamic>> {
  @override
  Future<Map<String, dynamic>> build() async {
    final api = ref.read(apiServiceProvider);
    return api.getSettings();
  }

  /// Merge a partial settings map (from an SSE `settings` event) field-by-field
  /// into the current settings, preserving keys not present in the event.
  void mergeSettings(Map<String, dynamic> data) {
    final current = state.value ?? <String, dynamic>{};
    final merged = Map<String, dynamic>.from(current);
    for (final entry in data.entries) {
      if (entry.key == 'type') continue; // discriminator, not a setting
      merged[entry.key] = entry.value;
    }
    state = AsyncData(merged);
  }
}
