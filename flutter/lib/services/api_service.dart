import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use compile-time const or default to relative path for same-origin deployment
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '/api',
  );

  String get baseUrl => _baseUrl;

  Future<Map<String, dynamic>> getWeek(int year, int week) async {
    final response = await http.get(Uri.parse('$baseUrl/weeks/$year/$week'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to load week: ${response.statusCode}');
  }

  Future<List<dynamic>> getUsers() async {
    final response = await http.get(Uri.parse('$baseUrl/users'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('Failed to load users: ${response.statusCode}');
  }

  Future<void> updateLocation(String date, int userId, String location) async {
    final response = await http.put(
      Uri.parse('$baseUrl/days/$date/user/$userId'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'work_location': location}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update location: ${response.statusCode}');
    }
  }

  Future<void> updateAssignment({
    required String date,
    int? dropoffUserId,
    String? dropoffTime,
    int? pickupUserId,
    String? pickupTime,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/assignments/$date'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'dropoff_user_id': dropoffUserId,
        'dropoff_time': dropoffTime,
        'pickup_user_id': pickupUserId,
        'pickup_time': pickupTime,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update assignment: ${response.statusCode}');
    }
  }
}
