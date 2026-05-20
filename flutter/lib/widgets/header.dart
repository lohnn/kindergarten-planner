import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/active_user_provider.dart';
import '../providers/users_provider.dart';
import '../providers/theme_provider.dart';
import '../models/user.dart';
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
          Text(
            '🏫 Kindergarten Planner',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const Spacer(),
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
          IconButton(
            icon: Icon(Icons.settings, color: ext.textMuted, size: 20),
            onPressed: () => _showSettings(context, ref),
          ),
        ],
      ),
    );
  }

  void _showSettings(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => const _SettingsDialog(),
    );
  }
}

class _SettingsDialog extends ConsumerWidget {
  const _SettingsDialog();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentMode = ref.watch(themeModeProvider);

    return AlertDialog(
      title: const Text('Settings', style: TextStyle(fontSize: 18)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Theme', style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).extension<AppColorsExtension>()!.textMuted,
          )),
          const SizedBox(height: 8),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(value: ThemeMode.system, label: Text('System')),
              ButtonSegment(value: ThemeMode.light, label: Text('Light')),
              ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
            ],
            selected: {currentMode},
            onSelectionChanged: (modes) {
              ref.read(themeModeProvider.notifier).setMode(modes.first);
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
      ],
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
        const SizedBox(width: 4),
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
