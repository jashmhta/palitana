import { useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(customShortcuts: KeyboardShortcut[] = []) {
  const router = useRouter();

  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      alt: true,
      action: () => router.push('/(tabs)'),
      description: 'Go to Scanner',
    },
    {
      key: '2',
      alt: true,
      action: () => router.push('/(tabs)/checkpoints'),
      description: 'Go to Checkpoints',
    },
    {
      key: '3',
      alt: true,
      action: () => router.push('/(tabs)/participants'),
      description: 'Go to Pilgrims',
    },
    {
      key: '4',
      alt: true,
      action: () => router.push('/(tabs)/reports'),
      description: 'Go to Reports',
    },
    {
      key: '5',
      alt: true,
      action: () => router.push('/(tabs)/settings'),
      description: 'Go to Settings',
    },
    {
      key: 'Escape',
      action: () => router.back(),
      description: 'Go back',
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        // Focus search input if available
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
    },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allShortcuts = useMemo(() => [...defaultShortcuts, ...customShortcuts], [customShortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      // Allow Escape to blur inputs
      if (event.key === 'Escape') {
        (event.target as HTMLElement).blur();
      }
      return;
    }

    for (const shortcut of allShortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [allShortcuts]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: allShortcuts };
}

// Hook for showing keyboard shortcut hints
export function useKeyboardShortcutHints() {
  const shortcuts = [
    { keys: ['Alt', '1-5'], description: 'Navigate tabs' },
    { keys: ['Ctrl', 'F'], description: 'Search' },
    { keys: ['Esc'], description: 'Go back / Clear' },
    { keys: ['↑', '↓'], description: 'Navigate list' },
    { keys: ['Enter'], description: 'Select item' },
  ];

  return { shortcuts };
}
