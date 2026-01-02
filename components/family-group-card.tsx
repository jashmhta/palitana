/**
 * Family Group Card Component
 * Shows family/group members and their checkpoint status
 */

import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FamilyGroup, Participant, ScanLog } from "@/types";

interface FamilyGroupCardProps {
  group: FamilyGroup;
  participants: Participant[];
  scanLogs: ScanLog[];
  currentCheckpoint: number;
  onPress?: () => void;
}

interface MemberStatus {
  participant: Participant;
  isAtCurrentCheckpoint: boolean;
  lastCheckpoint: number;
}

export function FamilyGroupCard({
  group,
  participants,
  scanLogs,
  currentCheckpoint,
  onPress,
}: FamilyGroupCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useLanguage();

  // Calculate member statuses
  const memberStatuses = useMemo(() => {
    const statuses: MemberStatus[] = [];

    group.memberIds.forEach((memberId) => {
      const participant = participants.find((p) => p.id === memberId);
      if (!participant) return;

      // Get scans for this participant
      const participantScans = scanLogs.filter((log) => log.participantId === memberId);
      
      // Check if scanned at current checkpoint
      const isAtCurrentCheckpoint = participantScans.some(
        (log) => log.checkpointId === currentCheckpoint
      );

      // Find last checkpoint
      const lastCheckpoint = participantScans.reduce((max, log) => {
        return log.checkpointId > max ? log.checkpointId : max;
      }, 0);

      statuses.push({
        participant,
        isAtCurrentCheckpoint,
        lastCheckpoint,
      });
    });

    return statuses;
  }, [group, participants, scanLogs, currentCheckpoint]);

  const presentCount = memberStatuses.filter((m) => m.isAtCurrentCheckpoint).length;
  const totalMembers = memberStatuses.length;
  const allPresent = presentCount === totalMembers;

  const handleMemberPress = (participantId: string) => {
    router.push(`/participant/${participantId}`);
  };

  return (
    <Animated.View entering={FadeIn}>
      <Pressable
        style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}
        onPress={onPress}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.groupIcon, { backgroundColor: colors.primaryLight }]}>
            <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.groupName}>{group.name}</ThemedText>
            <ThemedText style={[styles.memberCount, { color: colors.textSecondary }]}>
              {totalMembers} {t("group_members")}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: allPresent ? colors.successLight : colors.warningLight },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                { color: allPresent ? colors.success : colors.warning },
              ]}
            >
              {allPresent ? t("group_all_present") : `${presentCount}/${totalMembers}`}
            </ThemedText>
          </View>
        </View>

        {/* Members List */}
        <View style={styles.membersList}>
          {memberStatuses.map((member, index) => (
            <Pressable
              key={member.participant.id}
              style={[
                styles.memberItem,
                index < memberStatuses.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => handleMemberPress(member.participant.id)}
            >
              <View
                style={[
                  styles.memberStatus,
                  {
                    backgroundColor: member.isAtCurrentCheckpoint
                      ? colors.success
                      : colors.textTertiary,
                  },
                ]}
              />
              <View style={styles.memberInfo}>
                <ThemedText style={styles.memberName} numberOfLines={1}>
                  {member.participant.name}
                  {group.headOfFamily === member.participant.id && (
                    <ThemedText style={[styles.headBadge, { color: colors.primary }]}>
                      {" "}★
                    </ThemedText>
                  )}
                </ThemedText>
                <ThemedText style={[styles.memberCheckpoint, { color: colors.textSecondary }]}>
                  {member.isAtCurrentCheckpoint
                    ? `✓ CP${currentCheckpoint}`
                    : member.lastCheckpoint > 0
                    ? `Last: CP${member.lastCheckpoint}`
                    : "Not started"}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={14} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {/* Missing Members Alert */}
        {!allPresent && (
          <View style={[styles.alertBar, { backgroundColor: colors.warningLight }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.warning} />
            <ThemedText style={[styles.alertText, { color: colors.warning }]}>
              {t("group_missing_members")}: {totalMembers - presentCount}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  groupName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  memberCount: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  membersList: {
    paddingHorizontal: Spacing.md,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  memberStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  headBadge: {
    fontWeight: Typography.weight.bold,
  },
  memberCheckpoint: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  alertBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  alertText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
