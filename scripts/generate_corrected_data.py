#!/usr/bin/env python3
"""
Generate corrected participant data from IDCardData_1.xlsx
This is the source of truth - 413 participants
"""

import pandas as pd
import json
import uuid

# Read the Excel file
excel_file = '/home/ubuntu/palitana-yatra-app/IDCardData_Final.xlsx'
df = pd.read_excel(excel_file, sheet_name='Sheet8')
df.columns = df.columns.str.strip()

print(f"Reading {len(df)} participants from Excel...")

participants = []

for idx, row in df.iterrows():
    badge = int(row['Badge Number'])
    name = str(row['Name']).strip() if pd.notna(row['Name']) else ''
    age = int(row['Age']) if pd.notna(row['Age']) else None
    blood_group = str(row['Blood Group']).strip() if pd.notna(row['Blood Group']) else None
    emergency_contact = str(int(row['Emergency Contact Number'])) if pd.notna(row['Emergency Contact Number']) else ''
    photo_uri = str(row['Drive Photo Link']).strip() if pd.notna(row['Drive Photo Link']) else None
    
    # Generate consistent UUID based on badge number for reproducibility
    participant_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"palitana-yatra-{badge}"))
    
    # Generate QR token
    qr_token = f"PALITANA_YATRA_{badge}"
    
    participant = {
        "uuid": participant_uuid,
        "name": name,
        "mobile": emergency_contact,  # Using emergency contact as mobile
        "qrToken": qr_token,
        "emergencyContact": emergency_contact,
        "photoUri": photo_uri,
        "bloodGroup": blood_group,
        "age": age,
        "badgeNumber": badge
    }
    
    participants.append(participant)

# Sort by badge number
participants.sort(key=lambda x: x['badgeNumber'])

# Save to JSON
output_file = '/home/ubuntu/palitana-yatra-app/participants_corrected.json'
with open(output_file, 'w') as f:
    json.dump(participants, f, indent=2)

print(f"\n✅ Generated {len(participants)} participants")
print(f"Saved to: {output_file}")

# Summary stats
with_age = sum(1 for p in participants if p['age'])
with_blood = sum(1 for p in participants if p['bloodGroup'])
with_photo = sum(1 for p in participants if p['photoUri'])

print(f"\nData completeness:")
print(f"  - With Age: {with_age}/{len(participants)}")
print(f"  - With Blood Group: {with_blood}/{len(participants)}")
print(f"  - With Photo: {with_photo}/{len(participants)}")

# Show first 5 and last 5
print(f"\nFirst 5 participants:")
for p in participants[:5]:
    print(f"  #{p['badgeNumber']}: {p['name']} (Age: {p['age']}, Blood: {p['bloodGroup']})")

print(f"\nLast 5 participants:")
for p in participants[-5:]:
    print(f"  #{p['badgeNumber']}: {p['name']} (Age: {p['age']}, Blood: {p['bloodGroup']})")
