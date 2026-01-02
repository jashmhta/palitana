import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { QRCodeDisplay } from "@/components/qr-code-display";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useParticipantsDB } from "@/hooks/use-database";
import { exportSingleQRCardPDF } from "@/services/pdf-export-service";

export default function QRCardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardRef = useRef<View>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { participants } = useParticipantsDB();

  const participant = useMemo(
    () => participants.find((p) => p.id === id),
    [participants, id]
  );

  const handleShare = async () => {
    try {
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: "png",
          quality: 1,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: `QR Card - ${participant?.name}`,
          });
        }
      }
    } catch (error) {
      console.error("Error sharing QR card:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!participant) return;
    
    setIsExporting(true);
    try {
      await exportSingleQRCardPDF(participant);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!participant) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 20), backgroundColor: colors.primary },
          ]}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="subtitle" style={{ color: "#FFFFFF" }}>
            QR Card
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <ThemedText>Participant not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 20), backgroundColor: colors.primary },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText type="subtitle" style={{ color: "#FFFFFF" }}>
          QR Card
        </ThemedText>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <IconSymbol name="square.and.arrow.up" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* QR Card */}
        <View
          ref={cardRef}
          style={[styles.card, { backgroundColor: "#FFFFFF" }]}
          collapsable={false}
        >
          {/* Card Header */}
          <View style={[styles.cardHeader, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.cardHeaderText}>PALITANA YATRA 2025</ThemedText>
            <ThemedText style={styles.cardSubheader}>Pilgrim ID Card</ThemedText>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCodeDisplay
              value={participant.qrToken}
              size={180}
              backgroundColor="#FFFFFF"
              foregroundColor="#000000"
            />
          </View>

          {/* Participant Info */}
          <View style={styles.cardInfo}>
            <ThemedText style={styles.participantName}>{participant.name}</ThemedText>
            <ThemedText style={styles.participantMobile}>{participant.mobile}</ThemedText>
            <View style={styles.tokenContainer}>
              <ThemedText style={styles.tokenLabel}>ID:</ThemedText>
              <ThemedText style={styles.tokenValue}>{participant.qrToken}</ThemedText>
            </View>
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerText}>
              Please keep this card safe. Show at each checkpoint.
            </ThemedText>
          </View>
        </View>

        {/* Export Buttons */}
        <View style={styles.exportButtons}>
          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="doc.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.exportButtonText}>Export for Print</ThemedText>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.success }]}
            onPress={handleShare}
          >
            <IconSymbol name="photo" size={20} color="#FFFFFF" />
            <ThemedText style={styles.exportButtonText}>Share as Image</ThemedText>
          </Pressable>
        </View>

        {/* Instructions */}
        <View style={[styles.instructions, { backgroundColor: colors.card }]}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: Spacing.sm }}>
            Instructions
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, lineHeight: 22 }}>
            • Tap &quot;Export for Print&quot; to get a printable version{"\n"}
            • Tap &quot;Share as Image&quot; to save or send the card{"\n"}
            • Each pilgrim should carry their unique QR card{"\n"}
            • Show this QR code at each checkpoint for scanning
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  card: {
    width: 300,
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  cardHeaderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cardSubheader: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: "#FFFFFF",
  },
  cardInfo: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: "#FFFFFF",
  },
  participantName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  participantMobile: {
    fontSize: 16,
    color: "#666666",
    marginTop: 4,
  },
  tokenContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#F5F5F5",
    borderRadius: Radius.sm,
  },
  tokenLabel: {
    fontSize: 14,
    color: "#666666",
    marginRight: 4,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    fontFamily: "monospace",
  },
  cardFooter: {
    backgroundColor: "#F5F5F5",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  exportButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    width: "100%",
    justifyContent: "center",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  instructions: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    width: "100%",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
