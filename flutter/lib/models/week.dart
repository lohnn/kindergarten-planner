import 'day.dart';
import 'user.dart';

class Week {
  final int year;
  final int weekNumber;
  final List<Day> days;
  final List<User> users;

  const Week({
    required this.year,
    required this.weekNumber,
    required this.days,
    required this.users,
  });

  factory Week.fromJson(Map<String, dynamic> json, int year, int weekNumber) {
    final days = (json['days'] as List?)
            ?.map((d) => Day.fromJson(d as Map<String, dynamic>))
            .toList() ??
        [];
    final users = (json['users'] as List?)
            ?.map((u) => User.fromJson(u as Map<String, dynamic>))
            .toList() ??
        [];
    return Week(year: year, weekNumber: weekNumber, days: days, users: users);
  }

  Week copyWith({
    int? year,
    int? weekNumber,
    List<Day>? days,
    List<User>? users,
  }) {
    return Week(
      year: year ?? this.year,
      weekNumber: weekNumber ?? this.weekNumber,
      days: days ?? this.days,
      users: users ?? this.users,
    );
  }

  /// Returns a new Week with the day matching [date] replaced by [updated].
  /// If no day matches [date] (the event is for a different week), returns this.
  Week withUpdatedDay(String date, Day Function(Day current) update) {
    final idx = days.indexWhere((d) => d.date == date);
    if (idx < 0) return this;
    final newDays = List<Day>.from(days);
    newDays[idx] = update(newDays[idx]);
    return copyWith(days: newDays);
  }
}
