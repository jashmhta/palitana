#!/usr/bin/env python3
"""
Verify that database now matches Excel exactly
"""

import json
import pandas as pd

# Load Excel data
excel_file = '/home/ubuntu/palitana-yatra-app/IDCardData_Final.xlsx'
df_excel = pd.read_excel(excel_file, sheet_name='Sheet8')
df_excel.columns = df_excel.columns.str.strip()

# Load corrected data (what was imported to DB)
with open('/home/ubuntu/palitana-yatra-app/participants_corrected.json', 'r') as f:
    db_data = json.load(f)

print("=" * 80)
print("FINAL VERIFICATION: Excel vs Corrected Database Data")
print("=" * 80)

print(f"\nExcel records: {len(df_excel)}")
print(f"Database records: {len(db_data)}")

# Create lookup by badge number
db_by_badge = {p['badgeNumber']: p for p in db_data}

matches = 0
discrepancies = []

for idx, row in df_excel.iterrows():
    badge = int(row['Badge Number'])
    excel_name = str(row['Name']).strip() if pd.notna(row['Name']) else None
    excel_age = int(row['Age']) if pd.notna(row['Age']) else None
    excel_blood = str(row['Blood Group']).strip() if pd.notna(row['Blood Group']) else None
    excel_emergency = str(int(row['Emergency Contact Number'])) if pd.notna(row['Emergency Contact Number']) else None
    
    if badge not in db_by_badge:
        discrepancies.append(f"Badge #{badge} missing in database")
        continue
    
    db = db_by_badge[badge]
    issues = []
    
    # Compare name
    if excel_name != db['name']:
        issues.append(f"Name: '{excel_name}' vs '{db['name']}'")
    
    # Compare age
    if excel_age != db['age']:
        issues.append(f"Age: {excel_age} vs {db['age']}")
    
    # Compare blood group
    if excel_blood != db['bloodGroup']:
        issues.append(f"Blood: '{excel_blood}' vs '{db['bloodGroup']}'")
    
    # Compare emergency contact
    if excel_emergency != db['emergencyContact']:
        issues.append(f"Emergency: '{excel_emergency}' vs '{db['emergencyContact']}'")
    
    if issues:
        discrepancies.append(f"Badge #{badge}: " + ", ".join(issues))
    else:
        matches += 1

print(f"\n✅ Matching records: {matches}/{len(df_excel)}")
print(f"❌ Discrepancies: {len(discrepancies)}")

if discrepancies:
    print("\nDiscrepancies found:")
    for d in discrepancies[:10]:
        print(f"  {d}")
    if len(discrepancies) > 10:
        print(f"  ... and {len(discrepancies) - 10} more")
else:
    print("\n" + "=" * 80)
    print("✅ ALL DATA MATCHES EXCEL EXACTLY!")
    print("=" * 80)

# Verify QR codes exist
import os
qr_dir = '/home/ubuntu/palitana-yatra-app/qr_codes_final'
qr_files = [f for f in os.listdir(qr_dir) if f.endswith('.png')]
print(f"\nQR codes generated: {len(qr_files)}")

# Verify zip file
zip_path = '/home/ubuntu/palitana-yatra-app/palitana_qr_codes_corrected.zip'
if os.path.exists(zip_path):
    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Zip file size: {size_mb:.2f} MB")

print("\n" + "=" * 80)
print("VERIFICATION COMPLETE")
print("=" * 80)
