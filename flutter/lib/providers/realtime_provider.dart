import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_service.dart';
import '../services/realtime_service.dart';
import 'week_provider.dart';

/// Exposes the current realtime connection status for an optional UI indicator.
final realtimeStatusProvider =
    NotifierProvider<RealtimeStatusNotifier, RealtimeStatus>(
        RealtimeStatusNotifier.new);

class RealtimeStatusNotifier extends Notifier<RealtimeStatus> {
  @override
  RealtimeStatus build() => RealtimeStatus.connecting;

  void set(RealtimeStatus status) => state = status;
}

/// Owns the SSE [RealtimeService] lifecycle and routes incoming events into the
/// week/settings notifiers via field-by-field merges.
///
/// Kept alive for the lifetime of the app (`ref.keepAlive`) so that Riverpod
/// 3.x's "pause out-of-view providers" behavior never tears down the live
/// connection while the grid is scrolled or a route is pushed on top. The
/// connection itself is gated by tab visibility inside [RealtimeService].
///
/// Watch this provider once near the root (see HomeScreen) to instantiate it.
final realtimeProvider = Provider<RealtimeService>((ref) {
  ref.keepAlive();

  final baseUrl = ApiService.staticBaseUrl;

  final service = RealtimeService(
    baseUrl: baseUrl,
    onEvent: (event) {
      switch (event.name) {
        case 'assignment':
          ref.read(weekProvider.notifier).mergeAssignment(event.data);
          break;
        case 'day':
          ref.read(weekProvider.notifier).mergeDay(event.data);
          break;
        case 'settings':
          ref.read(settingsProvider.notifier).mergeSettings(event.data);
          break;
      }
    },
    onResync: () async {
      // Tab became visible: catch up on anything missed while disconnected.
      await ref.read(weekProvider.notifier).refetch();
    },
    onStatus: (status) {
      // Guard: provider may be disposed during teardown.
      ref.read(realtimeStatusProvider.notifier).set(status);
    },
  );

  service.start();
  ref.onDispose(service.dispose);

  return service;
});
