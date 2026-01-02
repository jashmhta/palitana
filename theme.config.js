/** 
 * Palitana Yatra Theme Colors
 * Inspired by the sacred Jain pilgrimage - saffron, white, and gold
 * @type {const} 
 */
const themeColors = {
  // Saffron orange - primary brand color representing spirituality
  primary: { light: '#FF6B35', dark: '#FF8C5A' },
  // Clean backgrounds for readability
  background: { light: '#FAFAFA', dark: '#121212' },
  // Elevated surfaces for cards and modals
  surface: { light: '#FFFFFF', dark: '#1E1E1E' },
  // High contrast text
  foreground: { light: '#1A1A1A', dark: '#F5F5F5' },
  // Muted text for secondary information
  muted: { light: '#666666', dark: '#A0A0A0' },
  // Subtle borders
  border: { light: '#E0E0E0', dark: '#333333' },
  // Success green for successful scans
  success: { light: '#10B981', dark: '#34D399' },
  // Warning amber for duplicates
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  // Error red for failures
  error: { light: '#EF4444', dark: '#F87171' },
  // Gold accent for special highlights
  accent: { light: '#D4A574', dark: '#E5B896' },
};

module.exports = { themeColors };
