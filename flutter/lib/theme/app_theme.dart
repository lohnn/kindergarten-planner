import 'package:flutter/material.dart';
import 'colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: AppColors.lightBg,
        colorScheme: const ColorScheme.light(
          surface: AppColors.lightSurface,
          primary: AppColors.lightColorA,
          secondary: AppColors.lightColorB,
          error: AppColors.lightConflict,
          outline: AppColors.lightBorder,
        ),
        cardTheme: const CardThemeData(
          color: AppColors.lightSurface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: AppColors.lightBorder),
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: AppColors.lightText),
          bodyMedium: TextStyle(color: AppColors.lightText),
          bodySmall: TextStyle(color: AppColors.lightTextMuted),
        ),
        extensions: const [AppColorsExtension.light()],
      );

  static ThemeData get dark => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.darkBg,
        colorScheme: const ColorScheme.dark(
          surface: AppColors.darkSurface,
          primary: AppColors.darkColorA,
          secondary: AppColors.darkColorB,
          error: AppColors.darkConflict,
          outline: AppColors.darkBorder,
        ),
        cardTheme: const CardThemeData(
          color: AppColors.darkSurface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: AppColors.darkBorder),
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: AppColors.darkText),
          bodyMedium: TextStyle(color: AppColors.darkText),
          bodySmall: TextStyle(color: AppColors.darkTextMuted),
        ),
        extensions: const [AppColorsExtension.dark()],
      );
}

/// Theme extension to access custom colors via context.
@immutable
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color colorA;
  final Color colorALight;
  final Color colorAText;
  final Color colorB;
  final Color colorBLight;
  final Color colorBText;
  final Color colorOcc;
  final Color conflict;
  final Color conflictBg;
  final Color todayRing;
  final Color todayHeaderBg;
  final Color todayColBg;
  final Color textMuted;
  final Color border;

  const AppColorsExtension({
    required this.colorA,
    required this.colorALight,
    required this.colorAText,
    required this.colorB,
    required this.colorBLight,
    required this.colorBText,
    required this.colorOcc,
    required this.conflict,
    required this.conflictBg,
    required this.todayRing,
    required this.todayHeaderBg,
    required this.todayColBg,
    required this.textMuted,
    required this.border,
  });

  const AppColorsExtension.light()
      : colorA = AppColors.lightColorA,
        colorALight = AppColors.lightColorALight,
        colorAText = AppColors.lightColorAText,
        colorB = AppColors.lightColorB,
        colorBLight = AppColors.lightColorBLight,
        colorBText = AppColors.lightColorBText,
        colorOcc = AppColors.lightColorOcc,
        conflict = AppColors.lightConflict,
        conflictBg = AppColors.lightConflictBg,
        todayRing = AppColors.lightTodayRing,
        todayHeaderBg = AppColors.lightTodayHeaderBg,
        todayColBg = AppColors.lightTodayColBg,
        textMuted = AppColors.lightTextMuted,
        border = AppColors.lightBorder;

  const AppColorsExtension.dark()
      : colorA = AppColors.darkColorA,
        colorALight = AppColors.darkColorALight,
        colorAText = AppColors.darkColorAText,
        colorB = AppColors.darkColorB,
        colorBLight = AppColors.darkColorBLight,
        colorBText = AppColors.darkColorBText,
        colorOcc = AppColors.darkColorOcc,
        conflict = AppColors.darkConflict,
        conflictBg = AppColors.darkConflictBg,
        todayRing = AppColors.darkTodayRing,
        todayHeaderBg = AppColors.darkTodayHeaderBg,
        todayColBg = AppColors.darkTodayColBg,
        textMuted = AppColors.darkTextMuted,
        border = AppColors.darkBorder;

  @override
  ThemeExtension<AppColorsExtension> copyWith({
    Color? colorA,
    Color? colorALight,
    Color? colorAText,
    Color? colorB,
    Color? colorBLight,
    Color? colorBText,
    Color? colorOcc,
    Color? conflict,
    Color? conflictBg,
    Color? todayRing,
    Color? todayHeaderBg,
    Color? todayColBg,
    Color? textMuted,
    Color? border,
  }) {
    return AppColorsExtension(
      colorA: colorA ?? this.colorA,
      colorALight: colorALight ?? this.colorALight,
      colorAText: colorAText ?? this.colorAText,
      colorB: colorB ?? this.colorB,
      colorBLight: colorBLight ?? this.colorBLight,
      colorBText: colorBText ?? this.colorBText,
      colorOcc: colorOcc ?? this.colorOcc,
      conflict: conflict ?? this.conflict,
      conflictBg: conflictBg ?? this.conflictBg,
      todayRing: todayRing ?? this.todayRing,
      todayHeaderBg: todayHeaderBg ?? this.todayHeaderBg,
      todayColBg: todayColBg ?? this.todayColBg,
      textMuted: textMuted ?? this.textMuted,
      border: border ?? this.border,
    );
  }

  @override
  ThemeExtension<AppColorsExtension> lerp(
    covariant ThemeExtension<AppColorsExtension>? other,
    double t,
  ) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      colorA: Color.lerp(colorA, other.colorA, t)!,
      colorALight: Color.lerp(colorALight, other.colorALight, t)!,
      colorAText: Color.lerp(colorAText, other.colorAText, t)!,
      colorB: Color.lerp(colorB, other.colorB, t)!,
      colorBLight: Color.lerp(colorBLight, other.colorBLight, t)!,
      colorBText: Color.lerp(colorBText, other.colorBText, t)!,
      colorOcc: Color.lerp(colorOcc, other.colorOcc, t)!,
      conflict: Color.lerp(conflict, other.conflict, t)!,
      conflictBg: Color.lerp(conflictBg, other.conflictBg, t)!,
      todayRing: Color.lerp(todayRing, other.todayRing, t)!,
      todayHeaderBg: Color.lerp(todayHeaderBg, other.todayHeaderBg, t)!,
      todayColBg: Color.lerp(todayColBg, other.todayColBg, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      border: Color.lerp(border, other.border, t)!,
    );
  }
}
