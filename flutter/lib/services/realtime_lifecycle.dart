// realtime_lifecycle.dart — Platform-agnostic SSE connection lifecycle state
// machine. Deliberately has NO dependency on package:web / dart:js_interop so
// it can be unit-tested on the Dart VM (the DOM-event wiring that *drives* this
// lives in realtime_service_web.dart and can only be verified on a real
// browser / device).
//
// WHY THIS EXISTS (iOS Safari hardening):
// Driving the connection purely from `visibilitychange` is unreliable on iOS
// Safari for the return-from-background path:
//   - A bfcache restore (app switch → return) fires `pageshow` with
//     `persisted == true` and frequently does NOT fire `visibilitychange`, so
//     a visibilitychange-only handler leaves the stream closed and the grid
//     stale (WebKit bugs; w3c/page-visibility#59; flarum/framework#4588).
//   - iOS may also silently kill the SSE socket while backgrounded without an
//     `onerror`, so explicit teardown-on-hide + explicit reopen-on-return is
//     the correct model.
// The web impl therefore feeds THREE signals into this controller —
// visibilitychange, window `pageshow` (bfcache restore), and window `pagehide`
// — and this controller coalesces them into AT MOST one resync + one open per
// resume, in the correct order (resync awaited, THEN open).

import 'dart:async';

/// Drives connection state from coarse "visible / hidden / restored" signals.
///
/// The controller is intentionally dumb about *how* signals are produced; the
/// web implementation maps DOM events onto [onBecameVisible],
/// [onBecameHidden], and [onBfcacheRestore]. It guarantees:
///   * hidden  -> [closeStream] exactly once (idempotent if already closed)
///   * resume  -> [resync] awaited, THEN [openStream] (correct ordering)
///   * multiple resume triggers that arrive together (e.g. pageshow +
///     visibilitychange) coalesce into a SINGLE resync + SINGLE open
///   * a resume trigger that arrives while a resync is still in flight does not
///     start a second resync or open a second stream
class RealtimeLifecycle {
  RealtimeLifecycle({
    required Future<void> Function() resync,
    required void Function() openStream,
    required void Function() closeStream,
  })  : _resync = resync,
        _openStream = openStream,
        _closeStream = closeStream;

  final Future<void> Function() _resync;
  final void Function() _openStream;
  final void Function() _closeStream;

  /// True once the stream is considered established (resync done + open issued).
  /// Used so a redundant resume trigger is a no-op.
  bool _open = false;

  /// True while a resume is in progress (resync in flight or open pending), so
  /// concurrent resume triggers coalesce instead of stacking.
  bool _resuming = false;

  /// Whether a resync + reopen has actually completed (exposed for tests).
  bool get isOpen => _open;

  /// Whether a resume is currently in flight (exposed for tests).
  bool get isResuming => _resuming;

  /// Signal: page/tab became visible (DOM `visibilitychange` →
  /// `visibilityState == 'visible'`).
  Future<void> onBecameVisible() => _resume();

  /// Signal: page restored from bfcache (DOM `pageshow` with
  /// `persisted == true`). On iOS Safari this is the COMMON return-from-
  /// background path and frequently the ONLY signal we get, so it must behave
  /// exactly like [onBecameVisible].
  Future<void> onBfcacheRestore() => _resume();

  /// Signal: page/tab became hidden or is being unloaded (DOM
  /// `visibilitychange` → hidden, or window `pagehide`).
  void onBecameHidden() {
    // Cancel any in-flight resume intent: when the resync completes it must not
    // open a stream for a page that is now hidden again.
    _resuming = false;
    if (_open) {
      _open = false;
      _closeStream();
    } else {
      // Already closed; ensure the transport is torn down idempotently. This is
      // safe because closeStream itself is idempotent in the web impl.
      _closeStream();
    }
  }

  /// Resume path shared by visible + bfcache restore. Coalesces concurrent
  /// triggers and preserves resync-before-open ordering.
  Future<void> _resume() async {
    // Already connected, or a resume is already underway → coalesce to no-op.
    if (_open || _resuming) return;
    _resuming = true;

    try {
      await _resync();
    } catch (_) {
      // A failed catch-up refetch must not wedge the lifecycle; we still try to
      // open the stream so realtime events can heal the state.
    }

    // If we were hidden again while resync was in flight, abort the open so we
    // don't open a stream for a backgrounded page.
    if (!_resuming) return;

    _resuming = false;
    _open = true;
    _openStream();
  }
}
