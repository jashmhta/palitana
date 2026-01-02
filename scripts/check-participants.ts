/**
 * Check participant data format
 */
import { drizzle } from "drizzle-orm/mysql2";
import { participants } from "../drizzle/schema";

async function checkParticipants() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  const results = await db.select({
    uuid: participants.uuid,
    name: participants.name,
    qrToken: participants.qrToken,
    mobile: participants.mobile,
  }).from(participants).limit(10);
  
  console.log("Sample participants:");
  results.forEach((p, i) => {
    console.log(`${i + 1}. Name: ${p.name}, QR Token: ${p.qrToken}, Mobile: ${p.mobile}`);
  });
  
  process.exit(0);
}

checkParticipants().catch(console.error);
