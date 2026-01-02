// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for Palitana Yatra Tracker
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "list.bullet": "list",
  "person.2.fill": "people",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  // Action icons
  "qrcode.viewfinder": "qr-code-scanner",
  "qrcode": "qr-code",
  "checkmark.circle.fill": "check-circle",
  "checkmark.seal.fill": "verified",
  "checkmark": "check",
  "xmark.circle.fill": "cancel",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "magnifyingglass": "search",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "plus": "add",
  "trash.fill": "delete",
  "pencil": "edit",
  "doc.text": "description",
  "doc.fill": "article",
  "photo": "photo",
  "arrow.down.doc.fill": "download",
  "arrow.up.doc.fill": "upload",
  "clock.fill": "schedule",
  "location.fill": "location-on",
  "wifi.slash": "wifi-off",
  "wifi": "wifi",
  "icloud.and.arrow.up": "cloud-upload",
  "icloud.and.arrow.down": "cloud-download",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  "camera.fill": "camera-alt",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  // Calendar and day icons
  "calendar": "calendar-today",
  "calendar.badge.clock": "event",
  "arrow.up.circle.fill": "arrow-circle-up",
  "arrow.down.circle.fill": "arrow-circle-down",
  // Contact icons
  "phone.fill": "phone",
  "phone.circle.fill": "phone-in-talk",
  "person.crop.circle.badge.exclamationmark": "contact-emergency",
  "heart.text.square.fill": "medical-services",
  "cross.case.fill": "local-hospital",
  // Status icons
  "bolt.fill": "bolt",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  // Additional icons for enhanced UI
  "xmark": "close",
  "clock": "access-time",
  "number": "dialpad",
  "keyboard": "keyboard",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
