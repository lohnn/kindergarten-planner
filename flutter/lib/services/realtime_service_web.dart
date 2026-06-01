// realtime_service_web.dart — Browser SSE implementation of RealtimeService.
//
// Uses the browser's native EventSource (via package:web + dart:js_interop) so
// we get named-event listeners and automatic reconnection for free.
//
// LIFECYCLE (iOS Safari hardened): the connection lifecycle is NOT driven from
// `visibilitychange` alone. iOS Safari frequently restores a backgrounded page
// from bfcache, firing `pageshow` with `persisted == true` and NOT firing
// `visibilitychange` — a visibilitychange-only handler misses that common
// return path and leaves the stream closed / grid stale (WebKit bugs;
// w3c/page-visibility#59; flarum/framework#4588). It can also silently kill the
// SSE socket while backgrounded. So we feed THREE DOM signals into a
// platform-agnostic [RealtimeLifecycle] state machine:
//   - document `visibilitychange`  (desktop, Android, Safari tab-switch)
//   - window   `pageshow`          (bfcache restore → treat as "became visible")
//   - window   `pagehide`          (reliable Safari termination signal → hide)
// The lifecycle controller coalesces concurrent triggers into at most one
// resync + one open and preserves the resync-before-open ordering. The DOM
// wiring here can only be verified on a real browser/device; the controller's
// decision logic is unit-tested on the VM (test/realtime_lifecycle_test.dart).
//
// Selected by the conditional import in realtime_service.dart when
// `dart.library.js_interop` is available (i.e. compiling for Flutter web).

import 'dart:convert';
import 'dart:js_interop';

import 'package:web/web.dart' as web;

import 'realtime_lifecycle.dart';
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

  /// Called when the page resumes (became visible / bfcache restore), BEFORE
  /// reopening the stream, so the caller can refetch the current week once to
  /// catch up on anything missed while disconnected.
  final Future<void> Function() onResync;

  /// Optional connection-status sink for a UI indicator.
  final void Function(RealtimeStatus status)? onStatus;

  static const _eventNames = ['assignment', 'day', 'settings'];

  late final RealtimeLifecycle _lifecycle = RealtimeLifecycle(
    resync: onResync,
    openStream: _open,
    closeStream: _close,
  );

  web.EventSource? _source;
  // Keep strong references so JS interop closures aren't GC'd while attached
  // and can be removed precisely on dispose.
  final List<(String, web.EventListener)> _sourceListeners = [];
  web.EventListener? _visibilityListener;
  web.EventListener? _pageShowListener;
  web.EventListener? _pageHideListener;
  bool _started = false;

  @override
  void start() {
    if (_started) return;
    _started = true;

    // visibilitychange — fires on desktop, Android, and Safari tab switches.
    final visibilityListener = ((web.Event _) {
      if (_isVisible) {
        _lifecycle.onBecameVisible();
      } else {
        _lifecycle.onBecameHidden();
      }
    }).toJS;
    _visibilityListener = visibilityListener;
    web.document.addEventListener('visibilitychange', visibilityListener);

    // pageshow — on iOS Safari, returning from background commonly restores the
    // page from bfcache and fires this with persisted == true (and often no
    // visibilitychange). Treat a persisted restore exactly like "became
    // visible". A normal (non-persisted) pageshow on a visible page is a
    // harmless no-op because the lifecycle coalesces when already open.
    final pageShowListener = ((web.Event event) {
      final persisted = (event as web.PageTransitionEvent).persisted;
      if (persisted || _isVisible) {
        _lifecycle.onBfcacheRestore();
      }
    }).toJS;
    _pageShowListener = pageShowListener;
    web.window.addEventListener('pageshow', pageShowListener);

    // pagehide — a more reliable Safari "going away" signal than
    // visibilitychange in some cases (and fires before bfcache stashing).
    final pageHideListener = ((web.Event _) {
      _lifecycle.onBecameHidden();
    }).toJS;
    _pageHideListener = pageHideListener;
    web.window.addEventListener('pagehide', pageHideListener);

    // Initial state: open if currently visible, otherwise stay paused.
    if (_isVisible) {
      _lifecycle.onBecameVisible();
    } else {
      _setStatus(RealtimeStatus.closed);
    }
  }

  @override
  void dispose() {
    _close();

    final visibilityListener = _visibilityListener;
    if (visibilityListener != null) {
      web.document.removeEventListener('visibilitychange', visibilityListener);
      _visibilityListener = null;
    }
    final pageShowListener = _pageShowListener;
    if (pageShowListener != null) {
      web.window.removeEventListener('pageshow', pageShowListener);
      _pageShowListener = null;
    }
    final pageHideListener = _pageHideListener;
    if (pageHideListener != null) {
      web.window.removeEventListener('pagehide', pageHideListener);
      _pageHideListener = null;
    }
    _started = false;
  }

  bool get _isVisible => web.document.visibilityState == 'visible';

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
