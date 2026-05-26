import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

/// Polls /api/health every 30 seconds.
/// Returns true if the last check succeeded, false otherwise.
final healthProvider = StreamProvider<bool>((ref) async* {
  final baseUrl = ApiService.staticBaseUrl;

  Future<bool> check() async {
    try {
      final response =
          await http.get(Uri.parse('$baseUrl/health')).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Emit immediately, then every 30 s
  yield await check();
  yield* Stream.periodic(const Duration(seconds: 30))
      .asyncMap((_) => check());
});
