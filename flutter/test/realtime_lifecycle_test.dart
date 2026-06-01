// VM unit tests for the SSE connection lifecycle state machine.
//
// These prove the DECISION LOGIC (when to resync, when to open/close, and how
// concurrent resume triggers coalesce) — NOT iOS Safari itself, which cannot be
// emulated on Linux. The DOM-event wiring that drives this controller
// (visibilitychange / pageshow.persisted / pagehide → onBecameVisible /
// onBfcacheRestore / onBecameHidden) lives in realtime_service_web.dart and is
// only verifiable on a real browser/device.

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:kinder_planner/services/realtime_lifecycle.dart';

/// Records the order of callback invocations so tests can assert ordering and
/// counts. Each entry is one of: 'resync', 'open', 'close'.
class _Spy {
  final List<String> events = [];
  int resyncCount = 0;
  int openCount = 0;
  int closeCount = 0;

  // Lets a test hold a resync open to simulate an in-flight async catch-up.
  Completer<void>? _pendingResync;

  Future<void> resync() async {
    resyncCount++;
    events.add('resync');
    final pending = _pendingResync;
    if (pending != null) {
      await pending.future;
    }
  }

  void open() {
    openCount++;
    events.add('open');
  }

  void close() {
    closeCount++;
    events.add('close');
  }

  /// Make the next resync block until [releaseResync] is called.
  void blockResync() => _pendingResync = Completer<void>();

  void releaseResync() {
    _pendingResync?.complete();
    _pendingResync = null;
  }
}

void main() {
  late _Spy spy;
  late RealtimeLifecycle lifecycle;

  setUp(() {
    spy = _Spy();
    lifecycle = RealtimeLifecycle(
      resync: spy.resync,
      openStream: spy.open,
      closeStream: spy.close,
    );
  });

  test('hidden → closeStream called, stream is not opened', () async {
    lifecycle.onBecameHidden();

    expect(spy.openCount, 0);
    expect(spy.resyncCount, 0);
    expect(spy.closeCount, 1);
    expect(lifecycle.isOpen, isFalse);
  });

  test('visible-from-hidden → resync THEN open (correct ordering)', () async {
    await lifecycle.onBecameVisible();

    expect(spy.resyncCount, 1);
    expect(spy.openCount, 1);
    expect(spy.events, ['resync', 'open']); // resync strictly before open
    expect(lifecycle.isOpen, isTrue);
  });

  test('bfcache restore behaves exactly like became-visible', () async {
    await lifecycle.onBfcacheRestore();

    expect(spy.resyncCount, 1);
    expect(spy.openCount, 1);
    expect(spy.events, ['resync', 'open']);
    expect(lifecycle.isOpen, isTrue);
  });

  test(
      'idempotency: pageshow + visibilitychange together → resync once, open once',
      () async {
    // Simulate the real iOS return path where BOTH events fire. The second
    // trigger arrives while the first resync is still in flight.
    spy.blockResync();

    final first = lifecycle.onBfcacheRestore(); // pageshow (persisted)
    final second = lifecycle.onBecameVisible(); // visibilitychange

    // Second trigger must coalesce (no second resync started) while first
    // resume is in flight.
    expect(spy.resyncCount, 1);
    expect(spy.openCount, 0); // open hasn't happened yet — resync still blocked

    spy.releaseResync(); // unblock the in-flight resync (completes `block`)
    await Future.wait([first, second]);

    expect(spy.resyncCount, 1, reason: 'exactly one catch-up refetch');
    expect(spy.openCount, 1, reason: 'exactly one EventSource opened');
    expect(spy.events, ['resync', 'open']);
    expect(lifecycle.isOpen, isTrue);
  });

  test('redundant resume when already open is a no-op', () async {
    await lifecycle.onBecameVisible();
    expect(spy.resyncCount, 1);
    expect(spy.openCount, 1);

    // Another visible/restore while already connected should do nothing.
    await lifecycle.onBecameVisible();
    await lifecycle.onBfcacheRestore();

    expect(spy.resyncCount, 1);
    expect(spy.openCount, 1);
    expect(lifecycle.isOpen, isTrue);
  });

  test('teardown then return → clean single reopen', () async {
    await lifecycle.onBecameVisible();
    expect(spy.openCount, 1);

    lifecycle.onBecameHidden();
    expect(spy.closeCount, 1);
    expect(lifecycle.isOpen, isFalse);

    await lifecycle.onBecameVisible();

    expect(spy.resyncCount, 2);
    expect(spy.openCount, 2);
    expect(lifecycle.isOpen, isTrue);
    // Full sequence across the background round-trip.
    expect(spy.events, ['resync', 'open', 'close', 'resync', 'open']);
  });

  test('hidden while resync in flight → does not open a backgrounded stream',
      () async {
    spy.blockResync();

    final resume = lifecycle.onBecameVisible();
    expect(spy.resyncCount, 1);
    expect(spy.openCount, 0); // still awaiting resync

    // User backgrounds again before catch-up finished.
    lifecycle.onBecameHidden();

    // Now let the resync complete; the resume must abort the open.
    spy.releaseResync(); // unblock the in-flight resync (completes `block`)
    await resume;

    expect(spy.openCount, 0, reason: 'must not open a stream for a hidden page');
    expect(lifecycle.isOpen, isFalse);
  });

  test('resync failure still opens the stream (does not wedge)', () async {
    final failing = RealtimeLifecycle(
      resync: () async => throw StateError('network down'),
      openStream: spy.open,
      closeStream: spy.close,
    );

    await failing.onBecameVisible();

    expect(spy.openCount, 1,
        reason: 'a failed catch-up must not block reconnection');
    expect(failing.isOpen, isTrue);
  });
}
