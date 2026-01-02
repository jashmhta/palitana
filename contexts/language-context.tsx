/**
 * Language Context
 * Multi-language support for English, Hindi, and Gujarati
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "hi" | "gu";

interface Translations {
  // Common
  app_name: string;
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  done: string;
  search: string;
  refresh: string;
  
  // Navigation
  nav_scanner: string;
  nav_checkpoints: string;
  nav_pilgrims: string;
  nav_reports: string;
  nav_settings: string;
  
  // Scanner
  scanner_title: string;
  scanner_select_checkpoint: string;
  scanner_tap_to_scan: string;
  scanner_scanning: string;
  scanner_success: string;
  scanner_not_found: string;
  scanner_already_scanned: string;
  scanner_recent_scans: string;
  
  // Checkpoints
  checkpoints_title: string;
  checkpoints_day1: string;
  checkpoints_day2: string;
  checkpoints_progress: string;
  
  // Pilgrims
  pilgrims_title: string;
  pilgrims_add_new: string;
  pilgrims_search_placeholder: string;
  pilgrims_completed: string;
  pilgrims_in_progress: string;
  pilgrims_not_started: string;
  pilgrims_total: string;
  
  // Reports
  reports_title: string;
  reports_overview: string;
  reports_export_csv: string;
  reports_completion_rate: string;
  
  // Settings
  settings_title: string;
  settings_language: string;
  settings_google_sheets: string;
  settings_volunteer: string;
  settings_about: string;
  settings_sync: string;
  
  // Onboarding
  onboarding_welcome: string;
  onboarding_welcome_desc: string;
  onboarding_scan: string;
  onboarding_scan_title: string;
  onboarding_scan_desc: string;
  onboarding_track: string;
  onboarding_track_title: string;
  onboarding_track_desc: string;
  onboarding_offline_title: string;
  onboarding_offline_desc: string;
  onboarding_ready_title: string;
  onboarding_ready_desc: string;
  onboarding_start: string;
  onboarding_skip: string;
  onboarding_next: string;
  
  // Day Picker
  day_picker_day1: string;
  day_picker_day2: string;
  day_picker_ascent: string;
  day_picker_descent: string;
  day_picker_all_days: string;
  
  // Participant Detail
  participant_progress: string;
  participant_checkpoints: string;
  participant_scanned: string;
  participant_remaining: string;
  participant_yatra_completed: string;
  participant_emergency_contact: string;
  participant_medical_info: string;
  participant_blood_group: string;
  participant_medical_conditions: string;
  participant_allergies: string;
  participant_medications: string;
  participant_quick_actions: string;
  participant_call_pilgrim: string;
  participant_view_qr: string;
  participant_call: string;
  
  // QR Card
  qr_card_title: string;
  qr_card_pilgrim_id: string;
  qr_card_scan_instruction: string;
  qr_card_share_image: string;
  qr_card_export_print: string;
  
  // Offline
  offline_title: string;
  offline_message: string;
  
  // Missing Pilgrim Alerts
  alert_missing_pilgrims: string;
  alert_not_scanned: string;
  alert_expected_at: string;
  alert_last_seen: string;
  alert_hours_ago: string;
  alert_view_details: string;
  
  // Group/Family Tracking
  group_title: string;
  group_family_group: string;
  group_members: string;
  group_all_present: string;
  group_missing_members: string;
  group_add_to_group: string;
  group_create_group: string;
  group_remove_from_group: string;
  
  // Volunteer Management
  volunteer_title: string;
  volunteer_name: string;
  volunteer_checkpoint: string;
  volunteer_shift_start: string;
  volunteer_shift_end: string;
  volunteer_scans_today: string;
  volunteer_set_name: string;
  volunteer_current_shift: string;
  
  // Alerts
  alert_delete_confirm: string;
  alert_clear_data_confirm: string;
  alert_data_cleared: string;
  alert_export_success: string;
  alert_export_failed: string;
  alert_pilgrim_added: string;
  alert_pilgrim_updated: string;
  
  // Settings extras
  settings_auto_sync: string;
  settings_auto_sync_desc: string;
  settings_not_configured: string;
  settings_participants: string;
  settings_registered: string;
  settings_total_scans: string;
  settings_add_participant: string;
  settings_device: string;
  settings_device_id: string;
  settings_danger_zone: string;
  settings_clear_all_data: string;
  settings_clear_confirm: string;
  settings_export_qr: string;
  settings_online: string;
  settings_offline: string;
  settings_pending: string;
  
  // Additional translations
  checkpoints_subtitle: string;
  checkpoints_active: string;
  checkpoints_scans: string;
  checkpoints_no_scans: string;
  pilgrims_registered: string;
  pilgrims_export_all: string;
  day1_ascent: string;
  day2_descent: string;
  checkpoints_all: string;
  no_scans_yet: string;
  active: string;
  scan_from_gallery: string;
  or_scan_from_gallery: string;
  just_now: string;
  
  // Bulk Import
  bulk_import_title: string;
  bulk_import_select_file: string;
  bulk_import_supported_formats: string;
  bulk_import_download_template: string;
  bulk_import_preview: string;
  bulk_import_valid_rows: string;
  bulk_import_errors: string;
  bulk_import_duplicates: string;
  bulk_import_now: string;
  bulk_import_importing: string;
  bulk_import_complete: string;
  bulk_import_pilgrims_imported: string;
  bulk_import_no_file: string;
  bulk_import_invalid_file: string;
  bulk_import_row: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    app_name: "Palitana Yatra",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    done: "Done",
    search: "Search",
    refresh: "Refresh",
    
    nav_scanner: "Scanner",
    nav_checkpoints: "Checkpoints",
    nav_pilgrims: "Pilgrims",
    nav_reports: "Reports",
    nav_settings: "Settings",
    
    scanner_title: "QR Scanner",
    scanner_select_checkpoint: "Select Checkpoint",
    scanner_tap_to_scan: "Tap to Scan QR Code",
    scanner_scanning: "Scanning...",
    scanner_success: "Scan Successful!",
    scanner_not_found: "Pilgrim not found",
    scanner_already_scanned: "Already scanned at this checkpoint",
    scanner_recent_scans: "Recent Scans",
    
    checkpoints_title: "Checkpoints",
    checkpoints_day1: "Day 1",
    checkpoints_day2: "Day 2",
    checkpoints_progress: "Progress",
    
    pilgrims_title: "Pilgrims",
    pilgrims_add_new: "Add New Pilgrim",
    pilgrims_search_placeholder: "Search by name, mobile, or QR...",
    pilgrims_completed: "Completed",
    pilgrims_in_progress: "In Progress",
    pilgrims_not_started: "Not Started",
    pilgrims_total: "Total",
    
    reports_title: "Reports",
    reports_overview: "Overview",
    reports_export_csv: "Export CSV",
    reports_completion_rate: "Completion Rate",
    
    settings_title: "Settings",
    settings_language: "Language",
    settings_google_sheets: "Google Sheets",
    settings_volunteer: "Volunteer",
    settings_about: "About",
    settings_sync: "Sync",
    
    onboarding_welcome: "Welcome to Palitana Yatra",
    onboarding_welcome_desc: "Experience the sacred journey to the holy Shatrunjaya Hill with 863 magnificent Jain temples. Track your pilgrimage across 3 checkpoints.",
    onboarding_scan: "Scan pilgrim QR codes at each checkpoint",
    onboarding_scan_title: "Easy QR Scanning",
    onboarding_scan_desc: "Simply scan each pilgrim's QR code at checkpoints. The app automatically records their progress through the yatra.",
    onboarding_track: "Track progress in real-time",
    onboarding_track_title: "Real-time Tracking",
    onboarding_track_desc: "Monitor pilgrim progress across all 3 checkpoints. See who has completed which stages of the sacred journey.",
    onboarding_offline_title: "Works Offline",
    onboarding_offline_desc: "No internet? No problem! All scans are saved locally and sync automatically when you're back online.",
    onboarding_ready_title: "Ready to Begin",
    onboarding_ready_desc: "You're all set! Start scanning pilgrims at your assigned checkpoint and help track their sacred journey.",
    onboarding_start: "Get Started",
    onboarding_skip: "Skip",
    onboarding_next: "Next",
    
    day_picker_day1: "Day 1",
    day_picker_day2: "Day 2",
    day_picker_ascent: "Ascent",
    day_picker_descent: "Descent",
    day_picker_all_days: "All Days",
    
    participant_progress: "Progress",
    participant_checkpoints: "Checkpoints",
    participant_scanned: "Scanned",
    participant_remaining: "Remaining",
    participant_yatra_completed: "Yatra Completed!",
    participant_emergency_contact: "Emergency Contact",
    participant_medical_info: "Medical Information",
    participant_blood_group: "Blood Group",
    participant_medical_conditions: "Medical Conditions",
    participant_allergies: "Allergies",
    participant_medications: "Current Medications",
    participant_quick_actions: "Quick Actions",
    participant_call_pilgrim: "Call Pilgrim",
    participant_view_qr: "View QR Card",
    participant_call: "Call",
    
    qr_card_title: "QR Card",
    qr_card_pilgrim_id: "Pilgrim ID",
    qr_card_scan_instruction: "Tap the orange button below to scan pilgrim QR codes",
    qr_card_share_image: "Share as Image",
    qr_card_export_print: "Export for Print",
    
    offline_title: "You're Offline",
    offline_message: "Scans will be saved locally and synced when connected",
    
    alert_missing_pilgrims: "Missing Pilgrims",
    alert_not_scanned: "Not scanned at expected checkpoint",
    alert_expected_at: "Expected at",
    alert_last_seen: "Last seen at",
    alert_hours_ago: "hours ago",
    alert_view_details: "View Details",
    
    group_title: "Groups",
    group_family_group: "Family Group",
    group_members: "Members",
    group_all_present: "All Present",
    group_missing_members: "Missing Members",
    group_add_to_group: "Add to Group",
    group_create_group: "Create Group",
    group_remove_from_group: "Remove from Group",
    
    volunteer_title: "Volunteer",
    volunteer_name: "Volunteer Name",
    volunteer_checkpoint: "Assigned Checkpoint",
    volunteer_shift_start: "Shift Start",
    volunteer_shift_end: "Shift End",
    volunteer_scans_today: "Scans Today",
    volunteer_set_name: "Set Your Name",
    volunteer_current_shift: "Current Shift",
    
    alert_delete_confirm: "Are you sure you want to delete this?",
    alert_clear_data_confirm: "Are you sure you want to clear all data?",
    alert_data_cleared: "All data has been cleared",
    alert_export_success: "Export successful",
    alert_export_failed: "Export failed",
    alert_pilgrim_added: "Pilgrim added successfully",
    alert_pilgrim_updated: "Pilgrim updated successfully",
    
    settings_auto_sync: "Auto-sync",
    settings_auto_sync_desc: "Sync automatically when online",
    settings_not_configured: "Not configured",
    settings_participants: "Participants",
    settings_registered: "Registered",
    settings_total_scans: "Total Scans",
    settings_add_participant: "Add Participant",
    settings_device: "Device",
    settings_device_id: "Device ID",
    settings_danger_zone: "Danger Zone",
    settings_clear_all_data: "Clear All Data",
    settings_clear_confirm: "This will delete all participants, scan logs, and reset settings. This action cannot be undone.",
    settings_export_qr: "Export All QR Cards",
    settings_online: "Online",
    settings_offline: "Offline",
    settings_pending: "pending",
    
    checkpoints_subtitle: "3 checkpoints across the pilgrimage",
    checkpoints_active: "Active",
    checkpoints_scans: "Scans",
    checkpoints_no_scans: "No scans yet",
    pilgrims_registered: "registered participants",
    pilgrims_export_all: "Export All QR Cards",
    day1_ascent: "Day 1 - Ascent",
    day2_descent: "Day 2 - Descent",
    checkpoints_all: "All Checkpoints",
    no_scans_yet: "No scans yet",
    active: "Active",
    scan_from_gallery: "Scan from Gallery",
    or_scan_from_gallery: "Or scan from gallery",
    just_now: "Just now",
    
    // Bulk Import
    bulk_import_title: "Bulk Import",
    bulk_import_select_file: "Select File",
    bulk_import_supported_formats: "Supported formats: CSV, Excel (.xlsx)",
    bulk_import_download_template: "Download Template",
    bulk_import_preview: "Preview",
    bulk_import_valid_rows: "Valid Rows",
    bulk_import_errors: "Errors",
    bulk_import_duplicates: "Duplicates",
    bulk_import_now: "Import Now",
    bulk_import_importing: "Importing...",
    bulk_import_complete: "Import Complete",
    bulk_import_pilgrims_imported: "pilgrims imported successfully",
    bulk_import_no_file: "No file selected",
    bulk_import_invalid_file: "Invalid file format",
    bulk_import_row: "Row",
  },
  hi: {
    app_name: "पालीताना यात्रा",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफल",
    cancel: "रद्द करें",
    save: "सहेजें",
    delete: "हटाएं",
    edit: "संपादित करें",
    done: "हो गया",
    search: "खोजें",
    refresh: "रिफ्रेश",
    
    nav_scanner: "स्कैनर",
    nav_checkpoints: "चेकपॉइंट",
    nav_pilgrims: "यात्री",
    nav_reports: "रिपोर्ट",
    nav_settings: "सेटिंग्स",
    
    scanner_title: "QR स्कैनर",
    scanner_select_checkpoint: "चेकपॉइंट चुनें",
    scanner_tap_to_scan: "QR कोड स्कैन करने के लिए टैप करें",
    scanner_scanning: "स्कैन हो रहा है...",
    scanner_success: "स्कैन सफल!",
    scanner_not_found: "यात्री नहीं मिला",
    scanner_already_scanned: "इस चेकपॉइंट पर पहले से स्कैन किया गया",
    scanner_recent_scans: "हाल के स्कैन",
    
    checkpoints_title: "चेकपॉइंट",
    checkpoints_day1: "दिन 1",
    checkpoints_day2: "दिन 2",
    checkpoints_progress: "प्रगति",
    
    pilgrims_title: "यात्री",
    pilgrims_add_new: "नया यात्री जोड़ें",
    pilgrims_search_placeholder: "नाम, मोबाइल या QR से खोजें...",
    pilgrims_completed: "पूर्ण",
    pilgrims_in_progress: "प्रगति में",
    pilgrims_not_started: "शुरू नहीं हुआ",
    pilgrims_total: "कुल",
    
    reports_title: "रिपोर्ट",
    reports_overview: "अवलोकन",
    reports_export_csv: "CSV निर्यात करें",
    reports_completion_rate: "पूर्णता दर",
    
    settings_title: "सेटिंग्स",
    settings_language: "भाषा",
    settings_google_sheets: "गूगल शीट्स",
    settings_volunteer: "स्वयंसेवक",
    settings_about: "के बारे में",
    settings_sync: "सिंक",
    
    onboarding_welcome: "पालीताना यात्रा में आपका स्वागत है",
    onboarding_welcome_desc: "पवित्र शत्रुंजय पहाड़ी की यात्रा का अनुभव करें जहां 863 भव्य जैन मंदिर हैं। 3 चेकपॉइंट्स पर अपनी तीर्थयात्रा ट्रैक करें।",
    onboarding_scan: "प्रत्येक चेकपॉइंट पर यात्री QR कोड स्कैन करें",
    onboarding_scan_title: "आसान QR स्कैनिंग",
    onboarding_scan_desc: "चेकपॉइंट्स पर प्रत्येक यात्री का QR कोड स्कैन करें। ऐप स्वचालित रूप से यात्रा में उनकी प्रगति रिकॉर्ड करता है।",
    onboarding_track: "वास्तविक समय में प्रगति ट्रैक करें",
    onboarding_track_title: "रियल-टाइम ट्रैकिंग",
    onboarding_track_desc: "सभी 3 चेकपॉइंट्स पर यात्रियों की प्रगति देखें। जानें किसने पवित्र यात्रा के कौन से चरण पूरे किए हैं।",
    onboarding_offline_title: "ऑफलाइन काम करता है",
    onboarding_offline_desc: "इंटरनेट नहीं? कोई समस्या नहीं! सभी स्कैन स्थानीय रूप से सहेजे जाते हैं और ऑनलाइन होने पर स्वचालित सिंक होते हैं।",
    onboarding_ready_title: "शुरू करने के लिए तैयार",
    onboarding_ready_desc: "आप तैयार हैं! अपने निर्धारित चेकपॉइंट पर यात्रियों को स्कैन करना शुरू करें और उनकी पवित्र यात्रा ट्रैक करने में मदद करें।",
    onboarding_start: "शुरू करें",
    onboarding_skip: "छोड़ें",
    onboarding_next: "आगे",
    
    day_picker_day1: "दिन 1",
    day_picker_day2: "दिन 2",
    day_picker_ascent: "चढ़ाई",
    day_picker_descent: "उतराई",
    day_picker_all_days: "सभी दिन",
    
    participant_progress: "प्रगति",
    participant_checkpoints: "चेकपॉइंट",
    participant_scanned: "स्कैन किया",
    participant_remaining: "शेष",
    participant_yatra_completed: "यात्रा पूर्ण!",
    participant_emergency_contact: "आपातकालीन संपर्क",
    participant_medical_info: "चिकित्सा जानकारी",
    participant_blood_group: "रक्त समूह",
    participant_medical_conditions: "चिकित्सा स्थितियां",
    participant_allergies: "एलर्जी",
    participant_medications: "वर्तमान दवाएं",
    participant_quick_actions: "त्वरित कार्य",
    participant_call_pilgrim: "यात्री को कॉल करें",
    participant_view_qr: "QR कार्ड देखें",
    participant_call: "कॉल",
    
    qr_card_title: "QR कार्ड",
    qr_card_pilgrim_id: "यात्री ID",
    qr_card_scan_instruction: "तीर्थयात्री QR कोड स्कैन करने के लिए नीचे नारंगी बटन दबाएं",
    qr_card_share_image: "छवि के रूप में साझा करें",
    qr_card_export_print: "प्रिंट के लिए निर्यात करें",
    
    offline_title: "आप ऑफलाइन हैं",
    offline_message: "स्कैन स्थानीय रूप से सहेजे जाएंगे और कनेक्ट होने पर सिंक होंगे",
    
    alert_missing_pilgrims: "लापता यात्री",
    alert_not_scanned: "अपेक्षित चेकपॉइंट पर स्कैन नहीं किया",
    alert_expected_at: "अपेक्षित स्थान",
    alert_last_seen: "अंतिम बार देखा गया",
    alert_hours_ago: "घंटे पहले",
    alert_view_details: "विवरण देखें",
    
    group_title: "समूह",
    group_family_group: "परिवार समूह",
    group_members: "सदस्य",
    group_all_present: "सभी उपस्थित",
    group_missing_members: "लापता सदस्य",
    group_add_to_group: "समूह में जोड़ें",
    group_create_group: "समूह बनाएं",
    group_remove_from_group: "समूह से हटाएं",
    
    volunteer_title: "स्वयंसेवक",
    volunteer_name: "स्वयंसेवक का नाम",
    volunteer_checkpoint: "नियुक्त चेकपॉइंट",
    volunteer_shift_start: "शिफ्ट शुरू",
    volunteer_shift_end: "शिफ्ट समाप्त",
    volunteer_scans_today: "आज के स्कैन",
    volunteer_set_name: "अपना नाम सेट करें",
    volunteer_current_shift: "वर्तमान शिफ्ट",
    
    alert_delete_confirm: "क्या आप वाकई इसे हटाना चाहते हैं?",
    alert_clear_data_confirm: "क्या आप वाकई सभी डेटा साफ करना चाहते हैं?",
    alert_data_cleared: "सभी डेटा साफ कर दिया गया है",
    alert_export_success: "निर्यात सफल",
    alert_export_failed: "निर्यात विफल",
    alert_pilgrim_added: "यात्री सफलतापूर्वक जोड़ा गया",
    alert_pilgrim_updated: "यात्री सफलतापूर्वक अपडेट किया गया",
    
    settings_auto_sync: "ऑटो-सिंक",
    settings_auto_sync_desc: "ऑनलाइन होने पर स्वचालित रूप से सिंक करें",
    settings_not_configured: "कॉन्फ़िगर नहीं किया गया",
    settings_participants: "प्रतिभागी",
    settings_registered: "पंजीकृत",
    settings_total_scans: "कुल स्कैन",
    settings_add_participant: "प्रतिभागी जोड़ें",
    settings_device: "डिवाइस",
    settings_device_id: "डिवाइस ID",
    settings_danger_zone: "खतरनाक क्षेत्र",
    settings_clear_all_data: "सभी डेटा साफ करें",
    settings_clear_confirm: "यह सभी प्रतिभागियों, स्कैन लॉग और सेटिंग्स को हटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।",
    settings_export_qr: "सभी QR कार्ड निर्यात करें",
    settings_online: "ऑनलाइन",
    settings_offline: "ऑफलाइन",
    settings_pending: "लंबित",
    
    checkpoints_subtitle: "तीर्थयात्रा में 3 चेकपॉइंट",
    checkpoints_active: "सक्रिय",
    checkpoints_scans: "स्कैन",
    checkpoints_no_scans: "अभी तक कोई स्कैन नहीं",
    pilgrims_registered: "पंजीकृत प्रतिभागी",
    pilgrims_export_all: "सभी QR कार्ड निर्यात करें",
    day1_ascent: "दिन 1 - चढ़ाई",
    day2_descent: "दिन 2 - उतराई",
    checkpoints_all: "सभी चेकपॉइंट",
    no_scans_yet: "अभी तक कोई स्कैन नहीं",
    active: "सक्रिय",
    scan_from_gallery: "गैलरी से स्कैन करें",
    or_scan_from_gallery: "या गैलरी से स्कैन करें",
    just_now: "अभी",
    
    // Bulk Import
    bulk_import_title: "बल्क आयात",
    bulk_import_select_file: "फ़ाइल चुनें",
    bulk_import_supported_formats: "समर्थित प्रारूप: CSV, Excel (.xlsx)",
    bulk_import_download_template: "टेम्पलेट डाउनलोड करें",
    bulk_import_preview: "पूर्वावलोकन",
    bulk_import_valid_rows: "मान्य पंक्तियाँ",
    bulk_import_errors: "त्रुटियाँ",
    bulk_import_duplicates: "डुप्लिकेट",
    bulk_import_now: "अभी आयात करें",
    bulk_import_importing: "आयात हो रहा है...",
    bulk_import_complete: "आयात पूर्ण",
    bulk_import_pilgrims_imported: "यात्री सफलतापूर्वक आयात हुए",
    bulk_import_no_file: "कोई फ़ाइल नहीं चुनी",
    bulk_import_invalid_file: "अमान्य फ़ाइल प्रारूप",
    bulk_import_row: "पंक्ति",
  },
  gu: {
    app_name: "પાલિતાણા યાત્રા",
    loading: "લોડ થઈ રહ્યું છે...",
    error: "ભૂલ",
    success: "સફળ",
    cancel: "રદ કરો",
    save: "સાચવો",
    delete: "કાઢી નાખો",
    edit: "સંપાદિત કરો",
    done: "થઈ ગયું",
    search: "શોધો",
    refresh: "રિફ્રેશ",
    
    nav_scanner: "સ્કેનર",
    nav_checkpoints: "ચેકપોઇન્ટ",
    nav_pilgrims: "યાત્રાળુઓ",
    nav_reports: "રિપોર્ટ",
    nav_settings: "સેટિંગ્સ",
    
    scanner_title: "QR સ્કેનર",
    scanner_select_checkpoint: "ચેકપોઇન્ટ પસંદ કરો",
    scanner_tap_to_scan: "QR કોડ સ્કેન કરવા ટેપ કરો",
    scanner_scanning: "સ્કેન થઈ રહ્યું છે...",
    scanner_success: "સ્કેન સફળ!",
    scanner_not_found: "યાત્રાળુ મળ્યો નથી",
    scanner_already_scanned: "આ ચેકપોઇન્ટ પર પહેલેથી સ્કેન થયેલ છે",
    scanner_recent_scans: "તાજેતરના સ્કેન",
    
    checkpoints_title: "ચેકપોઇન્ટ",
    checkpoints_day1: "દિવસ 1",
    checkpoints_day2: "દિવસ 2",
    checkpoints_progress: "પ્રગતિ",
    
    pilgrims_title: "યાત્રાળુઓ",
    pilgrims_add_new: "નવા યાત્રાળુ ઉમેરો",
    pilgrims_search_placeholder: "નામ, મોબાઇલ અથવા QR દ્વારા શોધો...",
    pilgrims_completed: "પૂર્ણ",
    pilgrims_in_progress: "પ્રગતિમાં",
    pilgrims_not_started: "શરૂ થયું નથી",
    pilgrims_total: "કુલ",
    
    reports_title: "રિપોર્ટ",
    reports_overview: "ઝાંખી",
    reports_export_csv: "CSV નિકાસ કરો",
    reports_completion_rate: "પૂર્ણતા દર",
    
    settings_title: "સેટિંગ્સ",
    settings_language: "ભાષા",
    settings_google_sheets: "ગૂગલ શીટ્સ",
    settings_volunteer: "સ્વયંસેવક",
    settings_about: "વિશે",
    settings_sync: "સિંક",
    
    onboarding_welcome: "પાલિતાણા યાત્રામાં આપનું સ્વાગત છે",
    onboarding_welcome_desc: "પવિત્ર શત્રુંજય પહાડીની યાત્રાનો અનુભવ કરો જ્યાં 863 ભવ્ય જૈન મંદિરો છે. 3 ચેકપોઇન્ટ્સ પર તમારી તીર્થયાત્રા ટ્રેક કરો.",
    onboarding_scan: "દરેક ચેકપોઇન્ટ પર યાત્રાળુ QR કોડ સ્કેન કરો",
    onboarding_scan_title: "સરળ QR સ્કેનિંગ",
    onboarding_scan_desc: "ચેકપોઇન્ટ્સ પર દરેક યાત્રાળુનો QR કોડ સ્કેન કરો. ઐપ આપોઆપ યાત્રામાં તેમની પ્રગતિ રેકોર્ડ કરે છે.",
    onboarding_track: "રીઅલ-ટાઇમમાં પ્રગતિ ટ્રેક કરો",
    onboarding_track_title: "રીઅલ-ટાઇમ ટ્રેકિંગ",
    onboarding_track_desc: "બધા 3 ચેકપોઇન્ટ્સ પર યાત્રાળુઓની પ્રગતિ જુઓ. જાણો કોણે પવિત્ર યાત્રાના કયા તબક્કા પૂરા કર્યા છે.",
    onboarding_offline_title: "ઑફલાઇન કામ કરે છે",
    onboarding_offline_desc: "ઇન્ટરનેટ નથી? કોઈ સમસ્યા નથી! બધા સ્કેન સ્થાનિક રીતે સચવાય છે અને ઑનલાઇન થતાં આપોઆપ સિંક થાય છે.",
    onboarding_ready_title: "શરૂ કરવા તૈયાર",
    onboarding_ready_desc: "તમે તૈયાર છો! તમારા નિર્ધારિત ચેકપોઇન્ટ પર યાત્રાળુઓને સ્કેન કરવાનું શરૂ કરો અને તેમની પવિત્ર યાત્રા ટ્રેક કરવામાં મદદ કરો.",
    onboarding_start: "શરૂ કરો",
    onboarding_skip: "છોડો",
    onboarding_next: "આગળ",
    
    day_picker_day1: "દિવસ 1",
    day_picker_day2: "દિવસ 2",
    day_picker_ascent: "ચઢાણ",
    day_picker_descent: "ઉતરાણ",
    day_picker_all_days: "બધા દિવસો",
    
    participant_progress: "પ્રગતિ",
    participant_checkpoints: "ચેકપોઇન્ટ્સ",
    participant_scanned: "સ્કેન થયેલ",
    participant_remaining: "બાકી",
    participant_yatra_completed: "યાત્રા પૂર્ણ!",
    participant_emergency_contact: "ઇમર્જન્સી સંપર્ક",
    participant_medical_info: "તબીબી માહિતી",
    participant_blood_group: "બ્લડ ગ્રુપ",
    participant_medical_conditions: "તબીબી સ્થિતિઓ",
    participant_allergies: "એલર્જી",
    participant_medications: "વર્તમાન દવાઓ",
    participant_quick_actions: "ઝડપી ક્રિયાઓ",
    participant_call_pilgrim: "યાત્રાળુને કૉલ કરો",
    participant_view_qr: "QR કાર્ડ જુઓ",
    participant_call: "કૉલ",
    
    qr_card_title: "QR કાર્ડ",
    qr_card_pilgrim_id: "યાત્રાળુ ID",
    qr_card_scan_instruction: "યાત્રાળુ QR કોડ સ્કેન કરવા નીચે નારંગી બટન દબાવો",
    qr_card_share_image: "ઇમેજ તરીકે શેર કરો",
    qr_card_export_print: "પ્રિન્ટ માટે નિકાસ કરો",
    
    offline_title: "તમે ઑફલાઇન છો",
    offline_message: "સ્કેન સ્થાનિક રીતે સાચવવામાં આવશે અને કનેક્ટ થયા પછી સિંક થશે",
    
    alert_missing_pilgrims: "ગુમ થયેલા યાત્રાળુઓ",
    alert_not_scanned: "અપેક્ષિત ચેકપોઇન્ટ પર સ્કેન નથી",
    alert_expected_at: "અપેક્ષિત સ્થળ",
    alert_last_seen: "છેલ્લે જોયેલ",
    alert_hours_ago: "કલાક પહેલાં",
    alert_view_details: "વિગતો જુઓ",
    
    group_title: "જૂથો",
    group_family_group: "કુટુંબ જૂથ",
    group_members: "સદસ્યો",
    group_all_present: "બધા હાજર",
    group_missing_members: "ગુમ થયેલા સદસ્યો",
    group_add_to_group: "જૂથમાં ઉમેરો",
    group_create_group: "જૂથ બનાવો",
    group_remove_from_group: "જૂથમાંથી કાઢો",
    
    volunteer_title: "સ્વયંસેવક",
    volunteer_name: "સ્વયંસેવકનું નામ",
    volunteer_checkpoint: "નિયુક્ત ચેકપોઇન્ટ",
    volunteer_shift_start: "શિફ્ટ શરૂ",
    volunteer_shift_end: "શિફ્ટ સમાપ્ત",
    volunteer_scans_today: "આજના સ્કેન",
    volunteer_set_name: "તમારું નામ સેટ કરો",
    volunteer_current_shift: "વર્તમાન શિફ્ટ",
    
    alert_delete_confirm: "શું તમે ખરેખર આને કાઢી નાખવા માંગો છો?",
    alert_clear_data_confirm: "શું તમે ખરેખર બધો ડેટા સાફ કરવા માંગો છો?",
    alert_data_cleared: "બધો ડેટા સાફ થઈ ગયો છે",
    alert_export_success: "નિકાસ સફળ",
    alert_export_failed: "નિકાસ નિષ્ફળ",
    alert_pilgrim_added: "યાત્રાળુ સફળતાપૂર્વક ઉમેરાયા",
    alert_pilgrim_updated: "યાત્રાળુ સફળતાપૂર્વક અપડેટ થયા",
    
    settings_auto_sync: "ઑટો-સિંક",
    settings_auto_sync_desc: "ઑનલાઇન હોય ત્યારે આપોઆપ સિંક કરો",
    settings_not_configured: "કોન્ફિગર નથી",
    settings_participants: "સહભાગીઓ",
    settings_registered: "નોંધાયેલ",
    settings_total_scans: "કુલ સ્કેન",
    settings_add_participant: "સહભાગી ઉમેરો",
    settings_device: "ડિવાઇસ",
    settings_device_id: "ડિવાઇસ ID",
    settings_danger_zone: "જોખમી ક્ષેત્ર",
    settings_clear_all_data: "બધો ડેટા સાફ કરો",
    settings_clear_confirm: "આ બધા સહભાગીઓ, સ્કેન લોગ અને સેટિંગ્સ કાઢી નાખશે. આ ક્રિયા પરત કરી શકાતી નથી.",
    settings_export_qr: "બધા QR કાર્ડ નિકાસ કરો",
    settings_online: "ઑનલાઇન",
    settings_offline: "ઑફલાઇન",
    settings_pending: "બાકી",
    
    checkpoints_subtitle: "યાત્રામાં 3 ચેકપોઇન્ટ",
    checkpoints_active: "સક્રિય",
    checkpoints_scans: "સ્કેન",
    checkpoints_no_scans: "હજુ સુધી કોઈ સ્કેન નથી",
    pilgrims_registered: "નોંધાયેલ સહભાગીઓ",
    pilgrims_export_all: "બધા QR કાર્ડ નિકાસ કરો",
    day1_ascent: "દિવસ 1 - ચઢાણ",
    day2_descent: "દિવસ 2 - ઉતરાણ",
    checkpoints_all: "બધા ચેકપોઇન્ટ",
    no_scans_yet: "હજુ સુધી કોઈ સ્કેન નથી",
    active: "સક્રિય",
    scan_from_gallery: "ગેલરીમાંથી સ્કેન કરો",
    or_scan_from_gallery: "અથવા ગેલરીમાંથી સ્કેન કરો",
    just_now: "હમણાં જ",
    
    // Bulk Import
    bulk_import_title: "બલ્ક આયાત",
    bulk_import_select_file: "ફાઇલ પસંદ કરો",
    bulk_import_supported_formats: "સમર્થિત ફોર્મેટ: CSV, Excel (.xlsx)",
    bulk_import_download_template: "ટેમ્પલેટ ડાઉનલોડ કરો",
    bulk_import_preview: "પૂર્વાવલોકન",
    bulk_import_valid_rows: "માન્ય પંક્તિઓ",
    bulk_import_errors: "ભૂલો",
    bulk_import_duplicates: "ડુપ્લિકેટ",
    bulk_import_now: "હવે આયાત કરો",
    bulk_import_importing: "આયાત થઈ રહ્યું છે...",
    bulk_import_complete: "આયાત પૂર્ણ",
    bulk_import_pilgrims_imported: "યાત્રાળુઓ સફળતાપૂર્વક આયાત થયા",
    bulk_import_no_file: "કોઈ ફાઇલ પસંદ કરેલ નથી",
    bulk_import_invalid_file: "અમાન્ય ફાઇલ ફોર્મેટ",
    bulk_import_row: "પંક્તિ",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "palitana_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load saved language
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && (saved === "en" || saved === "hi" || saved === "gu")) {
        setLanguageState(saved as Language);
      }
      setLoaded(true);
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  if (!loaded) return null;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  gu: "ગુજરાતી",
};
