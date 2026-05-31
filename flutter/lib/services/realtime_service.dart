// realtime_service.dart — Platform-agnostic interface for the SSE realtime
// client + a factory that selects the right implementation per platform.
//
// The actual transport (browser EventSource via package:web + dart:js_interop)
// lives in realtime_service_web.dart. A no-op stub lives in
// realtime_service_stub.dart. A conditional import picks the web impl when
// compiling for the web and the stub everywhere else (e.g. the VM under
// `flutter test`), so test/VM builds never have to compile `package:web`'s
// web-only helpers.

import 'realtime_service_stub.dart'
    if (dart.library.js_interop) 'realtime_service_web.dart';

/// Connection state for an optional UI indicator.
enum RealtimeStatus { connecting, open, closed }

/// A decoded SSE event: the named event ('assignment' | 'day' | 'settings')
/// and its JSON-decoded data map.
typedef RealtimeEvent = ({String name, Map<String, dynamic> data});

/// Manages a single SSE connection against `<baseUrl>/events` and the tab
/// visibility lifecycle:
///   - tab hidden  -> close the stream (free server resource, stop battery use)
///   - tab visible -> fire [onResync] once (caller refetches), then reopen.
///
/// Construct via the [RealtimeService] factory, which returns the web
/// implementation on Flutter web and a no-op elsewhere.
abstract class RealtimeService {
  /// Returns the platform-appropriate implementation.
  factory RealtimeService({
    required String baseUrl,
    required void Function(RealtimeEvent event) onEvent,
    required Future<void> Function() onResync,
    void Function(RealtimeStatus status)? onStatus,
  }) =>
      createRealtimeService(
        baseUrl: baseUrl,
        onEvent: onEvent,
        onResync: onResync,
        onStatus: onStatus,
      );

  /// Begin: wire the visibility listener and open the stream if the tab is
  /// currently visible.
  void start();

  /// Tear everything down (stream + visibility listener). Idempotent.
  void dispose();
}
