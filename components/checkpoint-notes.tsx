/**
 * Checkpoint Notes Component
 * Allow volunteers to add notes at checkpoints
 */

import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
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
import { CheckpointNote } from "@/types";

interface CheckpointNotesProps {
  visible: boolean;
  onClose: () => void;
  notes: CheckpointNote[];
  onAddNote: (note: Omit<CheckpointNote, "id" | "createdAt">) => void;
  checkpointId: number;
  checkpointName: string;
  volunteerId: string;
}

const NOTE_TYPES: { value: CheckpointNote["type"]; label: string; icon: string; color: string }[] = [
  { value: "general", label: "General", icon: "📝", color: "#3B82F6" },
  { value: "medical", label: "Medical", icon: "🏥", color: "#EF4444" },
  { value: "assistance", label: "Assistance", icon: "🤝", color: "#F59E0B" },
  { value: "other", label: "Other", icon: "📌", color: "#8B5CF6" },
];

export function CheckpointNotes({
  visible,
  onClose,
  notes,
  onAddNote,
  checkpointId,
  checkpointName,
  volunteerId,
}: CheckpointNotesProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [showAddForm, setShowAddForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<CheckpointNote["type"]>("general");
  const [participantId, setParticipantId] = useState("");

  const filteredNotes = notes.filter(n => n.checkpointId === checkpointId);

  const handleSubmit = () => {
    if (!noteText.trim()) return;

    onAddNote({
      checkpointId,
      participantId: participantId.trim() || undefined,
      volunteerId,
      note: noteText.trim(),
      type: noteType,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteText("");
    setParticipantId("");
    setNoteType("general");
    setShowAddForm(false);
  };

  const getNoteTypeInfo = (type: CheckpointNote["type"]) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];
  };

  const renderNote = ({ item, index }: { item: CheckpointNote; index: number }) => {
    const typeInfo = getNoteTypeInfo(item.type);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <GlassCard padding="md" style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}20` }]}>
              <ThemedText style={styles.typeIcon}>{typeInfo.icon}</ThemedText>
              <ThemedText style={[styles.typeLabel, { color: typeInfo.color }]}>
                {typeInfo.label}
              </ThemedText>
            </View>
            <ThemedText style={[styles.noteTime, { color: colors.textTertiary }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </ThemedText>
          </View>

          <ThemedText style={[styles.noteText, { color: colors.text }]}>
            {item.note}
          </ThemedText>

          {item.participantId && (
            <View style={styles.participantTag}>
              <IconSymbol name="person.fill" size={12} color={colors.textSecondary} />
              <ThemedText style={[styles.participantText, { color: colors.textSecondary }]}>
                Pilgrim: {item.participantId}
              </ThemedText>
            </View>
          )}
        </GlassCard>
      </Animated.View>
    );
  };

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
          <View>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Checkpoint Notes
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {checkpointName}
            </ThemedText>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Add Button */}
        {!showAddForm && (
          <AnimatedButton
            title="Add Note"
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
              {/* Type Selection */}
              <View style={styles.typeSelection}>
                {NOTE_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      styles.typeButton,
                      noteType === type.value && { backgroundColor: `${type.color}20`, borderColor: type.color },
                    ]}
                    onPress={() => setNoteType(type.value)}
                  >
                    <ThemedText style={styles.typeButtonIcon}>{type.icon}</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeButtonLabel,
                        { color: noteType === type.value ? type.color : colors.textSecondary },
                      ]}
                    >
                      {type.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.backgroundSecondary, color: colors.text },
                ]}
                placeholder="Enter your note..."
                placeholderTextColor={colors.textTertiary}
                value={noteText}
                onChangeText={setNoteText}
                multiline
                numberOfLines={4}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="Pilgrim ID (optional)"
                placeholderTextColor={colors.textTertiary}
                value={participantId}
                onChangeText={setParticipantId}
              />

              <View style={styles.formActions}>
                <AnimatedButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddForm(false)}
                  style={styles.formButton}
                />
                <AnimatedButton
                  title="Save Note"
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={!noteText.trim()}
                  style={styles.formButton}
                />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Notes List */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>📋</ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No notes for this checkpoint yet
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    marginTop: 2,
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
  typeSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  typeButtonLabel: {
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
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
  noteCard: {
    marginBottom: Spacing.md,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  typeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  typeLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  noteTime: {
    fontSize: Typography.size.xs,
  },
  noteText: {
    fontSize: Typography.size.md,
    lineHeight: 22,
  },
  participantTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: 4,
  },
  participantText: {
    fontSize: Typography.size.xs,
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
