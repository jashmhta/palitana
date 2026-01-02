/**
 * Theme constants for Palitana Yatra app
 * Colors inspired by the app logo - saffron orange gradient with gold accents
 */

import { Platform } from "react-native";

// Primary saffron orange colors matching the app logo
const saffronOrange = "#F5841F"; // Main saffron orange from logo
const saffronDark = "#D96B0C"; // Darker saffron for depth
const saffronLight = "#FF9F45"; // Lighter saffron for highlights
const goldenAccent = "#D4A84B"; // Gold accent from temple illustration

export type ColorScheme = 'light' | 'dark';
export type SchemeColors = typeof Colors.light;
export type ThemeColorPalette = typeof Colors.light;

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#666666",
    textTertiary: "#999999",
    background: "#FFFFFF",
    backgroundSecondary: "#F8F9FA",
    tint: saffronOrange,
    tintDark: saffronDark,
    tintLight: saffronLight,
    // Primary color aliases (for backward compatibility)
    primary: saffronOrange,
    primaryLight: "#FFF3E6",
    icon: "#687076",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: saffronOrange,
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    card: "#FFFFFF",
    cardElevated: "#FFFFFF",
    success: "#22C55E",
    successLight: "#DCFCE7",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    info: "#3B82F6",
    infoLight: "#DBEAFE",
    // Gradient colors for headers (matching logo gradient)
    gradientStart: "#F5841F", // Saffron orange
    gradientEnd: "#FFAB40", // Golden orange
    gradientPrimaryStart: "#F5841F",
    gradientPrimaryEnd: "#FFAB40",
    // Glass effect colors
    glass: "rgba(255, 255, 255, 0.1)",
    glassOverlay: "rgba(255, 255, 255, 0.05)",
    // Pending/in-progress color
    pending: "#F59E0B",
    // Status colors
    completed: "#22C55E",
    completedLight: "#DCFCE7",
    inProgress: saffronOrange,
    inProgressLight: "#FFF3E6",
    notStarted: "#9CA3AF",
    notStartedLight: "#F3F4F6",
    // Golden accent for special elements
    golden: goldenAccent,
    goldenLight: "#F5E6C8",
    // Glass effect border
    glassBorder: "rgba(255, 255, 255, 0.2)",
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#D1D5DB",
    textTertiary: "#9CA3AF",
    background: "#111827",
    backgroundSecondary: "#1F2937",
    tint: saffronLight,
    tintDark: saffronOrange,
    tintLight: "#FFB366",
    // Primary color aliases (for backward compatibility)
    primary: saffronLight,
    primaryLight: "#3D2A1A",
    icon: "#9BA1A6",
    tabIconDefault: "#6B7280",
    tabIconSelected: saffronLight,
    border: "#374151",
    borderLight: "#1F2937",
    card: "#1F2937",
    cardElevated: "#374151",
    success: "#4ADE80",
    successLight: "#14532D",
    warning: "#FBBF24",
    warningLight: "#78350F",
    error: "#F87171",
    errorLight: "#7F1D1D",
    info: "#60A5FA",
    infoLight: "#1E3A5F",
    // Gradient colors for headers
    gradientStart: "#D96B0C",
    gradientEnd: "#F5841F",
    gradientPrimaryStart: "#D96B0C",
    gradientPrimaryEnd: "#F5841F",
    // Glass effect colors
    glass: "rgba(0, 0, 0, 0.3)",
    glassOverlay: "rgba(0, 0, 0, 0.2)",
    // Pending/in-progress color
    pending: "#FBBF24",
    // Status colors
    completed: "#4ADE80",
    completedLight: "#14532D",
    inProgress: saffronLight,
    inProgressLight: "#78350F",
    notStarted: "#6B7280",
    notStartedLight: "#1F2937",
    // Golden accent
    golden: goldenAccent,
    goldenLight: "#3D3520",
    // Glass effect border
    glassBorder: "rgba(255, 255, 255, 0.1)",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  base: 12,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

export const Typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 36,
  },
  weight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const Shadows = {
  glow: {
    shadowColor: saffronOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
