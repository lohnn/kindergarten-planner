import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/realtime_provider.dart';
import '../services/realtime_service.dart';
import '../theme/app_theme.dart';

/// Small, unobtrusive header indicator for the realtime (SSE) sync state.
///
/// This is the single source of "are we connected?" truth in the header — it
/// replaces the old `/api/health` poll dot, because an open SSE stream is a
/// strictly stronger live-reachability signal than a 30 s health poll.
///
/// Meaning is conveyed by THREE redundant channels (never color alone):
///   - a distinct icon shape per state,
///   - a distinct accent color (teal / amber / neutral grey — deliberately
///     outside the identity blue/fuchsia and WFH-green/office-red hue space),
///   - a tooltip describing the state.
class SyncStatusIndicator extends ConsumerWidget {
  const SyncStatusIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(realtimeStatusProvider);
    final ext = Theme.of(context).extension<AppColorsExtension>()!;

    final (IconData icon, Color color, String label, String tooltip) =
        switch (status) {
      RealtimeStatus.open => (
          Icons.bolt,
          ext.syncLive,
          'Live',
          'Live — changes sync in realtime',
        ),
      RealtimeStatus.connecting => (
          Icons.sync,
          ext.syncReconnecting,
          'Reconnecting',
          'Reconnecting — trying to restore live sync',
        ),
      RealtimeStatus.closed => (
          Icons.pause_circle_outline,
          ext.syncPaused,
          'Paused',
          'Paused — live sync resumes when this tab is active',
        ),
    };

    return Tooltip(
      message: tooltip,
      child: Semantics(
        label: 'Realtime sync status: $tooltip',
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
