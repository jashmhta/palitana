/**
 * Import all 417 participants into the database
 * Run with: pnpm exec tsx scripts/import_participants.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/mysql2';
import { participants } from '../drizzle/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importParticipants() {
  try {
    console.log('Starting participant import...\n');
    
    // Create database connection
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment');
    }
    const db = drizzle(process.env.DATABASE_URL);
    
    // Read the JSON data
    const jsonPath = path.join(__dirname, '../participants_import.json');
    const participantsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Found ${participantsData.length} participants to import`);
    
    // Import in batches of 100
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < participantsData.length; i += batchSize) {
      const batch = participantsData.slice(i, i + batchSize);
      
      // Prepare batch data for insertion
      const insertData = batch.map((p: any) => ({
        uuid: p.uuid,
        name: p.name.trim(),
        mobile: String(p.mobile),
        qrToken: p.qrToken,
        emergencyContact: String(p.emergencyContact),
        photoUri: p.photoUri || null,
        bloodGroup: p.bloodGroup || null,
        age: p.age ? parseInt(String(p.age), 10) : null,
      }));
      
      // Insert batch
      await db.insert(participants).values(insertData);
      
      imported += batch.length;
      console.log(`Imported ${imported}/${participantsData.length} participants...`);
    }
    
    console.log(`\n✅ Successfully imported all ${imported} participants!`);
    console.log(`\nData included:`);
    console.log(`  - Name, Badge Number, Emergency Contact: ${participantsData.length}/${participantsData.length}`);
    console.log(`  - Age: ${participantsData.filter((p: any) => p.age).length}/${participantsData.length}`);
    console.log(`  - Blood Group: ${participantsData.filter((p: any) => p.bloodGroup).length}/${participantsData.length}`);
    console.log(`  - Photo Link: ${participantsData.filter((p: any) => p.photoUri).length}/${participantsData.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing participants:', error);
    process.exit(1);
  }
}

importParticipants();
