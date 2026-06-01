import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use compile-time const or default to relative path for same-origin deployment
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '/api',
  );

  String get baseUrl => _baseUrl;
  static String get staticBaseUrl => _baseUrl;

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

  Future<void> createUser(String name, String type) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'type': type}),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to create user: ${response.statusCode}');
    }
  }

  Future<void> updateUser(int id, String name) async {
    final response = await http.put(
      Uri.parse('$baseUrl/users/$id'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update user: ${response.statusCode}');
    }
  }

  Future<void> deleteUser(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/users/$id'));
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete user: ${response.statusCode}');
    }
  }

  Future<void> updateAssignment({
    required String date,
    required Map<String, dynamic> fields,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/assignments/$date'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(fields),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update assignment: ${response.statusCode}');
    }
  }

  Future<Map<String, dynamic>> getSettings() async {
    final response = await http.get(Uri.parse('$baseUrl/settings'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to load settings: ${response.statusCode}');
  }

  Future<void> updateSettings(Map<String, String> settings) async {
    final response = await http.put(
      Uri.parse('$baseUrl/settings'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(settings),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update settings: ${response.statusCode}');
    }
  }
}
