/**
 * Responsive Hook for Desktop/Mobile Detection
 * Provides screen size information and responsive utilities
 */

import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";

export interface ResponsiveInfo {
  width: number;
  height: number;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isWeb: boolean;
  containerWidth: number;
  columns: number;
  padding: number;
  cardWidth: number;
}

// Breakpoints
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

// Max container width for desktop
const MAX_CONTAINER_WIDTH = 1200;

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isWeb = Platform.OS === "web";

  // Determine device type based on width
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  // Calculate container width (max width on desktop)
  const containerWidth = isDesktop
    ? Math.min(width - 48, MAX_CONTAINER_WIDTH)
    : width;

  // Calculate number of columns for grids
  let columns = 1;
  if (width >= BREAKPOINTS.wide) {
    columns = 4;
  } else if (width >= BREAKPOINTS.desktop) {
    columns = 3;
  } else if (width >= BREAKPOINTS.tablet) {
    columns = 2;
  }

  // Calculate padding based on screen size
  const padding = isDesktop ? 32 : isTablet ? 24 : 16;

  // Calculate card width for grids
  const gap = 16;
  const availableWidth = containerWidth - padding * 2;
  const cardWidth = (availableWidth - gap * (columns - 1)) / columns;

  return {
    width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    isWeb,
    containerWidth,
    columns,
    padding,
    cardWidth,
  };
}

// Responsive style helper
export function responsiveValue<T>(
  info: ResponsiveInfo,
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  if (info.isDesktop && desktop !== undefined) return desktop;
  if (info.isTablet && tablet !== undefined) return tablet;
  return mobile;
}

// Get responsive font size
export function responsiveFontSize(
  info: ResponsiveInfo,
  baseSize: number
): number {
  if (info.isDesktop) return baseSize * 1.1;
  if (info.isTablet) return baseSize * 1.05;
  return baseSize;
}
