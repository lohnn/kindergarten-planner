import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Holds the active user ID ("I am ..."). Null means not yet selected.
///
/// Migrated from `StateProvider` to a `Notifier` for Riverpod 3.x.
final activeUserProvider =
    NotifierProvider<ActiveUserNotifier, int?>(ActiveUserNotifier.new);

class ActiveUserNotifier extends Notifier<int?> {
  @override
  int? build() => null;

  void set(int? id) => state = id;
}
