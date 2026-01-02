import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HelpTooltipProps {
  title: string;
  content: string;
  size?: number;
}

export function HelpTooltip({ title, content, size = 20 }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setVisible(true);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={styles.trigger}
        accessibilityLabel={`Help: ${title}`}
        accessibilityHint="Double tap to show help information"
      >
        <MaterialIcons name="help-outline" size={size} color={colors.textTertiary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.tooltip, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
              <MaterialIcons name="lightbulb" size={24} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>
            <Text style={[styles.content, { color: colors.textSecondary }]}>
              {content}
            </Text>
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeText}>Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Pre-defined help content for common features
export const HelpContent = {
  scanner: {
    title: 'QR Scanner',
    content: 'Select your checkpoint from the dropdown, then tap "Scan QR" to open the camera. Point at a pilgrim\'s QR card to record their visit. Scans work offline and sync automatically when online.',
  },
  checkpoints: {
    title: 'Checkpoints',
    content: 'View all 16 checkpoints across the 2-day pilgrimage. Each card shows how many pilgrims have passed through. Tap a checkpoint to see detailed statistics.',
  },
  pilgrims: {
    title: 'Pilgrims List',
    content: 'Search pilgrims by name, mobile number, or QR code. Tap any pilgrim to view their progress and checkpoint history. Use sort and filter options to find specific groups.',
  },
  reports: {
    title: 'Reports & Statistics',
    content: 'View overall pilgrimage progress, checkpoint completion rates, and export data to CSV for further analysis. The progress ring shows overall completion percentage.',
  },
  googleSheets: {
    title: 'Google Sheets Sync',
    content: 'Connect to Google Sheets to backup all data to the cloud. Create a sheet with "Participants" and "ScanLogs" tabs, then enter the Spreadsheet ID in settings.',
  },
  offlineMode: {
    title: 'Offline Mode',
    content: 'All scans are saved locally first. When you\'re back online, pending scans will automatically sync to Google Sheets. The status bar shows your connection state.',
  },
};

const styles = StyleSheet.create({
  trigger: {
    padding: Spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  tooltip: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  closeButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
