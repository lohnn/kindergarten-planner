class Day {
  final String date; // YYYY-MM-DD
  final int dayOfWeek; // 1=Mon ... 5=Fri
  final Map<int, String> locations; // userId -> home|office|unknown
  final Assignment? dropoff;
  final Assignment? pickup;

  const Day({
    required this.date,
    required this.dayOfWeek,
    required this.locations,
    this.dropoff,
    this.pickup,
  });

  factory Day.fromJson(Map<String, dynamic> json) {
    final locations = <int, String>{};
    if (json['locations'] is List) {
      for (final loc in json['locations'] as List) {
        locations[loc['user_id'] as int] = loc['work_location'] as String? ?? 'unknown';
      }
    }

    return Day(
      date: json['date'] as String,
      dayOfWeek: json['day_of_week'] as int? ?? _dayOfWeekFromDate(json['date'] as String),
      locations: locations,
      dropoff: json['dropoff'] != null
          ? Assignment.fromJson(json['dropoff'] as Map<String, dynamic>)
          : null,
      pickup: json['pickup'] != null
          ? Assignment.fromJson(json['pickup'] as Map<String, dynamic>)
          : null,
    );
  }

  static int _dayOfWeekFromDate(String date) {
    return DateTime.parse(date).weekday;
  }
}

class Assignment {
  final int? userId;
  final String? time;

  const Assignment({this.userId, this.time});

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      userId: json['user_id'] as int?,
      time: json['time'] as String?,
    );
  }

  bool get isAssigned => userId != null;
}
