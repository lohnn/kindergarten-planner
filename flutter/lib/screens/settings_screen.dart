import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../providers/theme_provider.dart';
import '../providers/users_provider.dart';
import '../providers/week_provider.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final Map<int, TextEditingController> _nameControllers = {};
  final TextEditingController _newOccasionalController = TextEditingController();
  TimeOfDay _dropoffTime = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay _pickupTime = const TimeOfDay(hour: 15, minute: 0);
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDefaults();
  }

  Future<void> _loadDefaults() async {
    final api = ref.read(apiServiceProvider);
    try {
      final settings = await api.getSettings();
      final dropoff = settings['default_dropoff_time'] as String? ?? '08:00';
      final pickup = settings['default_pickup_time'] as String? ?? '15:00';
      setState(() {
        _dropoffTime = _parseTime(dropoff);
        _pickupTime = _parseTime(pickup);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  TimeOfDay _parseTime(String t) {
    final parts = t.split(':');
    return TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  void dispose() {
    for (final c in _nameControllers.values) {
      c.dispose();
    }
    _newOccasionalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;
    final usersAsync = ref.watch(usersProvider);
    final currentMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Theme.of(context).colorScheme.surface,
        foregroundColor: Theme.of(context).textTheme.bodyLarge?.color,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : usersAsync.when(
              data: (users) => _buildContent(context, ext, users, currentMode),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    AppColorsExtension ext,
    List<User> users,
    ThemeMode currentMode,
  ) {
    final primaryUsers = users.where((u) => u.isPrimary).toList();
    final occasionalUsers = users.where((u) => !u.isPrimary).toList();

    // Initialize controllers for primary users
    for (final user in primaryUsers) {
      _nameControllers.putIfAbsent(
        user.id,
        () => TextEditingController(text: user.name),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Primary Users
          _sectionHeader('Primary Users', ext),
          const SizedBox(height: 8),
          ...primaryUsers.map((user) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: TextField(
                  controller: _nameControllers[user.id],
                  decoration: InputDecoration(
                    labelText: 'User ${primaryUsers.indexOf(user) + 1}',
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              )),
          const SizedBox(height: 24),

          // Occasional People
          _sectionHeader('Occasional People', ext),
          const SizedBox(height: 8),
          ...occasionalUsers.map((user) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(user.name,
                          style: Theme.of(context).textTheme.bodyMedium),
                    ),
                    IconButton(
                      icon: Icon(Icons.delete_outline,
                          color: ext.conflict, size: 20),
                      onPressed: () => _deleteOccasional(user.id),
                    ),
                  ],
                ),
              )),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _newOccasionalController,
                  decoration: const InputDecoration(
                    hintText: 'Add person...',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.add_circle_outline),
                onPressed: _addOccasional,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Default Times
          _sectionHeader('Default Times', ext),
          const SizedBox(height: 8),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Drop-off time'),
            trailing: TextButton(
              onPressed: () => _pickTime(isDropoff: true),
              child: Text(_formatTime(_dropoffTime)),
            ),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Pick-up time'),
            trailing: TextButton(
              onPressed: () => _pickTime(isDropoff: false),
              child: Text(_formatTime(_pickupTime)),
            ),
          ),
          const SizedBox(height: 24),

          // Theme
          _sectionHeader('Theme', ext),
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
          const SizedBox(height: 32),

          // Save button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _save,
              child: const Text('Save'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, AppColorsExtension ext) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: ext.textMuted,
      ),
    );
  }

  Future<void> _pickTime({required bool isDropoff}) async {
    final initial = isDropoff ? _dropoffTime : _pickupTime;
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        if (isDropoff) {
          _dropoffTime = picked;
        } else {
          _pickupTime = picked;
        }
      });
    }
  }

  Future<void> _addOccasional() async {
    final name = _newOccasionalController.text.trim();
    if (name.isEmpty) return;
    final api = ref.read(apiServiceProvider);
    await api.createUser(name, 'occasional');
    _newOccasionalController.clear();
    ref.invalidate(usersProvider);
    ref.invalidate(weekProvider);
  }

  Future<void> _deleteOccasional(int id) async {
    final api = ref.read(apiServiceProvider);
    await api.deleteUser(id);
    ref.invalidate(usersProvider);
    ref.invalidate(weekProvider);
  }

  Future<void> _save() async {
    final api = ref.read(apiServiceProvider);

    // Save name changes
    for (final entry in _nameControllers.entries) {
      await api.updateUser(entry.key, entry.value.text.trim());
    }

    // Save default times via API
    await api.updateSettings({
      'default_dropoff_time': _formatTime(_dropoffTime),
      'default_pickup_time': _formatTime(_pickupTime),
    });

    ref.invalidate(usersProvider);
    ref.invalidate(weekProvider);
    ref.invalidate(settingsProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved')),
      );
    }
  }
}
