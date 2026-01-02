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

export type SortOption = 'name' | 'progress' | 'recent';
export type FilterStatus = 'all' | 'completed' | 'in_progress' | 'not_started';

interface SortFilterProps {
  sortBy: SortOption;
  filterStatus: FilterStatus;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterStatus) => void;
}

const sortOptions: { value: SortOption; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'name', label: 'Name (A-Z)', icon: 'sort-by-alpha' },
  { value: 'progress', label: 'Progress', icon: 'trending-up' },
  { value: 'recent', label: 'Recent Activity', icon: 'schedule' },
];

const filterOptions: { value: FilterStatus; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#666' },
  { value: 'completed', label: 'Completed', color: '#2E8B57' },
  { value: 'in_progress', label: 'In Progress', color: '#D4A853' },
  { value: 'not_started', label: 'Not Started', color: '#999' },
];

export function SortFilterBar({
  sortBy,
  filterStatus,
  onSortChange,
  onFilterChange,
}: SortFilterProps) {
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentSort = sortOptions.find(o => o.value === sortBy);
  const currentFilter = filterOptions.find(o => o.value === filterStatus);

  const handlePress = (type: 'sort' | 'filter') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (type === 'sort') {
      setShowSortModal(true);
    } else {
      setShowFilterModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => handlePress('sort')}
      >
        <MaterialIcons name={currentSort?.icon || 'sort'} size={18} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {currentSort?.label || 'Sort'}
        </Text>
        <MaterialIcons name="expand-more" size={18} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => handlePress('filter')}
      >
        <MaterialIcons name="filter-list" size={18} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {currentFilter?.label || 'Filter'}
        </Text>
        {filterStatus !== 'all' && (
          <View style={[styles.badge, { backgroundColor: currentFilter?.color }]}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        )}
        <MaterialIcons name="expand-more" size={18} color={colors.textSecondary} />
      </Pressable>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowSortModal(false)}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  sortBy === option.value && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  onSortChange(option.value);
                  setShowSortModal(false);
                }}
              >
                <MaterialIcons
                  name={option.icon}
                  size={22}
                  color={sortBy === option.value ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: sortBy === option.value ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <MaterialIcons name="check" size={22} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowFilterModal(false)}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Status</Text>
            {filterOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  filterStatus === option.value && { backgroundColor: option.color + '15' },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  onFilterChange(option.value);
                  setShowFilterModal(false);
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                <Text
                  style={[
                    styles.optionText,
                    { color: filterStatus === option.value ? option.color : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {filterStatus === option.value && (
                  <MaterialIcons name="check" size={22} color={option.color} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
