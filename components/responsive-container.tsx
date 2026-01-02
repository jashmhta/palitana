/**
 * Responsive Container Component
 * Centers content and applies max-width on desktop screens
 */

import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { useResponsive } from "@/hooks/use-responsive";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function ResponsiveContainer({
  children,
  style,
  fullWidth = false,
}: ResponsiveContainerProps) {
  const { isDesktop, containerWidth, padding } = useResponsive();

  if (fullWidth || !isDesktop) {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.innerContainer,
          { maxWidth: containerWidth, paddingHorizontal: padding },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    alignItems: "center",
  },
  innerContainer: {
    flex: 1,
    width: "100%",
  },
});
