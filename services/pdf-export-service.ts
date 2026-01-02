/**
 * PDF Export Service
 * Generates actual PDF files for QR cards
 * Uses jspdf for web and expo-print for native
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { Participant } from "@/types";

// Format mobile number for display
const formatMobile = (mobile: string): string => {
  if (mobile.length === 10) {
    return `${mobile.slice(0, 5)} ${mobile.slice(5)}`;
  }
  return mobile;
};

// Generate QR code URL
const getQRCodeUrl = (token: string, size: number = 200): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}&format=png&margin=10`;
};

// Generate HTML for a single QR card (print-ready)
const generateSingleCardHTML = (participant: Participant): string => {
  const qrUrl = getQRCodeUrl(participant.qrToken, 200);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QR Card - ${participant.name}</title>
  <style>
    @page {
      size: A6 portrait;
      margin: 10mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      width: 100%;
      max-width: 350px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #C9A227 0%, #E8D48B 50%, #C9A227 100%);
      padding: 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }
    .header h1 {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .header p {
      color: rgba(255,255,255,0.9);
      font-size: 12px;
    }
    .content {
      padding: 24px;
      text-align: center;
      background: white;
    }
    .qr-container {
      background: #f8f8f8;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      display: inline-block;
    }
    .qr-code {
      width: 180px;
      height: 180px;
    }
    .name {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .mobile {
      font-size: 16px;
      color: #666;
      margin-bottom: 16px;
    }
    .mobile-icon {
      margin-right: 4px;
    }
    .token {
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 16px;
      color: #C9A227;
      background: #FFF9E6;
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
      letter-spacing: 2px;
      font-weight: 600;
    }
    .footer {
      background: #f8f8f8;
      padding: 14px;
      text-align: center;
      font-size: 11px;
      color: #888;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-icon">🙏</div>
      <h1>Palitana Yatra 2025</h1>
      <p>Pilgrim Identification Card</p>
    </div>
    <div class="content">
      <div class="qr-container">
        <img class="qr-code" src="${qrUrl}" alt="QR Code" crossorigin="anonymous" />
      </div>
      <div class="name">${participant.name}</div>
      <div class="mobile"><span class="mobile-icon">📱</span>${formatMobile(participant.mobile)}</div>
      <div class="token">${participant.qrToken}</div>
    </div>
    <div class="footer">
      ID: ${participant.id.slice(0, 8)} | Scan at each checkpoint
    </div>
  </div>
</body>
</html>`;
};

// Generate HTML for multiple QR cards (batch print-ready)
const generateBatchCardsHTML = (participants: Participant[]): string => {
  const cardsHTML = participants.map((participant, index) => {
    const qrUrl = getQRCodeUrl(participant.qrToken, 150);
    return `
      <div class="card" style="${(index + 1) % 4 === 0 ? 'page-break-after: always;' : ''}">
        <div class="header">
          <span class="header-icon">🙏</span>
          <span class="header-title">Palitana Yatra 2025</span>
        </div>
        <div class="content">
          <div class="qr-container">
            <img class="qr-code" src="${qrUrl}" alt="QR Code" crossorigin="anonymous" />
          </div>
          <div class="name">${participant.name}</div>
          <div class="mobile">📱 ${formatMobile(participant.mobile)}</div>
          <div class="token">${participant.qrToken}</div>
        </div>
        <div class="footer">ID: ${participant.id.slice(0, 8)}</div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Palitana Yatra - ${participants.length} QR Cards</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: white;
      padding: 10px;
    }
    .page-header {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: linear-gradient(135deg, #C9A227 0%, #E8D48B 100%);
      border-radius: 10px;
      color: white;
    }
    .page-header h1 { font-size: 22px; margin-bottom: 4px; }
    .page-header p { opacity: 0.9; font-size: 14px; }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      justify-items: center;
    }
    .card {
      width: 100%;
      max-width: 260px;
      background: white;
      border-radius: 10px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .header {
      background: linear-gradient(135deg, #C9A227 0%, #E8D48B 100%);
      padding: 8px 10px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .header-icon { font-size: 14px; }
    .header-title {
      color: white;
      font-size: 11px;
      font-weight: 600;
    }
    .content {
      padding: 12px;
      text-align: center;
    }
    .qr-container {
      background: #f8f8f8;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 10px;
      display: inline-block;
    }
    .qr-code {
      width: 120px;
      height: 120px;
    }
    .name {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .mobile {
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
    }
    .token {
      font-family: monospace;
      font-size: 10px;
      color: #C9A227;
      background: #FFF9E6;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .footer {
      background: #f8f8f8;
      padding: 6px;
      text-align: center;
      font-size: 9px;
      color: #999;
    }
    @media print {
      .page-header { margin-bottom: 15px; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <h1>🙏 Palitana Yatra 2025</h1>
    <p>${participants.length} Pilgrim QR Cards</p>
  </div>
  <div class="cards-grid">
    ${cardsHTML}
  </div>
</body>
</html>`;
};

/**
 * Download HTML as file and open print dialog on web
 */
const downloadAndPrintHTML = (html: string, filename: string): void => {
  // Create blob and download
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  
  // Download the HTML file
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for images to load then print
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  }
  
  URL.revokeObjectURL(url);
};

/**
 * Export a single participant's QR card as PDF
 */
export const exportSingleQRCardPDF = async (participant: Participant): Promise<void> => {
  try {
    const html = generateSingleCardHTML(participant);
    const filename = `QR_Card_${participant.name.replace(/\s+/g, "_")}.html`;
    
    if (Platform.OS === "web") {
      // On web, download HTML and open print dialog
      downloadAndPrintHTML(html, filename);
    } else {
      // On mobile, generate PDF and share
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      console.log("PDF generated at:", uri);
      
      // Share the PDF file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `QR Card for ${participant.name}`,
          UTI: "com.adobe.pdf",
        });
      }
    }
  } catch (error) {
    console.error("Failed to export QR card PDF:", error);
    throw error;
  }
};

/**
 * Export all participants' QR cards as a single PDF
 */
export const exportBatchQRCardsPDF = async (participants: Participant[]): Promise<void> => {
  try {
    if (participants.length === 0) {
      throw new Error("No participants to export");
    }
    
    const html = generateBatchCardsHTML(participants);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Palitana_Yatra_QR_Cards_${timestamp}.html`;
    
    if (Platform.OS === "web") {
      // On web, download HTML and open print dialog
      downloadAndPrintHTML(html, filename);
    } else {
      // On mobile, generate PDF and share
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      console.log("Batch PDF generated at:", uri);
      
      // Share the PDF file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${participants.length} QR Cards - Palitana Yatra`,
          UTI: "com.adobe.pdf",
        });
      }
    }
  } catch (error) {
    console.error("Failed to export batch QR cards PDF:", error);
    throw error;
  }
};

/**
 * Export selected participants' QR cards as PDF
 */
export const exportSelectedQRCardsPDF = async (
  participants: Participant[],
  selectedIds: string[]
): Promise<void> => {
  const selected = participants.filter(p => selectedIds.includes(p.id));
  if (selected.length === 0) {
    throw new Error("No participants selected");
  }
  await exportBatchQRCardsPDF(selected);
};
