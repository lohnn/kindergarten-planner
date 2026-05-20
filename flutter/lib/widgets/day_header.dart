import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/day.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';
import '../providers/week_provider.dart';

class DayHeader extends ConsumerWidget {
  final String label;
  final String date;
  final bool isToday;
  final Day? day;
  final List<User> users;

  const DayHeader({
    super.key,
    required this.label,
    required this.date,
    required this.isToday,
    this.day,
    this.users = const [],
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ext = Theme.of(context).extension<AppColorsExtension>()!;
    return GestureDetector(
      onTap: day != null ? () => _showDayModal(context, ref) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isToday ? ext.todayHeaderBg : Colors.transparent,
          borderRadius: isToday
              ? const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                )
              : null,
          border: isToday
              ? Border(
                  bottom: BorderSide(color: ext.todayRing, width: 2),
                )
              : null,
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: isToday ? ext.todayRing : ext.textMuted,
              ),
            ),
            Text(
              date,
              style: TextStyle(fontSize: 11, color: ext.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  void _showDayModal(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _DayModalContent(
        day: day!,
        users: users,
        ref: ref,
      ),
    );
  }
}

class _DayModalContent extends StatefulWidget {
  final Day day;
  final List<User> users;
  final WidgetRef ref;

  const _DayModalContent({
    required this.day,
    required this.users,
    required this.ref,
  });

  @override
  State<_DayModalContent> createState() => _DayModalContentState();
}

class _DayModalContentState extends State<_DayModalContent> {
  late Map<int, String> _locations;
  int? _dropoffUserId;
  TimeOfDay? _dropoffTime;
  int? _pickupUserId;
  TimeOfDay? _pickupTime;

  @override
  void initState() {
    super.initState();
    _locations = Map.from(widget.day.locations);
    _dropoffUserId = widget.day.dropoff?.userId;
    _dropoffTime = _parseTime(widget.day.dropoff?.time);
    _pickupUserId = widget.day.pickup?.userId;
    _pickupTime = _parseTime(widget.day.pickup?.time);
  }

  TimeOfDay? _parseTime(String? t) {
    if (t == null) return null;
    final parts = t.split(':');
    if (parts.length >= 2) {
      return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
    }
    return null;
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final primaryUsers = widget.users.where((u) => u.isPrimary).toList();

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.day.date,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          // Location selectors
          ...primaryUsers.map((user) => _buildLocationRow(user)),
          const Divider(height: 24),
          // Drop-off
          _buildAssignmentSection('Drop-off', primaryUsers, _dropoffUserId, _dropoffTime,
              (uid) => setState(() => _dropoffUserId = uid),
              (time) => setState(() => _dropoffTime = time)),
          const SizedBox(height: 12),
          // Pick-up
          _buildAssignmentSection('Pick-up', primaryUsers, _pickupUserId, _pickupTime,
              (uid) => setState(() => _pickupUserId = uid),
              (time) => setState(() => _pickupTime = time)),
          const SizedBox(height: 24),
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

  Widget _buildLocationRow(User user) {
    final loc = _locations[user.id] ?? 'unknown';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(user.name)),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'home', label: Text('🏠')),
              ButtonSegment(value: 'office', label: Text('🏢')),
              ButtonSegment(value: 'unknown', label: Text('❓')),
            ],
            selected: {loc},
            onSelectionChanged: (v) => setState(() => _locations[user.id] = v.first),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentSection(
    String label,
    List<User> primaryUsers,
    int? selectedUserId,
    TimeOfDay? selectedTime,
    void Function(int?) onUserChanged,
    void Function(TimeOfDay?) onTimeChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: DropdownButton<int?>(
                value: selectedUserId,
                isExpanded: true,
                hint: const Text('Select person'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None')),
                  ...primaryUsers.map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))),
                ],
                onChanged: onUserChanged,
              ),
            ),
            const SizedBox(width: 12),
            TextButton(
              onPressed: () async {
                final time = await showTimePicker(
                  context: context,
                  initialTime: selectedTime ?? const TimeOfDay(hour: 8, minute: 0),
                  builder: (context, child) {
                    return MediaQuery(
                      data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
                      child: child!,
                    );
                  },
                );
                if (time != null) onTimeChanged(time);
              },
              child: Text(selectedTime != null ? _formatTime(selectedTime) : 'Set time'),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _save() async {
    final api = widget.ref.read(apiServiceProvider);

    // Update locations
    for (final entry in _locations.entries) {
      await api.updateLocation(widget.day.date, entry.key, entry.value);
    }

    // Update assignments
    await api.updateAssignment(
      date: widget.day.date,
      dropoffUserId: _dropoffUserId,
      dropoffTime: _dropoffTime != null ? _formatTime(_dropoffTime!) : null,
      pickupUserId: _pickupUserId,
      pickupTime: _pickupTime != null ? _formatTime(_pickupTime!) : null,
    );

    widget.ref.invalidate(weekProvider);
    if (mounted) Navigator.of(context).pop();
  }
}
