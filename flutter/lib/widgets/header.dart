import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/active_user_provider.dart';
import '../providers/health_provider.dart';
import '../providers/users_provider.dart';
import '../models/user.dart';
import '../screens/settings_screen.dart';
import '../theme/app_theme.dart';

class AppHeader extends ConsumerWidget {
  const AppHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(usersProvider);
    final activeUserId = ref.watch(activeUserProvider);
    final ext = Theme.of(context).extension<AppColorsExtension>()!;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(bottom: BorderSide(color: ext.border)),
      ),
      child: Row(
        children: [
          Flexible(
            child: Text(
              '🏫 Kindergarten Planner',
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
          const SizedBox(width: 8),
          usersAsync.when(
            data: (users) => _UserToggle(
              users: users.where((u) => u.isPrimary).toList(),
              activeUserId: activeUserId,
              ext: ext,
              onSelect: (id) =>
                  ref.read(activeUserProvider.notifier).state = id,
            ),
            loading: () => const SizedBox(width: 100),
            error: (_, __) => const Text('Error'),
          ),
          const SizedBox(width: 8),
          const _HealthDot(),
          const SizedBox(width: 8),
          IconButton(
            icon: Icon(Icons.settings, color: ext.textMuted, size: 20),
            onPressed: () => _showSettings(context, ref),
          ),
        ],
      ),
    );
  }

  void _showSettings(BuildContext context, WidgetRef ref) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const SettingsScreen()),
    );
  }
}

class _UserToggle extends StatelessWidget {
  final List<User> users;
  final int? activeUserId;
  final AppColorsExtension ext;
  final ValueChanged<int> onSelect;

  const _UserToggle({
    required this.users,
    required this.activeUserId,
    required this.ext,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('I am: ', style: TextStyle(color: ext.textMuted, fontSize: 13)),
        ...users.map((user) {
          final isA = users.indexOf(user) == 0;
          final color = isA ? ext.colorA : ext.colorB;
          final bgColor = isA ? ext.colorALight : ext.colorBLight;
          final isActive = activeUserId == user.id;
          return Padding(
            padding: const EdgeInsets.only(left: 4),
            child: GestureDetector(
              onTap: () => onSelect(user.id),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isActive ? bgColor : Colors.transparent,
                  border: Border.all(color: isActive ? color : ext.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  user.name,
                  style: TextStyle(
                    color: isActive ? color : ext.textMuted,
                    fontSize: 13,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _HealthDot extends ConsumerWidget {
  const _HealthDot();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthProvider);
    final color = health.when(
      data: (ok) => ok ? const Color(0xFF4CAF50) : const Color(0xFFF44336),
      loading: () => Colors.grey,
      error: (_, __) => const Color(0xFFF44336),
    );
    final tooltip = health.when(
      data: (ok) => ok ? 'Connected' : 'Disconnected',
      loading: () => 'Checking…',
      error: (_, __) => 'Disconnected',
    );
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }
}
