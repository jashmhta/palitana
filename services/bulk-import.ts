/**
 * Bulk Import Service
 * Handles CSV and Excel file parsing for participant data import
 */

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import { Participant } from "@/types";
import { generateQRToken, generateParticipantId } from "@/utils/qr-token";

export interface ImportRow {
  name: string;
  mobile: string;
  group?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  notes?: string;
  bloodGroup?: string;
  age?: number;
  gender?: "male" | "female" | "other";
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportPreview {
  totalRows: number;
  validRows: ImportRow[];
  errors: ValidationError[];
  duplicates: { row: number; mobile: string }[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  participants: Participant[];
}

/**
 * Column name mappings (supports multiple variations)
 */
const COLUMN_MAPPINGS: Record<string, string[]> = {
  name: ["name", "participant name", "pilgrim name", "full name", "नाम", "નામ"],
  mobile: ["mobile", "phone", "mobile number", "phone number", "contact", "मोबाइल", "મોબાઇલ"],
  group: ["group", "family", "group name", "family name", "समूह", "ગ્રુપ"],
  emergencyContact: ["emergency contact", "emergency phone", "emergency mobile", "आपातकालीन संपर्क"],
  emergencyContactName: ["emergency name", "emergency contact name", "आपातकालीन नाम"],
  notes: ["notes", "remarks", "comments", "टिप्पणी", "નોંધ"],
  bloodGroup: ["blood group", "blood type", "रक्त समूह", "બ્લડ ગ્રુપ"],
  age: ["age", "उम्र", "ઉંમર"],
  gender: ["gender", "sex", "लिंग", "જાતિ"],
};

/**
 * Normalize column name for matching
 */
const normalizeColumnName = (name: string): string => {
  return name.toLowerCase().trim().replace(/[_-]/g, " ");
};

/**
 * Find the mapped field name for a column header
 */
const findFieldName = (header: string): string | null => {
  const normalized = normalizeColumnName(header);
  
  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
    if (variations.some(v => normalizeColumnName(v) === normalized)) {
      return field;
    }
  }
  
  return null;
};

/**
 * Validate a mobile number
 */
const isValidMobile = (mobile: string): boolean => {
  // Remove spaces and dashes
  const cleaned = mobile.replace(/[\s-]/g, "");
  // Indian mobile: 10 digits, optionally starting with +91 or 91
  const pattern = /^(\+91|91)?[6-9]\d{9}$/;
  return pattern.test(cleaned);
};

/**
 * Clean and format mobile number
 */
const formatMobile = (mobile: string): string => {
  const cleaned = mobile.replace(/[\s-]/g, "");
  // Remove country code prefix
  if (cleaned.startsWith("+91")) {
    return cleaned.slice(3);
  }
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  return cleaned;
};

/**
 * Parse CSV content into rows
 */
const parseCSV = (content: string): string[][] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const rows: string[][] = [];
  
  for (const line of lines) {
    // Handle quoted values with commas
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
};

/**
 * Parse Excel file content
 */
const parseExcel = (data: ArrayBuffer): string[][] => {
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
  return jsonData.filter(row => row.some(cell => cell !== undefined && cell !== ""));
};

/**
 * Pick a file from device storage
 */
export const pickImportFile = async (): Promise<{ uri: string; name: string; type: string } | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "text/csv",
        "text/comma-separated-values",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "*/*", // Fallback for files with incorrect MIME types
      ],
      copyToCacheDirectory: true,
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || "",
    };
  } catch (error) {
    console.error("[BulkImport] File picker error:", error);
    return null;
  }
};

/**
 * Read and parse file content
 */
export const parseImportFile = async (
  uri: string,
  fileName: string
): Promise<{ headers: string[]; rows: string[][] } | null> => {
  try {
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    
    if (isExcel) {
      // Read as base64 and convert to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const allRows = parseExcel(bytes.buffer);
      if (allRows.length < 2) {
        return null;
      }
      
      return {
        headers: allRows[0].map(h => String(h || "")),
        rows: allRows.slice(1).map(row => row.map(cell => String(cell || ""))),
      };
    } else {
      // CSV file
      const content = await FileSystem.readAsStringAsync(uri);
      const allRows = parseCSV(content);
      
      if (allRows.length < 2) {
        return null;
      }
      
      return {
        headers: allRows[0],
        rows: allRows.slice(1),
      };
    }
  } catch (error) {
    console.error("[BulkImport] Parse error:", error);
    return null;
  }
};

/**
 * Validate and preview import data
 */
