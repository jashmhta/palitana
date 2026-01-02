/**
 * QR Token Generation Utility
 * Generates unique, scannable tokens for participants
 */

import * as Crypto from "expo-crypto";

const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars: 0, O, I, 1

/**
 * Generate a unique QR token
 * @param length Token length (default 12)
 * @returns Unique alphanumeric token
 */
export async function generateQRToken(length: number = 12): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  let token = "";
  
  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % TOKEN_CHARS.length;
    token += TOKEN_CHARS[index];
  }
  
  return token;
}

/**
 * Generate a unique participant ID
 * @param existingIds Array of existing IDs to avoid collisions
 * @returns Unique participant ID in format p_XXXX
 */
export async function generateParticipantId(existingIds: string[]): Promise<string> {
  const maxId = existingIds
    .filter((id) => id.startsWith("p_"))
    .map((id) => parseInt(id.replace("p_", ""), 10))
    .reduce((max, num) => (num > max ? num : max), 0);
  
  const newNum = maxId + 1;
  return `p_${newNum.toString().padStart(4, "0")}`;
}

/**
 * Validate QR token format
 * @param token Token to validate
 * @returns True if valid
 */
export function isValidQRToken(token: string): boolean {
  if (!token || token.length < 8 || token.length > 16) {
    return false;
  }
  
  const validChars = /^[A-Z0-9]+$/;
  return validChars.test(token);
}
