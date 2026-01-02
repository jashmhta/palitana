#!/usr/bin/env python3
"""
Compare final Excel data with database entries
Generate detailed verification report
"""

import json
import pandas as pd

# Load Excel data
excel_file = '/home/ubuntu/palitana-yatra-app/IDCardData_Final.xlsx'
df_excel = pd.read_excel(excel_file, sheet_name='Sheet8')
df_excel.columns = df_excel.columns.str.strip()

# Load database data (from participants_import_final.json which was imported)
with open('/home/ubuntu/palitana-yatra-app/participants_import_final.json', 'r') as f:
    db_data = json.load(f)

print("=" * 80)
print("DATA VERIFICATION REPORT: IDCardData_1.xlsx vs Database")
print("=" * 80)

print(f"\nExcel records: {len(df_excel)}")
print(f"Database records: {len(db_data)}")

# Create lookup by badge number for database
db_by_badge = {p.get('badgeNumber'): p for p in db_data}

# Track discrepancies
discrepancies = []
matches = 0
missing_in_db = []
missing_in_excel = []

# Compare each Excel record with database
for idx, row in df_excel.iterrows():
    badge = int(row['Badge Number'])
    excel_name = str(row['Name']).strip() if pd.notna(row['Name']) else None
    excel_age = int(row['Age']) if pd.notna(row['Age']) else None
    excel_blood = str(row['Blood Group']).strip() if pd.notna(row['Blood Group']) else None
    excel_emergency = str(int(row['Emergency Contact Number'])) if pd.notna(row['Emergency Contact Number']) else None
    excel_photo = str(row['Drive Photo Link']).strip() if pd.notna(row['Drive Photo Link']) else None
    
    if badge not in db_by_badge:
        missing_in_db.append({
            'badge': badge,
            'name': excel_name,
            'age': excel_age,
            'blood_group': excel_blood,
            'emergency_contact': excel_emergency,
            'photo': excel_photo
        })
        continue
    
    db_record = db_by_badge[badge]
    db_name = db_record.get('name', '').strip()
    db_age = db_record.get('age')
    db_blood = db_record.get('bloodGroup', '').strip() if db_record.get('bloodGroup') else None
    db_emergency = str(db_record.get('emergencyContact', '')).strip()
    db_photo = db_record.get('photoUri', '').strip() if db_record.get('photoUri') else None
    
    issues = []
    
    # Compare name (case-insensitive, ignore extra spaces)
    if excel_name and db_name:
        if excel_name.lower().replace(' ', '') != db_name.lower().replace(' ', ''):
            issues.append(f"Name: Excel='{excel_name}' vs DB='{db_name}'")
    
    # Compare age
    if excel_age and db_age:
        if excel_age != db_age:
            issues.append(f"Age: Excel={excel_age} vs DB={db_age}")
    elif excel_age and not db_age:
        issues.append(f"Age: Excel={excel_age} vs DB=None")
    
    # Compare blood group
    if excel_blood and db_blood:
        if excel_blood.lower().replace(' ', '') != db_blood.lower().replace(' ', ''):
            issues.append(f"Blood: Excel='{excel_blood}' vs DB='{db_blood}'")
    elif excel_blood and not db_blood:
        issues.append(f"Blood: Excel='{excel_blood}' vs DB=None")
    
    # Compare emergency contact
    if excel_emergency and db_emergency:
        if excel_emergency != db_emergency:
            issues.append(f"Emergency: Excel='{excel_emergency}' vs DB='{db_emergency}'")
    
    if issues:
        discrepancies.append({
            'badge': badge,
            'name': excel_name,
            'issues': issues
        })
    else:
        matches += 1

# Check for records in DB but not in Excel
excel_badges = set(df_excel['Badge Number'].astype(int).tolist())
for badge, record in db_by_badge.items():
    if badge not in excel_badges:
        missing_in_excel.append({
            'badge': badge,
            'name': record.get('name')
        })

# Print report
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Matching records: {matches}")
print(f"⚠️  Records with discrepancies: {len(discrepancies)}")
print(f"❌ Missing in database: {len(missing_in_db)}")
print(f"❓ In database but not in Excel: {len(missing_in_excel)}")

if discrepancies:
    print("\n" + "=" * 80)
    print("DISCREPANCIES FOUND")
    print("=" * 80)
    for d in discrepancies[:20]:  # Show first 20
        print(f"\nBadge #{d['badge']} - {d['name']}")
        for issue in d['issues']:
            print(f"  ❌ {issue}")
    if len(discrepancies) > 20:
        print(f"\n... and {len(discrepancies) - 20} more discrepancies")

if missing_in_db:
    print("\n" + "=" * 80)
    print("MISSING IN DATABASE (need to add)")
    print("=" * 80)
    for m in missing_in_db:
        print(f"  Badge #{m['badge']}: {m['name']}")

if missing_in_excel:
    print("\n" + "=" * 80)
    print("IN DATABASE BUT NOT IN EXCEL (extra records)")
    print("=" * 80)
    for m in missing_in_excel:
        print(f"  Badge #{m['badge']}: {m['name']}")

# Save detailed report to JSON
report = {
    'summary': {
        'excel_count': len(df_excel),
        'database_count': len(db_data),
        'matching': matches,
        'discrepancies': len(discrepancies),
        'missing_in_db': len(missing_in_db),
        'missing_in_excel': len(missing_in_excel)
    },
    'discrepancies': discrepancies,
    'missing_in_db': missing_in_db,
    'missing_in_excel': missing_in_excel
}

with open('/home/ubuntu/palitana-yatra-app/verification_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("\n" + "=" * 80)
print("Full report saved to verification_report.json")
print("=" * 80)

# Final verdict
if len(discrepancies) == 0 and len(missing_in_db) == 0:
    print("\n✅ DATA VERIFICATION PASSED - All records match!")
else:
    print(f"\n⚠️  DATA VERIFICATION NEEDS ATTENTION - {len(discrepancies) + len(missing_in_db)} issues found")