export const validateImportData = (
  headers: string[],
  rows: string[][],
  existingMobiles: string[]
): ImportPreview => {
  const errors: ValidationError[] = [];
  const duplicates: { row: number; mobile: string }[] = [];
  const validRows: ImportRow[] = [];
  const seenMobiles = new Set(existingMobiles.map(m => formatMobile(m)));
  
  // Map headers to field names
  const fieldMap: Record<number, string> = {};
  headers.forEach((header, index) => {
    const field = findFieldName(header);
    if (field) {
      fieldMap[index] = field;
    }
  });
  
  // Check required fields
  const hasName = Object.values(fieldMap).includes("name");
  const hasMobile = Object.values(fieldMap).includes("mobile");
  
  if (!hasName) {
    errors.push({ row: 0, field: "name", message: "Missing 'Name' column in file" });
  }
  if (!hasMobile) {
    errors.push({ row: 0, field: "mobile", message: "Missing 'Mobile' column in file" });
  }
  
  if (!hasName || !hasMobile) {
    return { totalRows: rows.length, validRows: [], errors, duplicates };
  }
  
  // Process each row
  rows.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2; // Account for header row and 1-based indexing
    const importRow: Partial<ImportRow> = {};
    
    // Extract values based on field mapping
    Object.entries(fieldMap).forEach(([colIndex, field]) => {
      const value = row[parseInt(colIndex)]?.trim() || "";
      if (value) {
        if (field === "age") {
          const age = parseInt(value, 10);
          if (!isNaN(age) && age > 0 && age < 150) {
            importRow.age = age;
          }
        } else if (field === "gender") {
          const lower = value.toLowerCase();
          if (lower === "male" || lower === "m" || lower === "पुरुष" || lower === "પુરુષ") {
            importRow.gender = "male";
          } else if (lower === "female" || lower === "f" || lower === "महिला" || lower === "સ્ત્રી") {
            importRow.gender = "female";
          } else {
            importRow.gender = "other";
          }
        } else {
          (importRow as Record<string, string>)[field] = value;
        }
      }
    });
    
    // Validate required fields
    if (!importRow.name) {
      errors.push({ row: rowNum, field: "name", message: "Name is required" });
      return;
    }
    
    if (!importRow.mobile) {
      errors.push({ row: rowNum, field: "mobile", message: "Mobile number is required" });
      return;
    }
    
    // Validate mobile format
    if (!isValidMobile(importRow.mobile)) {
      errors.push({ row: rowNum, field: "mobile", message: `Invalid mobile number: ${importRow.mobile}` });
      return;
    }
    
    // Check for duplicates
    const formattedMobile = formatMobile(importRow.mobile);
    if (seenMobiles.has(formattedMobile)) {
      duplicates.push({ row: rowNum, mobile: importRow.mobile });
      return;
    }
    
    seenMobiles.add(formattedMobile);
    validRows.push({
      name: importRow.name,
      mobile: formattedMobile,
      group: importRow.group,
      emergencyContact: importRow.emergencyContact,
      emergencyContactName: importRow.emergencyContactName,
      notes: importRow.notes,
      bloodGroup: importRow.bloodGroup,
      age: importRow.age,
      gender: importRow.gender,
    });
  });
  
  return {
    totalRows: rows.length,
    validRows,
    errors,
    duplicates,
  };
};

/**
 * Import validated rows as participants
 */
export const importParticipants = async (
  validRows: ImportRow[],
  existingIds: string[]
): Promise<ImportResult> => {
  const participants: Participant[] = [];
  const errors: string[] = [];
  let currentIds = [...existingIds];
  
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    
    try {
      const id = await generateParticipantId(currentIds);
      const qrToken = await generateQRToken();
      
      const participant: Participant = {
        id,
        name: row.name,
        mobile: row.mobile,
        qrToken,
        createdAt: new Date().toISOString(),
        group: row.group,
        emergencyContact: row.emergencyContact,
        emergencyContactName: row.emergencyContactName,
        notes: row.notes,
        bloodGroup: row.bloodGroup,
        age: row.age,
        gender: row.gender,
      };
      
      participants.push(participant);
      currentIds.push(id);
    } catch (error) {
      errors.push(`Row ${i + 1}: Failed to create participant - ${error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    imported: participants.length,
    skipped: validRows.length - participants.length,
    errors,
    participants,
  };
};

/**
 * Generate a sample CSV template
 */
export const generateSampleCSV = (): string => {
  const headers = ["Name", "Mobile", "Group", "Emergency Contact", "Emergency Name", "Blood Group", "Age", "Gender", "Notes"];
  const sampleRows = [
    ["Ramesh Patel", "9876543210", "Family A", "9876543211", "Suresh Patel", "B+", "45", "Male", ""],
    ["Priya Shah", "9876543212", "Family A", "9876543213", "Meena Shah", "O+", "38", "Female", "Vegetarian"],
    ["Amit Kumar", "9876543214", "Group B", "9876543215", "Raj Kumar", "A+", "52", "Male", "Needs wheelchair assistance"],
  ];
  
  const csvContent = [
    headers.join(","),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");
  
  return csvContent;
};
