import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinder_planner/models/week.dart';
import 'package:kinder_planner/providers/week_provider.dart';
import 'package:kinder_planner/screens/home_screen.dart';
import 'package:kinder_planner/theme/app_theme.dart';

import 'mock_week_data.dart';

/// Screen sizes to test.
const _sizes = <String, Size>{
  '320x568': Size(320, 568),
  '360x640': Size(360, 640),
  '375x667': Size(375, 667),
  '390x844': Size(390, 844),
  '414x896': Size(414, 896),
  '430x932': Size(430, 932),
  '768x500': Size(768, 500),
  '768x1024': Size(768, 1024),
  '1024x400': Size(1024, 400),
  '1280x800': Size(1280, 800),
  '1920x1080': Size(1920, 1080),
};

/// Themes to test.
const _themes = <String, ThemeData Function()>{
  'light': _lightTheme,
  'dark': _darkTheme,
};

ThemeData _lightTheme() => AppTheme.light;
ThemeData _darkTheme() => AppTheme.dark;

/// Data states to test.
final _dataStates = <String, Week>{
  'mixed': mockWeek,
  'empty': mockWeekEmpty,
  'full': mockWeekFull,
};

void main() {
  group('WeekGrid golden matrix', () {
    Future<void> pumpApp(
      WidgetTester tester, {
      required Size size,
      required ThemeData theme,
      required Week weekData,
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
            weekProvider.overrideWith((ref) async => weekData),
            currentWeekIndexProvider.overrideWith((ref) => (2026, 21)),
          ],
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: theme,
            home: const HomeScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/$goldenName.png'),
      );
    }

    for (final sizeEntry in _sizes.entries) {
      for (final themeEntry in _themes.entries) {
        for (final dataEntry in _dataStates.entries) {
          final name =
              'week_grid_${sizeEntry.key}_${themeEntry.key}_${dataEntry.key}';

          testWidgets(name, (tester) async {
            await pumpApp(
              tester,
              size: sizeEntry.value,
              theme: themeEntry.value(),
              weekData: dataEntry.value,
              goldenName: name,
            );
          });
        }
      }
    }
  });
}
