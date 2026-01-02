/**
 * QR Code Display Component
 * Generates and displays scannable QR codes for participants
 */

import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}

export function QRCodeDisplay({
  value,
  size = 200,
  backgroundColor = "#FFFFFF",
  foregroundColor = "#000000",
}: QRCodeDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (!value) {
    return (
      <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
        <ThemedText style={{ color: colors.textSecondary }}>No QR code</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <QRCode
        value={value}
        size={size - 16}
        backgroundColor={backgroundColor}
        color={foregroundColor}
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
    padding: 8,
  },
});
