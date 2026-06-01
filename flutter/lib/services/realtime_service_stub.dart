// realtime_service_stub.dart — No-op RealtimeService for non-web platforms
// (and the VM under `flutter test`). Selected by the conditional import in
// realtime_service.dart when `dart.library.js_interop` is NOT available.

import 'realtime_service.dart';

RealtimeService createRealtimeService({
  required String baseUrl,
  required void Function(RealtimeEvent event) onEvent,
  required Future<void> Function() onResync,
  void Function(RealtimeStatus status)? onStatus,
}) =>
    _NoopRealtimeService();

class _NoopRealtimeService implements RealtimeService {
  @override
  void start() {}

  @override
  void dispose() {}
}
