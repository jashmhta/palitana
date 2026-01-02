/**
 * QR Scanner Service
 * Handles QR code scanning from camera and gallery images
 * 
 * - Web: Uses jsQR with canvas for client-side decoding
 * - Native (iOS/Android): Uses server-side decoding via API endpoint
 */

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import jsQR from "jsqr";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Linking from "expo-linking";

export interface ScanResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Decode QR code from image data using jsQR
 */
const decodeQRFromImageData = (
  imageData: Uint8ClampedArray,
  width: number,
  height: number
): string | null => {
  try {
    const code = jsQR(imageData, width, height);
    return code?.data || null;
  } catch {
    return null;
  }
};

/**
 * Convert base64 to RGBA pixels using canvas (web only)
 */
const base64ToRgbaPixelsWeb = (
  base64: string
): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({
        data: imageData.data,
        width: canvas.width,
        height: canvas.height,
      });
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/png;base64,${base64}`;
  });
};

/**
 * Get the API URL for QR decoding
 * On native, we need to handle the case where the app is running in Expo Go
 */
const getQRDecodeApiUrl = (): string => {
  // Try to get the API base URL from environment
  const baseUrl = getApiBaseUrl();
  
  if (baseUrl) {
    return `${baseUrl}/api/qr-decode`;
  }
  
  // For Expo Go on native, we need to use the local network IP
  // This is typically set via EXPO_PUBLIC_API_BASE_URL
  // If not set, fall back to localhost (won't work on physical device)
  if (Platform.OS !== "web") {
    // Try to extract from Linking URL which contains the dev server address
    const linkingUrl = Linking.createURL("/");
    console.log("[QR Scanner] Linking URL:", linkingUrl);
    
    // Extract IP from exp://192.168.x.x:8081 format
    const match = linkingUrl.match(/exp:\/\/([^:]+):(\d+)/);
    if (match) {
      const ip = match[1];
      return `http://${ip}:3000/api/qr-decode`;
    }
  }
  
  return "http://localhost:3000/api/qr-decode";
};

/**
 * Decode QR code using server-side API (for native platforms)
 */
const decodeQRViaServer = async (base64Image: string): Promise<ScanResult> => {
  try {
    const apiUrl = getQRDecodeApiUrl();
    console.log("[QR Scanner] Using server API:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });
    
    if (!response.ok) {
      console.error("[QR Scanner] Server error:", response.status);
      return {
        success: false,
        error: "Server error. Please try again.",
      };
    }
    
    const result = await response.json();
    console.log("[QR Scanner] Server response:", result);
    
    return result;
  } catch (error) {
    console.error("[QR Scanner] API error:", error);
    return {
      success: false,
      error: "Could not connect to server. Please check your network connection.",
    };
  }
};

/**
 * Pick an image from the gallery and scan for QR code
 */
export const scanFromGallery = async (): Promise<ScanResult> => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return {
        success: false,
        error: "Gallery permission is required to select images",
      };
    }

    // Pick image from gallery with base64 encoding
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.8, // Slightly reduced for faster upload
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: "No image selected",
      };
    }

    const asset = result.assets[0];
    
    if (!asset.base64) {
      return {
        success: false,
        error: "Could not read image data",
      };
    }

    // For web platform, use jsQR with canvas (client-side)
    if (Platform.OS === "web") {
      // Try original image
      let rgbaData = await base64ToRgbaPixelsWeb(asset.base64);
      if (rgbaData) {
        const qrData = decodeQRFromImageData(
          rgbaData.data,
          rgbaData.width,
          rgbaData.height
        );
        if (qrData) {
          console.log("[QR Scanner] Decoded on web:", qrData);
          return {
            success: true,
            data: qrData,
          };
        }
      }

      // Try with resized image for better detection
      if (asset.uri) {
        const sizes = [800, 600, 400];
        for (const size of sizes) {
          try {
            const manipulated = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: size } }],
              { base64: true, format: ImageManipulator.SaveFormat.PNG }
            );

            if (manipulated.base64) {
              rgbaData = await base64ToRgbaPixelsWeb(manipulated.base64);
              if (rgbaData) {
                const qrData = decodeQRFromImageData(
                  rgbaData.data,
                  rgbaData.width,
                  rgbaData.height
                );
                if (qrData) {
                  console.log(`[QR Scanner] Decoded at size ${size}:`, qrData);
                  return {
                    success: true,
                    data: qrData,
                  };
                }
              }
            }
          } catch {
            continue;
          }
        }
      }

      return {
        success: false,
        error: "Could not detect QR code in the selected image. Please ensure the QR code is clearly visible and well-lit.",
      };
    }

    // For native platforms (iOS/Android), use server-side decoding
    console.log("[QR Scanner] Using server-side decoding for native platform");
    
    // Resize image for faster upload if it's too large
    let base64ToSend = asset.base64;
    
    if (asset.width && asset.width > 1200) {
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
        );
        if (manipulated.base64) {
          base64ToSend = manipulated.base64;
          console.log("[QR Scanner] Resized image for upload");
        }
      } catch {
        // Use original if resize fails
      }
    }
    
    return await decodeQRViaServer(base64ToSend);
  } catch (error) {
    console.error("[QR Scanner] Gallery scan error:", error);
    return {
      success: false,
      error: "Failed to scan image. Please try again.",
    };
  }
};

/**
 * Validate if a string is a valid QR token format
 * Our tokens are 12 character alphanumeric strings (uppercase)
 */
export const isValidQRToken = (token: string): boolean => {
  const pattern = /^[A-Z0-9]{12}$/;
  return pattern.test(token);
};
