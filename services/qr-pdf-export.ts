/**
 * QR Card PDF Export Service
 * Generates HTML files with QR cards for individual or batch export
 * Uses print-ready HTML that can be saved as PDF from browser/share sheet
 */

import { File, Paths } from "expo-file-system";
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

// Generate QR code as data URL using a QR code API service
export const generateQRDataUrl = (token: string, size: number = 200): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}&format=png&margin=10`;
};

// Generate HTML for a single QR card
const generateSingleCardHTML = (participant: Participant, qrDataUrl: string): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Card - ${participant.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      width: 350px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #C9A227 0%, #E8D48B 100%);
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      font-size: 12px;
    }
    .content {
      padding: 24px;
      text-align: center;
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
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .mobile {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .token {
      font-family: 'SF Mono', 'Monaco', monospace;
      font-size: 14px;
      color: #C9A227;
      background: #FFF9E6;
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-block;
      letter-spacing: 2px;
    }
    .footer {
      background: #f8f8f8;
      padding: 12px;
      text-align: center;
      font-size: 11px;
      color: #999;
    }
    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🙏 Palitana Yatra 2025</h1>
      <p>Pilgrim Identification Card</p>
    </div>
    <div class="content">
      <div class="qr-container">
        <img class="qr-code" src="${qrDataUrl}" alt="QR Code" />
      </div>
      <div class="name">${participant.name}</div>
      <div class="mobile">📱 ${formatMobile(participant.mobile)}</div>
      <div class="token">${participant.qrToken}</div>
    </div>
    <div class="footer">
      ID: ${participant.id} | Scan at each checkpoint
    </div>
  </div>
</body>
</html>`;
};

// Generate HTML for batch QR cards (multiple cards per page)
const generateBatchCardsHTML = (participants: Participant[]): string => {
  const cardsHTML = participants.map((participant) => {
    const qrDataUrl = generateQRDataUrl(participant.qrToken, 150);
    return `
      <div class="card">
        <div class="header">
          <h1>🙏 Palitana Yatra 2025</h1>
        </div>
        <div class="content">
          <div class="qr-container">
            <img class="qr-code" src="${qrDataUrl}" alt="QR Code" />
          </div>
          <div class="name">${participant.name}</div>
          <div class="mobile">📱 ${formatMobile(participant.mobile)}</div>
          <div class="token">${participant.qrToken}</div>
        </div>
        <div class="footer">ID: ${participant.id}</div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Palitana Yatra - ${participants.length} QR Cards</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .page-header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #C9A227 0%, #E8D48B 100%);
      border-radius: 12px;
      color: white;
    }
    .page-header h1 { font-size: 28px; margin-bottom: 8px; }
    .page-header p { opacity: 0.9; }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      justify-items: center;
    }
    .card {
      width: 280px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      page-break-inside: avoid;
    }
    .header {
      background: linear-gradient(135deg, #C9A227 0%, #E8D48B 100%);
      padding: 10px;
      text-align: center;
    }
    .header h1 {
      color: white;
      font-size: 12px;
      font-weight: 600;
    }
    .content {
      padding: 16px;
      text-align: center;
    }
    .qr-container {
      background: #f8f8f8;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
      display: inline-block;
    }
    .qr-code {
      width: 130px;
      height: 130px;
    }
    .name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .mobile {
      font-size: 12px;
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
    }
    .footer {
      background: #f8f8f8;
      padding: 8px;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body { background: white; padding: 10px; }
      .page-header { margin-bottom: 20px; }
      .card { box-shadow: none; border: 1px solid #ddd; }
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
 * Export a single participant's QR card
 */
export const exportSingleQRCard = async (participant: Participant): Promise<void> => {
  try {
    const qrDataUrl = generateQRDataUrl(participant.qrToken);
    const html = generateSingleCardHTML(participant, qrDataUrl);
    
    const fileName = `QR_Card_${participant.name.replace(/\s+/g, '_')}_${participant.id}.html`;
    
    if (Platform.OS === "web") {
      // On web, open in new tab for printing
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      // On mobile, write to cache and share
      const file = new File(Paths.cache, fileName);
      await file.write(html);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/html",
          dialogTitle: `QR Card for ${participant.name}`,
        });
      }
    }
  } catch (error) {
    console.error("Failed to export QR card:", error);
    throw error;
  }
};

/**
 * Export all participants' QR cards as a single HTML file
 */
export const exportBatchQRCards = async (participants: Participant[]): Promise<void> => {
  try {
    if (participants.length === 0) {
      throw new Error("No participants to export");
    }
    
    const html = generateBatchCardsHTML(participants);
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `Palitana_Yatra_QR_Cards_${timestamp}.html`;
    
    if (Platform.OS === "web") {
      // On web, open in new tab for printing
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      // On mobile, write to cache and share
      const file = new File(Paths.cache, fileName);
      await file.write(html);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/html",
          dialogTitle: `${participants.length} QR Cards - Palitana Yatra`,
        });
      }
    }
  } catch (error) {
    console.error("Failed to export batch QR cards:", error);
    throw error;
  }
};

/**
 * Export selected participants' QR cards
 */
export const exportSelectedQRCards = async (
  participants: Participant[],
  selectedIds: string[]
): Promise<void> => {
  const selected = participants.filter(p => selectedIds.includes(p.id));
  if (selected.length === 0) {
    throw new Error("No participants selected");
  }
  await exportBatchQRCards(selected);
};
