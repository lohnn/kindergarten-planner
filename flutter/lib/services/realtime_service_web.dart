// realtime_service_web.dart — Browser SSE implementation of RealtimeService.
//
// Uses the browser's native EventSource (via package:web + dart:js_interop) so
// we get named-event listeners and automatic reconnection for free. The tab
// visibility lifecycle is driven by the DOM `visibilitychange` event reading
// `document.visibilityState` (WidgetsBindingObserver lifecycle is unreliable
// for browser tab visibility).
//
// Selected by the conditional import in realtime_service.dart when
// `dart.library.js_interop` is available (i.e. compiling for Flutter web).

import 'dart:convert';
import 'dart:js_interop';

import 'package:web/web.dart' as web;

import 'realtime_service.dart';

RealtimeService createRealtimeService({
  required String baseUrl,
  required void Function(RealtimeEvent event) onEvent,
  required Future<void> Function() onResync,
  void Function(RealtimeStatus status)? onStatus,
}) =>
    WebRealtimeService(
      baseUrl: baseUrl,
      onEvent: onEvent,
      onResync: onResync,
      onStatus: onStatus,
    );

class WebRealtimeService implements RealtimeService {
  WebRealtimeService({
    required this.baseUrl,
    required this.onEvent,
    required this.onResync,
    this.onStatus,
  });

  /// Same origin as the REST API, e.g. '/api'. The stream is `<baseUrl>/events`.
  final String baseUrl;

  /// Called for each named SSE event with decoded data. Comment/keep-alive
  /// frames never reach here (EventSource filters them internally).
  final void Function(RealtimeEvent event) onEvent;

  /// Called when the tab becomes visible again, BEFORE reopening the stream,
  /// so the caller can refetch the current week once to catch up on anything
  /// missed while disconnected.
  final Future<void> Function() onResync;

  /// Optional connection-status sink for a UI indicator.
  final void Function(RealtimeStatus status)? onStatus;

  static const _eventNames = ['assignment', 'day', 'settings'];

  web.EventSource? _source;
  // Keep strong references so listeners aren't GC'd while attached.
  final List<(String, web.EventListener)> _sourceListeners = [];
  web.EventListener? _visibilityListener;
  bool _started = false;

  @override
  void start() {
    if (_started) return;
    _started = true;

    final listener = ((web.Event _) {
      _handleVisibilityChange();
    }).toJS;
    _visibilityListener = listener;
    web.document.addEventListener('visibilitychange', listener);

    if (_isVisible) {
      _open();
    } else {
      _setStatus(RealtimeStatus.closed);
    }
  }

  @override
  void dispose() {
    _close();
    final listener = _visibilityListener;
    if (listener != null) {
      web.document.removeEventListener('visibilitychange', listener);
      _visibilityListener = null;
    }
    _started = false;
  }

  bool get _isVisible => web.document.visibilityState == 'visible';

  Future<void> _handleVisibilityChange() async {
    if (_isVisible) {
      // Catch up on anything missed while disconnected, THEN reconnect.
      await onResync();
      _open();
    } else {
      _close();
    }
  }

  void _open() {
    if (_source != null) return; // already connected
    _setStatus(RealtimeStatus.connecting);

    final source = web.EventSource('$baseUrl/events');

    // Named event listeners — comment/keep-alive frames are filtered by the
    // browser and never dispatched here.
    for (final name in _eventNames) {
      final listener = ((web.Event event) {
        _onNamedEvent(name, event);
      }).toJS;
      source.addEventListener(name, listener);
      _sourceListeners.add((name, listener));
    }

    source.onopen = ((web.Event _) {
      _setStatus(RealtimeStatus.open);
    }).toJS;

    // EventSource auto-reconnects on error; reflect the transient state.
    source.onerror = ((web.Event _) {
      _setStatus(RealtimeStatus.connecting);
    }).toJS;

    _source = source;
  }

  void _onNamedEvent(String name, web.Event event) {
    final msg = event as web.MessageEvent;
    final raw = msg.data;
    if (raw == null) return;
    final text = (raw as JSString).toDart;
    try {
      final decoded = jsonDecode(text);
      if (decoded is Map<String, dynamic>) {
        onEvent((name: name, data: decoded));
      }
    } catch (_) {
      // Ignore malformed frames; the stream keeps running.
    }
  }

  void _close() {
    final source = _source;
    if (source != null) {
      for (final (name, listener) in _sourceListeners) {
        source.removeEventListener(name, listener);
      }
      _sourceListeners.clear();
      source.close();
      _source = null;
    }
    _setStatus(RealtimeStatus.closed);
  }

  void _setStatus(RealtimeStatus status) => onStatus?.call(status);
}
