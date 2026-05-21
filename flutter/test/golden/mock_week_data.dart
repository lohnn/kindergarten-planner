import 'package:kinder_planner/models/day.dart';
import 'package:kinder_planner/models/user.dart';
import 'package:kinder_planner/models/week.dart';

/// Mock data for golden tests: Week 21, 2026 (May 18-22).
final mockUsers = [
  const User(id: 1, name: 'Mama', type: 'primary'),
  const User(id: 2, name: 'Papa', type: 'primary'),
  const User(id: 3, name: 'Oma', type: 'occasional'),
];

/// Default mock: mixed assignments, one empty day.
final mockWeek = Week(
  year: 2026,
  weekNumber: 21,
  days: [
    // Monday May 18
    const Day(
      date: '2026-05-18',
      dayOfWeek: 1,
      locations: {1: 'home', 2: 'office'},
      dropoff: Assignment(userId: 1, time: '08:00'),
      pickup: Assignment(userId: 2, time: '15:30'),
    ),
    // Tuesday May 19
    const Day(
      date: '2026-05-19',
      dayOfWeek: 2,
      locations: {1: 'office', 2: 'home'},
      dropoff: Assignment(userId: 2, time: '08:15'),
      pickup: Assignment(userId: 1, time: '15:00'),
    ),
    // Wednesday May 20
    const Day(
      date: '2026-05-20',
      dayOfWeek: 3,
      locations: {1: 'home', 2: 'office'},
      dropoff: Assignment(userId: 1, time: '08:00'),
      pickup: Assignment(userId: 3, time: '14:00'),
    ),
    // Thursday May 21 - NO assignments (conflict!) + unknown location for Papa
    const Day(
      date: '2026-05-21',
      dayOfWeek: 4,
      locations: {1: 'office', 2: 'unknown'},
      dropoff: null,
      pickup: null,
    ),
    // Friday May 22
    const Day(
      date: '2026-05-22',
      dayOfWeek: 5,
      locations: {1: 'home', 2: 'home'},
      dropoff: Assignment(userId: 2, time: '08:30'),
      pickup: Assignment(userId: 1, time: '15:00'),
    ),
  ],
  users: mockUsers,
);

/// Empty week: all days unassigned, all locations unknown.
final mockWeekEmpty = Week(
  year: 2026,
  weekNumber: 21,
  days: [
    for (int i = 0; i < 5; i++)
      Day(
        date: '2026-05-${18 + i}',
        dayOfWeek: i + 1,
        locations: const {1: 'unknown', 2: 'unknown'},
        dropoff: null,
        pickup: null,
      ),
  ],
  users: mockUsers,
);

/// Full week: every day fully assigned with locations set.
final mockWeekFull = Week(
  year: 2026,
  weekNumber: 21,
  days: [
    const Day(
      date: '2026-05-18',
      dayOfWeek: 1,
      locations: {1: 'home', 2: 'office'},
      dropoff: Assignment(userId: 1, time: '08:00'),
      pickup: Assignment(userId: 2, time: '15:30'),
    ),
    const Day(
      date: '2026-05-19',
      dayOfWeek: 2,
      locations: {1: 'office', 2: 'home'},
      dropoff: Assignment(userId: 2, time: '08:15'),
      pickup: Assignment(userId: 1, time: '15:00'),
    ),
    const Day(
      date: '2026-05-20',
      dayOfWeek: 3,
      locations: {1: 'home', 2: 'office'},
      dropoff: Assignment(userId: 1, time: '08:00'),
      pickup: Assignment(userId: 2, time: '15:30'),
    ),
    const Day(
      date: '2026-05-21',
      dayOfWeek: 4,
      locations: {1: 'office', 2: 'home'},
      dropoff: Assignment(userId: 2, time: '08:15'),
      pickup: Assignment(userId: 1, time: '15:00'),
    ),
    const Day(
      date: '2026-05-22',
      dayOfWeek: 5,
      locations: {1: 'home', 2: 'home'},
      dropoff: Assignment(userId: 3, time: '08:30'),
      pickup: Assignment(userId: 1, time: '14:00'),
    ),
  ],
  users: mockUsers,
);
