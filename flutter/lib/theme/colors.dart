import 'package:flutter/material.dart';

/// App color constants. Identity colors for users are saturated;
/// state colors (location) use semantically distinct hues.
class AppColors {
  AppColors._();

  // Light theme
  static const lightBg = Color(0xFFF9FAFB);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightBorder = Color(0xFFE5E7EB);
  static const lightText = Color(0xFF111827);
  static const lightTextMuted = Color(0xFF6B7280);

  // User identity colors - light
  static const lightColorA = Color(0xFF3B82F6);
  static const lightColorALight = Color(0xFFDBEAFE);
  static const lightColorAText = Color(0xFF1D4ED8);
  static const lightColorB = Color(0xFFC026D3);
  static const lightColorBLight = Color(0xFFFAE8FF);
  static const lightColorBText = Color(0xFFA21CAF);
  static const lightColorOcc = Color(0xFF8B5CF6);

  // Conflict
  static const lightConflict = Color(0xFFEF4444);
  static const lightConflictBg = Color(0xFFFEE2E2);

  // Today highlight
  static const lightTodayRing = Color(0xFFD97706);
  static const lightTodayHeaderBg = Color(0xFFFFFBEB);
  static const lightTodayColBg = Color(0x40D97706);

  // Dark theme
  static const darkBg = Color(0xFF1F2937);
  static const darkSurface = Color(0xFF374151);
  static const darkBorder = Color(0xFF4B5563);
  static const darkText = Color(0xFFF9FAFB);
  static const darkTextMuted = Color(0xFF9CA3AF);

  // User identity colors - dark
  static const darkColorA = Color(0xFF60A5FA);
  static const darkColorALight = Color(0xFF1E3A5F);
  static const darkColorAText = Color(0xFF93C5FD);
  static const darkColorB = Color(0xFFE879F9);
  static const darkColorBLight = Color(0xFF4A044E);
  static const darkColorBText = Color(0xFFF0ABFC);
  static const darkColorOcc = Color(0xFFA78BFA);

  // Conflict - dark
  static const darkConflict = Color(0xFFF87171);
  static const darkConflictBg = Color(0xFF450A0A);

  // Today - dark
  static const darkTodayRing = Color(0xFFF59E0B);
  static const darkTodayHeaderBg = Color(0xFF2D2410);
  static const darkTodayColBg = Color(0x40FB8F24);
}
