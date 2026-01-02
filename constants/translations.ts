/**
 * Translations for English and Gujarati
 * Palitana Yatra Tracker App
 */

export type Language = "en" | "gu";

export const translations = {
  // Common
  common: {
    appName: {
      en: "Palitana Yatra",
      gu: "પાલિતાણા યાત્રા",
    },
    loading: {
      en: "Loading...",
      gu: "લોડ થઈ રહ્યું છે...",
    },
    save: {
      en: "Save",
      gu: "સાચવો",
    },
    cancel: {
      en: "Cancel",
      gu: "રદ કરો",
    },
    delete: {
      en: "Delete",
      gu: "કાઢી નાખો",
    },
    edit: {
      en: "Edit",
      gu: "સંપાદિત કરો",
    },
    done: {
      en: "Done",
      gu: "પૂર્ણ",
    },
    close: {
      en: "Close",
      gu: "બંધ કરો",
    },
    search: {
      en: "Search",
      gu: "શોધો",
    },
    all: {
      en: "All",
      gu: "બધા",
    },
    yes: {
      en: "Yes",
      gu: "હા",
    },
    no: {
      en: "No",
      gu: "ના",
    },
    ok: {
      en: "OK",
      gu: "ઠીક છે",
    },
    error: {
      en: "Error",
      gu: "ભૂલ",
    },
    success: {
      en: "Success",
      gu: "સફળતા",
    },
    warning: {
      en: "Warning",
      gu: "ચેતવણી",
    },
  },

  // Onboarding
  onboarding: {
    skip: {
      en: "Skip",
      gu: "છોડો",
    },
    next: {
      en: "Next",
      gu: "આગળ",
    },
    getStarted: {
      en: "Get Started",
      gu: "શરૂ કરો",
    },
    slide1Title: {
      en: "Scan QR Codes",
      gu: "QR કોડ સ્કેન કરો",
    },
    slide1Desc: {
      en: "Quickly scan pilgrim QR codes at each checkpoint to track their progress through the sacred journey.",
      gu: "પવિત્ર યાત્રા દરમિયાન તેમની પ્રગતિ ટ્રેક કરવા માટે દરેક ચેકપોઇન્ટ પર યાત્રાળુ QR કોડ ઝડપથી સ્કેન કરો.",
    },
    slide2Title: {
      en: "Track Progress",
      gu: "પ્રગતિ ટ્રેક કરો",
    },
    slide2Desc: {
      en: "Monitor each pilgrim's journey through all 16 checkpoints across the two-day yatra.",
      gu: "બે દિવસની યાત્રા દરમિયાન તમામ 16 ચેકપોઇન્ટ્સ દ્વારા દરેક યાત્રાળુની યાત્રાનું નિરીક્ષણ કરો.",
    },
    slide3Title: {
      en: "Real-time Reports",
      gu: "રીઅલ-ટાઇમ રિપોર્ટ્સ",
    },
    slide3Desc: {
      en: "View detailed statistics and generate reports for the entire pilgrimage group.",
      gu: "સંપૂર્ણ યાત્રાળુ જૂથ માટે વિગતવાર આંકડાઓ જુઓ અને રિપોર્ટ્સ બનાવો.",
    },
    slide4Title: {
      en: "Manage Pilgrims",
      gu: "યાત્રાળુઓનું સંચાલન",
    },
    slide4Desc: {
      en: "Add, edit, and manage pilgrim information with QR code generation for easy identification.",
      gu: "સરળ ઓળખ માટે QR કોડ જનરેશન સાથે યાત્રાળુ માહિતી ઉમેરો, સંપાદિત કરો અને સંચાલિત કરો.",
    },
  },

  // Tab Navigation
  tabs: {
    scanner: {
      en: "Scanner",
      gu: "સ્કેનર",
    },
    pilgrims: {
      en: "Pilgrims",
      gu: "યાત્રાળુઓ",
    },
    reports: {
      en: "Reports",
      gu: "રિપોર્ટ્સ",
    },
    settings: {
      en: "Settings",
      gu: "સેટિંગ્સ",
    },
  },

  // Scanner Screen
  scanner: {
    title: {
      en: "Scanner",
      gu: "સ્કેનર",
    },
    todayScans: {
      en: "Today's Scans",
      gu: "આજના સ્કેન",
    },
    pilgrims: {
      en: "Pilgrims",
      gu: "યાત્રાળુઓ",
    },
    checkpoint: {
      en: "Checkpoint",
      gu: "ચેકપોઇન્ટ",
    },
    currentCheckpoint: {
      en: "Current Checkpoint",
      gu: "વર્તમાન ચેકપોઇન્ટ",
    },
    selectCheckpoint: {
      en: "Select Checkpoint",
      gu: "ચેકપોઇન્ટ પસંદ કરો",
    },
    tapToScan: {
      en: "Tap to Scan",
      gu: "સ્કેન કરવા ટેપ કરો",
    },
    scanning: {
      en: "Scanning...",
      gu: "સ્કેન થઈ રહ્યું છે...",
    },
    scanSuccess: {
      en: "Scan Successful",
      gu: "સ્કેન સફળ",
    },
    scanFailed: {
      en: "Scan Failed",
      gu: "સ્કેન નિષ્ફળ",
    },
    alreadyScanned: {
      en: "Already scanned at this checkpoint",
      gu: "આ ચેકપોઇન્ટ પર પહેલેથી સ્કેન થયેલ છે",
    },
    pilgrimNotFound: {
      en: "Pilgrim not found",
      gu: "યાત્રાળુ મળ્યા નથી",
    },
    recentScans: {
      en: "Recent Scans",
      gu: "તાજેતરના સ્કેન",
    },
    noRecentScans: {
      en: "No recent scans",
      gu: "કોઈ તાજેતરના સ્કેન નથી",
    },
    scanFromGallery: {
      en: "Scan from Gallery",
      gu: "ગેલેરીમાંથી સ્કેન કરો",
    },
    cameraPermission: {
      en: "Camera permission is required to scan QR codes",
      gu: "QR કોડ સ્કેન કરવા માટે કેમેરા પરવાનગી જરૂરી છે",
    },
    grantPermission: {
      en: "Grant Permission",
      gu: "પરવાનગી આપો",
    },
  },

  // Day Picker
  dayPicker: {
    day1: {
      en: "Day 1",
      gu: "દિવસ 1",
    },
    day2: {
      en: "Day 2",
      gu: "દિવસ 2",
    },
    ascent: {
      en: "Ascent",
      gu: "ચઢાણ",
    },
    descent: {
      en: "Descent",
      gu: "ઉતરાણ",
    },
    allDays: {
      en: "All Days",
      gu: "બધા દિવસો",
    },
  },

  // Pilgrims Screen
  pilgrims: {
    title: {
      en: "Pilgrims",
      gu: "યાત્રાળુઓ",
    },
    registered: {
      en: "registered participants",
      gu: "નોંધાયેલા સહભાગીઓ",
    },
    searchPlaceholder: {
      en: "Search name, mobile, or QR token...",
      gu: "નામ, મોબાઇલ અથવા QR ટોકન શોધો...",
    },
    addPilgrim: {
      en: "Add Pilgrim",
      gu: "યાત્રાળુ ઉમેરો",
    },
    exportAll: {
      en: "Export All QR Cards",
      gu: "બધા QR કાર્ડ નિકાસ કરો",
    },
    completed: {
      en: "Completed",
      gu: "પૂર્ણ",
    },
    inProgress: {
      en: "In Progress",
      gu: "પ્રગતિમાં",
    },
    notStarted: {
      en: "Not Started",
      gu: "શરૂ નથી થયું",
    },
    noResults: {
      en: "No pilgrims found",
      gu: "કોઈ યાત્રાળુ મળ્યા નથી",
    },
    sortBy: {
      en: "Sort by",
      gu: "આના દ્વારા સૉર્ટ કરો",
    },
    filterBy: {
      en: "Filter by",
      gu: "આના દ્વારા ફિલ્ટર કરો",
    },
  },

  // Participant Detail
  participant: {
    progress: {
      en: "Progress",
      gu: "પ્રગતિ",
    },
    checkpoints: {
      en: "Checkpoints",
      gu: "ચેકપોઇન્ટ્સ",
    },
    scanned: {
      en: "Scanned",
      gu: "સ્કેન થયેલ",
    },
    remaining: {
      en: "Remaining",
      gu: "બાકી",
    },
    yatraCompleted: {
      en: "Yatra Completed!",
      gu: "યાત્રા પૂર્ણ!",
    },
    emergencyContact: {
      en: "Emergency Contact",
      gu: "ઇમરજન્સી સંપર્ક",
    },
    medicalInfo: {
      en: "Medical Information",
      gu: "તબીબી માહિતી",
    },
    bloodGroup: {
      en: "Blood Group",
      gu: "બ્લડ ગ્રુપ",
    },
    medicalConditions: {
      en: "Medical Conditions",
      gu: "તબીબી સ્થિતિઓ",
    },
    allergies: {
      en: "Allergies",
      gu: "એલર્જી",
    },
    medications: {
      en: "Current Medications",
      gu: "વર્તમાન દવાઓ",
    },
    quickActions: {
      en: "Quick Actions",
      gu: "ઝડપી ક્રિયાઓ",
    },
    callPilgrim: {
      en: "Call Pilgrim",
      gu: "યાત્રાળુને કૉલ કરો",
    },
    viewQRCard: {
      en: "View QR Card",
      gu: "QR કાર્ડ જુઓ",
    },
    recentActivity: {
      en: "Recent Activity",
      gu: "તાજેતરની પ્રવૃત્તિ",
    },
    call: {
      en: "Call",
      gu: "કૉલ",
    },
  },

  // QR Card
  qrCard: {
    title: {
      en: "QR Card",
      gu: "QR કાર્ડ",
    },
    pilgrimId: {
      en: "Pilgrim ID",
      gu: "યાત્રાળુ ID",
    },
    scanAtCheckpoint: {
      en: "Scan this QR code at each checkpoint",
      gu: "દરેક ચેકપોઇન્ટ પર આ QR કોડ સ્કેન કરો",
    },
    shareAsImage: {
      en: "Share as Image",
      gu: "ઇમેજ તરીકે શેર કરો",
    },
    exportForPrint: {
      en: "Export for Print",
      gu: "પ્રિન્ટ માટે નિકાસ કરો",
    },
  },

  // Reports Screen
  reports: {
    title: {
      en: "Reports",
      gu: "રિપોર્ટ્સ",
    },
    subtitle: {
      en: "Pilgrimage progress and statistics",
      gu: "યાત્રા પ્રગતિ અને આંકડા",
    },
    completionRate: {
      en: "Completion Rate",
      gu: "પૂર્ણતા દર",
    },
    checkpointProgress: {
      en: "Checkpoint Progress",
      gu: "ચેકપોઇન્ટ પ્રગતિ",
    },
    exportReport: {
      en: "Export Report (CSV)",
      gu: "રિપોર્ટ નિકાસ કરો (CSV)",
    },
    exporting: {
      en: "Exporting...",
      gu: "નિકાસ થઈ રહ્યું છે...",
    },
  },

  // Settings Screen
  settings: {
    title: {
      en: "Settings",
      gu: "સેટિંગ્સ",
    },
    language: {
      en: "Language",
      gu: "ભાષા",
    },
    english: {
      en: "English",
      gu: "અંગ્રેજી",
    },
    gujarati: {
      en: "Gujarati",
      gu: "ગુજરાતી",
    },
    appearance: {
      en: "Appearance",
      gu: "દેખાવ",
    },
    darkMode: {
      en: "Dark Mode",
      gu: "ડાર્ક મોડ",
    },
    notifications: {
      en: "Notifications",
      gu: "સૂચનાઓ",
    },
    sound: {
      en: "Sound",
      gu: "અવાજ",
    },
    hapticFeedback: {
      en: "Haptic Feedback",
      gu: "હેપ્ટિક ફીડબેક",
    },
    dataManagement: {
      en: "Data Management",
      gu: "ડેટા મેનેજમેન્ટ",
    },
    importData: {
      en: "Import Data",
      gu: "ડેટા આયાત કરો",
    },
    exportData: {
      en: "Export Data",
      gu: "ડેટા નિકાસ કરો",
    },
    googleSheets: {
      en: "Google Sheets Sync",
      gu: "Google Sheets સિંક",
    },
    dangerZone: {
      en: "Danger Zone",
      gu: "ખતરનાક ઝોન",
    },
    clearAllData: {
      en: "Clear All Data",
      gu: "બધો ડેટા સાફ કરો",
    },
    clearDataWarning: {
      en: "This will permanently delete all pilgrim data and scan logs. This action cannot be undone.",
      gu: "આ બધા યાત્રાળુ ડેટા અને સ્કેન લોગ્સને કાયમી ધોરણે કાઢી નાખશે. આ ક્રિયા પૂર્વવત્ કરી શકાતી નથી.",
    },
    about: {
      en: "About",
      gu: "વિશે",
    },
    version: {
      en: "Version",
      gu: "વર્ઝન",
    },
  },

  // Offline Banner
  offline: {
    title: {
      en: "You're Offline",
      gu: "તમે ઑફલાઇન છો",
    },
    message: {
      en: "Scans will be saved locally and synced when connected",
      gu: "સ્કેન સ્થાનિક રીતે સાચવવામાં આવશે અને કનેક્ટ થયા પછી સિંક થશે",
    },
  },

  // Add Participant Modal
  addParticipant: {
    title: {
      en: "Add New Pilgrim",
      gu: "નવા યાત્રાળુ ઉમેરો",
    },
    name: {
      en: "Full Name",
      gu: "પૂરું નામ",
    },
    namePlaceholder: {
      en: "Enter pilgrim's full name",
      gu: "યાત્રાળુનું પૂરું નામ દાખલ કરો",
    },
    mobile: {
      en: "Mobile Number",
      gu: "મોબાઇલ નંબર",
    },
    mobilePlaceholder: {
      en: "Enter 10-digit mobile number",
      gu: "10-અંકનો મોબાઇલ નંબર દાખલ કરો",
    },
    emergencyContact: {
      en: "Emergency Contact",
      gu: "ઇમરજન્સી સંપર્ક",
    },
    emergencyContactName: {
      en: "Emergency Contact Name",
      gu: "ઇમરજન્સી સંપર્ક નામ",
    },
    emergencyContactRelation: {
      en: "Relation",
      gu: "સંબંધ",
    },
    bloodGroup: {
      en: "Blood Group",
      gu: "બ્લડ ગ્રુપ",
    },
    medicalConditions: {
      en: "Medical Conditions (if any)",
      gu: "તબીબી સ્થિતિઓ (જો કોઈ હોય)",
    },
    allergies: {
      en: "Allergies (if any)",
      gu: "એલર્જી (જો કોઈ હોય)",
    },
    medications: {
      en: "Current Medications",
      gu: "વર્તમાન દવાઓ",
    },
    addPilgrim: {
      en: "Add Pilgrim",
      gu: "યાત્રાળુ ઉમેરો",
    },
  },

  // Checkpoints
  checkpoints: {
    cp1: {
      en: "Taleti (Base)",
      gu: "તળેટી (બેઝ)",
    },
    cp2: {
      en: "Ram Pol",
      gu: "રામ પોળ",
    },
    cp3: {
      en: "Chaumukh Temple",
      gu: "ચૌમુખ મંદિર",
    },
    cp4: {
      en: "Adishwar Temple",
      gu: "આદિશ્વર મંદિર",
    },
    cp5: {
      en: "Kumarpal Temple",
      gu: "કુમારપાળ મંદિર",
    },
    cp6: {
      en: "Vimalshah Temple",
      gu: "વિમલશાહ મંદિર",
    },
    cp7: {
      en: "Sampriti Raja Temple",
      gu: "સંપ્રતિ રાજા મંદિર",
    },
    cp8: {
      en: "Summit (Shikhar)",
      gu: "શિખર",
    },
    cp9: {
      en: "Shikhar Descent Start",
      gu: "શિખર ઉતરાણ શરૂ",
    },
    cp10: {
      en: "Motisha Tunk",
      gu: "મોતીશા ટૂંક",
    },
    cp11: {
      en: "Sahasrakut Temple",
      gu: "સહસ્રકૂટ મંદિર",
    },
    cp12: {
      en: "Balabhai Tunk",
      gu: "બાલાભાઈ ટૂંક",
    },
    cp13: {
      en: "Hathipol Gate",
      gu: "હાથીપોળ ગેટ",
    },
    cp14: {
      en: "Gaumukhi Ganga",
      gu: "ગૌમુખી ગંગા",
    },
    cp15: {
      en: "Angar Pir",
      gu: "અંગાર પીર",
    },
    cp16: {
      en: "Taleti Return",
      gu: "તળેટી પરત",
    },
  },

  // Bulk Import
  bulkImport: {
    title: {
      en: "Bulk Import",
      gu: "બલ્ક આયાત",
    },
    selectFile: {
      en: "Select File",
      gu: "ફાઇલ પસંદ કરો",
    },
    supportedFormats: {
      en: "Supported formats: CSV, Excel (.xlsx)",
      gu: "સપોર્ટેડ ફોર્મેટ્સ: CSV, Excel (.xlsx)",
    },
    downloadTemplate: {
      en: "Download Template",
      gu: "ટેમ્પલેટ ડાઉનલોડ કરો",
    },
    preview: {
      en: "Preview",
      gu: "પૂર્વાવલોકન",
    },
    validRows: {
      en: "Valid Rows",
      gu: "માન્ય પંક્તિઓ",
    },
    errors: {
      en: "Errors",
      gu: "ભૂલો",
    },
    duplicates: {
      en: "Duplicates",
      gu: "ડુપ્લિકેટ્સ",
    },
    importNow: {
      en: "Import Now",
      gu: "હવે આયાત કરો",
    },
    importing: {
      en: "Importing...",
      gu: "આયાત થઈ રહ્યું છે...",
    },
    importComplete: {
      en: "Import Complete",
      gu: "આયાત પૂર્ણ",
    },
    pilgrimsImported: {
      en: "pilgrims imported successfully",
      gu: "યાત્રાળુઓ સફળતાપૂર્વક આયાત થયા",
    },
    noFileSelected: {
      en: "No file selected",
      gu: "કોઈ ફાઇલ પસંદ કરેલ નથી",
    },
    invalidFile: {
      en: "Invalid file format",
      gu: "અમાન્ય ફાઇલ ફોર્મેટ",
    },
    rowNumber: {
      en: "Row",
      gu: "પંક્તિ",
    },
  },

  // Alerts and Confirmations
  alerts: {
    deleteConfirm: {
      en: "Are you sure you want to delete this?",
      gu: "શું તમે ખરેખર આને કાઢી નાખવા માંગો છો?",
    },
    clearDataConfirm: {
      en: "Are you sure you want to clear all data?",
      gu: "શું તમે ખરેખર બધો ડેટા સાફ કરવા માંગો છો?",
    },
    dataCleared: {
      en: "All data has been cleared",
      gu: "બધો ડેટા સાફ થઈ ગયો છે",
    },
    exportSuccess: {
      en: "Export successful",
      gu: "નિકાસ સફળ",
    },
    exportFailed: {
      en: "Export failed",
      gu: "નિકાસ નિષ્ફળ",
    },
    importSuccess: {
      en: "Import successful",
      gu: "આયાત સફળ",
    },
    importFailed: {
      en: "Import failed",
      gu: "આયાત નિષ્ફળ",
    },
    pilgrimAdded: {
      en: "Pilgrim added successfully",
      gu: "યાત્રાળુ સફળતાપૂર્વક ઉમેરાયા",
    },
    pilgrimUpdated: {
      en: "Pilgrim updated successfully",
      gu: "યાત્રાળુ સફળતાપૂર્વક અપડેટ થયા",
    },
    pilgrimDeleted: {
      en: "Pilgrim deleted successfully",
      gu: "યાત્રાળુ સફળતાપૂર્વક કાઢી નાખવામાં આવ્યા",
    },
  },
} as const;

// Helper type for translation keys
export type TranslationKey = keyof typeof translations;
export type TranslationSection<K extends TranslationKey> = keyof typeof translations[K];
