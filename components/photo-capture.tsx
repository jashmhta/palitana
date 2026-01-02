/**
 * Photo Capture Component
 * Capture participant photos during registration
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { AnimatedButton } from "@/components/animated-button";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface PhotoCaptureProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  currentPhoto?: string;
}

export function PhotoCapture({
  visible,
  onClose,
  onCapture,
  currentPhoto,
}: PhotoCaptureProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const cameraRef = useRef<CameraView>(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (photo?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCapture(photo.uri);
        setShowCamera(false);
        onClose();
      }
    } catch (error) {
      console.error("Photo capture error:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCapture(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to take photos.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (showCamera) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={[styles.cameraContainer, { backgroundColor: "#000" }]}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          >
            {/* Camera overlay */}
            <View style={[styles.cameraOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
              {/* Top bar */}
              <View style={styles.cameraTopBar}>
                <Pressable
                  style={styles.cameraButton}
                  onPress={() => setShowCamera(false)}
                >
                  <IconSymbol name="xmark" size={24} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.cameraButton}
                  onPress={toggleCameraFacing}
                >
                  <IconSymbol name="arrow.triangle.2.circlepath.camera" size={24} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Face guide */}
              <View style={styles.faceGuide}>
                <View style={styles.faceGuideCircle} />
                <ThemedText style={styles.faceGuideText}>
                  Position face within the circle
                </ThemedText>
              </View>

              {/* Bottom bar */}
              <View style={styles.cameraBottomBar}>
                <Pressable
                  style={styles.captureButton}
                  onPress={handleTakePhoto}
                >
                  <View style={styles.captureButtonInner} />
                </Pressable>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  }

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

      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              borderRadius: Radius["2xl"],
            },
            Shadows.xl,
          ]}
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Pilgrim Photo
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Current Photo Preview */}
          <View style={[styles.photoPreview, { backgroundColor: colors.backgroundSecondary }]}>
            {currentPhoto ? (
              <Image
                source={{ uri: currentPhoto }}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <IconSymbol name="person.fill" size={48} color={colors.textTertiary} />
                <ThemedText style={[styles.placeholderText, { color: colors.textTertiary }]}>
                  No photo added
                </ThemedText>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <AnimatedButton
              title="Take Photo"
              variant="primary"
              icon="camera.fill"
              onPress={handleOpenCamera}
              style={styles.actionButton}
            />
            <AnimatedButton
              title="Choose from Gallery"
              variant="outline"
              icon="photo"
              onPress={handlePickImage}
              style={styles.actionButton}
            />
          </View>

          {currentPhoto && (
            <Pressable
              style={styles.removeButton}
              onPress={() => {
                onCapture("");
                onClose();
              }}
            >
              <ThemedText style={[styles.removeText, { color: colors.error }]}>
                Remove Photo
              </ThemedText>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    padding: Spacing.xl,
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
    padding: Spacing.xs,
  },
  photoPreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: Typography.size.sm,
    marginTop: Spacing.sm,
  },
  actions: {
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
  removeButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  removeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  faceGuide: {
    alignItems: "center",
  },
  faceGuideCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    borderStyle: "dashed",
  },
  faceGuideText: {
    color: "#FFFFFF",
    fontSize: Typography.size.sm,
    marginTop: Spacing.md,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cameraBottomBar: {
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
});
