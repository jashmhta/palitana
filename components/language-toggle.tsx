/**
 * Language Toggle Component
 * Compact toggle for switching between English, Hindi, and Gujarati
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { Language, languageNames, useLanguage } from "@/contexts/language-context";
import { Colors } from "@/constants/theme";

interface LanguageToggleProps {
  compact?: boolean;
  showLabel?: boolean;
}

export function LanguageToggle({ compact = false, showLabel = true }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const languages: Language[] = ["en", "gu", "hi"];

  const handleLanguageChange = async (lang: Language) => {
    if (lang !== language) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLanguage(lang);
    }
  };

  if (compact) {
    // Compact version - just shows current language with tap to cycle
    const nextLanguage = languages[(languages.indexOf(language) + 1) % languages.length];
    
    return (
      <Pressable
        style={styles.compactButton}
        onPress={() => handleLanguageChange(nextLanguage)}
      >
        <ThemedText style={styles.compactText}>
          {language === "en" ? "EN" : language === "gu" ? "ગુ" : "हि"}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <ThemedText style={styles.label}>
          {language === "en" ? "Language" : language === "gu" ? "ભાષા" : "भाषा"}
        </ThemedText>
      )}
      <View style={styles.toggleContainer}>
        {languages.map((lang) => (
          <Pressable
            key={lang}
            style={[
              styles.toggleButton,
              language === lang && styles.toggleButtonActive,
            ]}
            onPress={() => handleLanguageChange(lang)}
          >
            <ThemedText
              style={[
                styles.toggleText,
                language === lang && styles.toggleTextActive,
              ]}
            >
              {languageNames[lang]}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Inline language toggle for headers
export function HeaderLanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const languages: Language[] = ["en", "gu", "hi"];
  const nextLanguage = languages[(languages.indexOf(language) + 1) % languages.length];

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(nextLanguage);
  };

  return (
    <Pressable style={styles.headerToggle} onPress={handlePress}>
      <ThemedText style={styles.headerToggleText}>
        {language === "en" ? "EN" : language === "gu" ? "ગુ" : "हि"}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.7,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  compactButton: {
    backgroundColor: Colors.light.tint + "20",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint + "40",
  },
  compactText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  headerToggle: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  headerToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
