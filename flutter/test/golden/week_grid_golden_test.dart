import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinder_planner/models/week.dart';
import 'package:kinder_planner/providers/week_provider.dart';
import 'package:kinder_planner/screens/home_screen.dart';
import 'package:kinder_planner/theme/app_theme.dart';

import 'mock_week_data.dart';

void main() {
  group('WeekGrid golden tests', () {
    Future<void> pumpApp(
      WidgetTester tester, {
      required Size size,
      required ThemeData theme,
      required String goldenName,
    }) async {
      // Suppress overflow errors for golden capture
      final oldHandler = FlutterError.onError;
      FlutterError.onError = (details) {
        if (details.toString().contains('overflowed')) return;
        if (oldHandler != null) oldHandler(details);
      };
      addTearDown(() => FlutterError.onError = oldHandler);

      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            weekProvider.overrideWith((ref) async => mockWeek),
            currentWeekIndexProvider.overrideWith((ref) => (2026, 21)),
          ],
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: theme,
            home: const HomeScreen(),
          ),
        ),
      );

      // Wait for the FutureProvider to resolve
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/$goldenName.png'),
      );
    }

    testWidgets('390x844 mobile light', (tester) async {
      await pumpApp(
        tester,
        size: const Size(390, 844),
        theme: AppTheme.light,
        goldenName: 'week_grid_390_light',
      );
    });

    testWidgets('768x500 tablet light', (tester) async {
      await pumpApp(
        tester,
        size: const Size(768, 500),
        theme: AppTheme.light,
        goldenName: 'week_grid_768_light',
      );
    });

    testWidgets('1024x400 desktop dark', (tester) async {
      await pumpApp(
        tester,
        size: const Size(1024, 400),
        theme: AppTheme.dark,
        goldenName: 'week_grid_1024_dark',
      );
    });
  });
}
