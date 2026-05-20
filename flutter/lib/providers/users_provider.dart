import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import 'week_provider.dart';

final usersProvider = FutureProvider<List<User>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final json = await api.getUsers();
  return json.map((u) => User.fromJson(u as Map<String, dynamic>)).toList();
});
