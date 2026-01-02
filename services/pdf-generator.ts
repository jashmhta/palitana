/**
 * PDF Generator Service
 * Generates PDF documents for QR cards and certificates
 */

import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Participant } from "@/types";

/**
 * Generate a simple PDF with QR card data
 * Note: For full PDF generation, we use a server-side approach or web view
 */
export async function generateQRCardPDF(
  participants: Participant[],
  title: string = "Palitana Yatra - QR Cards"
): Promise<string> {
  // Create HTML content for the PDF
  const htmlContent = generateHTMLForPDF(participants, title);
  
  // Save HTML file using new File API
  const file = new File(Paths.cache, "qr_cards.html");
  await file.write(htmlContent);
  
  return file.uri;
}

/**
 * Generate HTML content for QR cards
 */
function generateHTMLForPDF(participants: Participant[], title: string): string {
  const cardsHTML = participants
    .map(
      (p, index) => `
      <div class="card" style="page-break-inside: avoid; ${index > 0 && index % 6 === 0 ? "page-break-before: always;" : ""}">
        <div class="card-header">
          <h3>Palitana Yatra 2025</h3>
        </div>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(p.qrToken)}" alt="QR Code" />
        </div>
        <div class="card-info">
          <p class="name">${p.name}</p>
          <p class="mobile">${p.mobile}</p>
          <p class="token">${p.qrToken}</p>
        </div>
      </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #C9A227, #E8D48B);
      color: white;
      border-radius: 12px;
    }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: center;
    }
    .card {
      width: 280px;
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      text-align: center;
    }
    .card-header {
      background: linear-gradient(135deg, #C9A227, #E8D48B);
      margin: -20px -20px 15px -20px;
      padding: 15px;
      border-radius: 16px 16px 0 0;
    }
    .card-header h3 {
      color: white;
      font-size: 14px;
      font-weight: 600;
    }
    .qr-container {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 12px;
      margin-bottom: 15px;
    }
    .qr-container img {
      width: 150px;
      height: 150px;
    }
    .card-info { text-align: center; }
    .name {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 5px;
    }
    .mobile {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .token {
      font-size: 12px;
      color: #999;
      font-family: monospace;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    @media print {
      body { background: white; padding: 0; }
      .card { 
        box-shadow: none; 
        border: 1px solid #ddd;
        page-break-inside: avoid;
      }
      .header { margin-bottom: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Generated on ${new Date().toLocaleDateString()} • ${participants.length} Cards</p>
  </div>
  <div class="cards-container">
    ${cardsHTML}
  </div>
</body>
</html>
  `;
}

/**
 * Generate a single QR card HTML
 */
export function generateSingleCardHTML(participant: Participant): string {
  return generateHTMLForPDF([participant], `QR Card - ${participant.name}`);
}

/**
 * Share the generated PDF/HTML file
 */
export async function shareQRCards(filePath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: "text/html",
      dialogTitle: "Share QR Cards",
      UTI: "public.html",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}

/**
 * Generate completion certificate HTML
 */
export function generateCertificateHTML(
  participant: Participant,
  completionDate: string,
  checkpointsCompleted: number,
  totalCheckpoints: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #fef9e7, #fff);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .certificate {
      width: 800px;
      background: white;
      border: 3px solid #C9A227;
      border-radius: 20px;
      padding: 60px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #E8D48B;
      border-radius: 15px;
      pointer-events: none;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #C9A227, #E8D48B);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    h1 {
      font-size: 36px;
      color: #C9A227;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    .recipient {
      font-size: 32px;
      color: #1a1a1a;
      font-weight: bold;
      margin: 30px 0;
      padding: 20px;
      border-bottom: 2px solid #C9A227;
      display: inline-block;
    }
    .description {
      font-size: 18px;
      color: #444;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 30px 0;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #C9A227;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .date {
      font-size: 16px;
      color: #666;
      margin-top: 40px;
    }
    .signature {
      margin-top: 40px;
      font-style: italic;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="logo">🙏</div>
    <h1>Certificate of Completion</h1>
    <p class="subtitle">Palitana Yatra 2025</p>
    
    <p>This is to certify that</p>
    <p class="recipient">${participant.name}</p>
    
    <p class="description">
      has successfully completed the sacred pilgrimage to Palitana,<br>
      visiting all the holy temples on Shatrunjaya Hill.
    </p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${checkpointsCompleted}</div>
        <div class="stat-label">Checkpoints Visited</div>
      </div>
      <div class="stat">
        <div class="stat-value">${totalCheckpoints}</div>
        <div class="stat-label">Total Checkpoints</div>
      </div>
    </div>
    
    <p class="date">Completed on: ${completionDate}</p>
    
    <p class="signature">
      May this journey bring peace and blessings.<br>
      जय जिनेन्द्र 🙏
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Save certificate and share
 */
export async function generateAndShareCertificate(
  participant: Participant,
  completionDate: string,
  checkpointsCompleted: number,
  totalCheckpoints: number
): Promise<void> {
  const html = generateCertificateHTML(
    participant,
    completionDate,
    checkpointsCompleted,
    totalCheckpoints
  );
  
  const file = new File(Paths.cache, `certificate_${participant.id}.html`);
  await file.write(html);
  await shareQRCards(file.uri);
}
