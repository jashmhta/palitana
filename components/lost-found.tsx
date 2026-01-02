/**
 * Lost & Found Component
 * Track lost items reported at checkpoints
 */

import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedButton } from "@/components/animated-button";
import { GlassCard } from "@/components/glass-card";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LostFoundItem } from "@/types";

interface LostFoundProps {
  visible: boolean;
  onClose: () => void;
  items: LostFoundItem[];
  onAddItem: (item: Omit<LostFoundItem, "id" | "reportedAt">) => void;
  onUpdateStatus: (id: string, status: LostFoundItem["status"]) => void;
  currentCheckpointId: number;
  volunteerId: string;
}

export function LostFound({
  visible,
  onClose,
  items,
  onAddItem,
  onUpdateStatus,
  currentCheckpointId,
  volunteerId,
}: LostFoundProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [itemType, setItemType] = useState<"lost" | "found">("found");

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please enter item description");
      return;
    }

    onAddItem({
      type: itemType,
      description: description.trim(),
      location: location.trim() || `Checkpoint ${currentCheckpointId}`,
      reportedBy: volunteerId,
      status: "open",
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDescription("");
    setLocation("");
    setContactInfo("");
    setShowAddForm(false);
  };

  const getStatusColor = (status: LostFoundItem["status"]) => {
    switch (status) {
      case "open":
        return colors.warning;
      case "resolved":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: LostFoundItem["status"]) => {
    switch (status) {
      case "open":
        return "Open";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  const renderItem = ({ item, index }: { item: LostFoundItem; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <GlassCard padding="md" style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={[styles.typeBadge, { backgroundColor: item.type === "lost" ? colors.errorLight : colors.successLight }]}>
            <ThemedText style={[styles.typeText, { color: item.type === "lost" ? colors.error : colors.success }]}>
              {item.type === "lost" ? "LOST" : "FOUND"}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.itemDescription, { color: colors.text }]}>
          {item.description}
        </ThemedText>

        <View style={styles.itemMeta}>
          <View style={styles.metaRow}>
            <IconSymbol name="mappin" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.location}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol name="clock" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
              {new Date(item.reportedAt).toLocaleString()}
            </ThemedText>
          </View>
        </View>

        {item.status === "open" && (
          <View style={styles.itemActions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.successLight }]}
              onPress={() => onUpdateStatus(item.id, "resolved")}
            >
              <ThemedText style={[styles.actionText, { color: colors.success }]}>
                Mark Resolved
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.errorLight }]}
              onPress={() => onUpdateStatus(item.id, "resolved")}
            >
              <ThemedText style={[styles.actionText, { color: colors.error }]}>
                Mark Unclaimed
              </ThemedText>
            </Pressable>
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.modalContent,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + Spacing.base,
            paddingBottom: insets.bottom + Spacing.base,
          },
        ]}
        entering={SlideInDown.springify().damping(15)}
        exiting={SlideOutDown.springify().damping(15)}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Lost & Found
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Add Button */}
        {!showAddForm && (
          <AnimatedButton
            title="Report Lost/Found Item"
            variant="primary"
            icon="plus"
            onPress={() => setShowAddForm(true)}
            style={styles.addButton}
          />
        )}

        {/* Add Form */}
        {showAddForm && (
          <Animated.View entering={FadeIn} style={styles.formContainer}>
            <GlassCard padding="md">
              {/* Type Toggle */}
              <View style={styles.typeToggle}>
                <Pressable
                  style={[
                    styles.toggleButton,
                    itemType === "found" && { backgroundColor: colors.successLight },
                  ]}
                  onPress={() => setItemType("found")}
                >
                  <ThemedText
                    style={[
                      styles.toggleText,
                      { color: itemType === "found" ? colors.success : colors.textSecondary },
                    ]}
                  >
                    Found Item
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton,
                    itemType === "lost" && { backgroundColor: colors.errorLight },
                  ]}
                  onPress={() => setItemType("lost")}
                >
                  <ThemedText
                    style={[
                      styles.toggleText,
                      { color: itemType === "lost" ? colors.error : colors.textSecondary },
                    ]}
                  >
                    Lost Item
                  </ThemedText>
                </Pressable>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="Item description *"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="Location (optional)"
                placeholderTextColor={colors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="Contact info (optional)"
                placeholderTextColor={colors.textTertiary}
                value={contactInfo}
                onChangeText={setContactInfo}
              />

              <View style={styles.formActions}>
                <AnimatedButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddForm(false)}
                  style={styles.formButton}
                />
                <AnimatedButton
                  title="Submit"
                  variant="primary"
                  onPress={handleSubmit}
                  style={styles.formButton}
                />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Items List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyEmoji]}>📦</ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No lost or found items reported yet
              </ThemedText>
            </View>
          }
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: Radius["2xl"],
    borderTopRightRadius: Radius["2xl"],
    paddingHorizontal: Spacing.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
  formContainer: {
    marginBottom: Spacing.lg,
  },
  typeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  toggleText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.md,
    marginBottom: Spacing.sm,
    minHeight: 44,
  },
  formActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  formButton: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  itemCard: {
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  typeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  itemDescription: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  itemMeta: {
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.size.sm,
  },
  itemActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  actionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.size.md,
    textAlign: "center",
  },
});
