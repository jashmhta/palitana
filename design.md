# Palitana Yatra Tracker - Mobile App Design

## Overview

Palitana Yatra Tracker is a mobile application designed to track pilgrims during the Palitana Yatra pilgrimage journey. The app enables volunteers to scan QR codes at various checkpoints to monitor pilgrim progress, manage participant data, and generate reports.

## Design Philosophy

This app follows **Apple Human Interface Guidelines (HIG)** to ensure it feels like a first-party iOS app. The design prioritizes:
- **Mobile portrait orientation (9:16)** and **one-handed usage**
- Clean, intuitive navigation with tab-based structure
- Accessible touch targets and clear visual hierarchy
- Support for both light and dark modes

## Screen List

### 1. Home / Scanner Screen (index.tsx)
**Primary Content:**
- Large QR code scanner button (central action)
- Current checkpoint selector
- Today's scan statistics
- Recent scans list (last 10-20 entries)
- Offline status banner when disconnected

**Functionality:**
- Camera-based QR code scanning
- Gallery image QR scanning
- Checkpoint selection modal
- Day filter (Day 1, Day 2, All)

### 2. Checkpoints Screen (checkpoints.tsx)
**Primary Content:**
- List of all checkpoints organized by day
- Progress indicators for each checkpoint
- Scan counts per checkpoint
- Visual checkpoint map/timeline

**Functionality:**
- View checkpoint details
- See pilgrim progress at each checkpoint
- Filter by day

### 3. Participants Screen (participants.tsx)
**Primary Content:**
- Searchable list of all registered pilgrims
- Family group cards
- Participant status indicators
- Quick actions (view QR, view details)

**Functionality:**
- Search by name, ID, or family group
- Add new participants
- Bulk import from Excel/CSV
- View individual participant details
- Generate QR codes

### 4. Reports Screen (reports.tsx)
**Primary Content:**
- Summary statistics dashboard
- Export options (PDF, Excel)
- Missing pilgrim alerts
- Completion certificates

**Functionality:**
- Generate attendance reports
- Export data in various formats
- View analytics and insights
- Generate completion certificates

### 5. Settings Screen (settings.tsx)
**Primary Content:**
- Device configuration
- Language selection (English/Gujarati)
- Theme toggle (Light/Dark)
- Data sync options
- Volunteer login

**Functionality:**
- Configure device ID
- Switch languages
- Manage local data
- Sync with cloud (if enabled)

### 6. Participant Detail Screen (participant/[id].tsx)
**Primary Content:**
- Full participant information
- QR code display
- Checkpoint history
- Family group members

**Functionality:**
- View complete pilgrim profile
- Share QR code
- View scan history

### 7. QR Card Screen (qr-card/[id].tsx)
**Primary Content:**
- Large QR code display
- Participant name and ID
- Shareable card format

**Functionality:**
- Display QR for scanning
- Share/print QR card

## Key User Flows

### Flow 1: Scanning a Pilgrim
1. User opens app → Home screen
2. Taps large "Scan" button
3. Camera opens with QR scanner overlay
4. Points camera at pilgrim's QR code
5. Success/Error feedback with haptics
6. Returns to home with updated recent scans

### Flow 2: Adding a New Participant
1. User navigates to Participants tab
2. Taps "+" button
3. Modal opens with form fields
4. Enters name, family group, contact info
5. Submits → QR code auto-generated
6. Can immediately share/print QR

### Flow 3: Bulk Import Participants
1. User navigates to Participants tab
2. Taps import button
3. Selects Excel/CSV file
4. Preview of data shown
5. Confirms import
6. All participants added with QR codes

### Flow 4: Generating Reports
1. User navigates to Reports tab
2. Selects report type
3. Chooses date range/filters
4. Taps "Generate"
5. Report displayed with export options
6. Can share PDF/Excel

## Color Choices

### Primary Palette
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | #D35400 | #E67E22 | Saffron/Orange - Spiritual significance |
| `background` | #FFFFFF | #151718 | Screen backgrounds |
| `surface` | #F5F5F5 | #1E2022 | Cards, elevated surfaces |
| `foreground` | #11181C | #ECEDEE | Primary text |
| `muted` | #687076 | #9BA1A6 | Secondary text |

### Status Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `success` | #22C55E | #4ADE80 | Successful scans |
| `warning` | #F59E0B | #FBBF24 | Duplicate scans |
| `error` | #EF4444 | #F87171 | Errors, not found |

### Accent Colors
- **Saffron Orange (#D35400)**: Primary brand color representing spiritual significance
- **Gold (#F1C40F)**: Highlights and achievements
- **Temple White (#FDFEFE)**: Clean backgrounds

## Component Library

### Core Components
- `ScreenContainer`: SafeArea wrapper for all screens
- `ThemedView`: View with automatic theme background
- `ThemedText`: Text with automatic theme colors
- `GlassCard`: Frosted glass effect cards
- `AnimatedButton`: Pressable with haptic feedback
- `IconSymbol`: SF Symbol icons with Material fallback

### Feature Components
- `QRCodeDisplay`: QR code renderer with sharing
- `DayPicker`: Day 1/Day 2/All filter
- `SyncStatusBar`: Cloud sync indicator
- `OfflineBanner`: Offline mode notification
- `FamilyGroupCard`: Grouped participant display
- `CheckpointNotes`: Notes per checkpoint

## Typography

- **Headings**: System font, bold, sizes 24-32pt
- **Body**: System font, regular, 16pt
- **Captions**: System font, regular, 12-14pt
- **Buttons**: System font, semibold, 16pt

## Spacing System

Using 4px base unit:
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `xxl`: 48px

## Accessibility

- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 minimum
- Support for Dynamic Type
- VoiceOver labels on all interactive elements
- Haptic feedback for important actions

## Offline Support

The app is designed to work fully offline:
- All data stored locally using AsyncStorage
- Sync status indicator when online
- Queue operations for later sync
- Clear offline mode banner
