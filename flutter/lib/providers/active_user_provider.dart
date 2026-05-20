import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Holds the active user ID ("I am ..."). Null means not yet selected.
final activeUserProvider = StateProvider<int?>((ref) => null);
