#!/usr/bin/env python3
"""
Verify final participant data from IDCardData_1.xlsx
Extract all sheets and analyze the data structure
"""

import pandas as pd
import json
import sys

# Read the Excel file
excel_file = '/home/ubuntu/palitana-yatra-app/IDCardData_Final.xlsx'

print("=" * 60)
print("ANALYZING IDCardData_1.xlsx (Final Data)")
print("=" * 60)

# Get all sheet names
xl = pd.ExcelFile(excel_file)
print(f"\nSheet names: {xl.sheet_names}")

# Read each sheet and analyze
for sheet_name in xl.sheet_names:
    print(f"\n{'='*60}")
    print(f"SHEET: {sheet_name}")
    print("=" * 60)
    
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    print(f"Rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    
    # Show first few rows
    print(f"\nFirst 5 rows:")
    print(df.head())
    
    # Show data types
    print(f"\nData types:")
    print(df.dtypes)

# Focus on the main data sheet (usually "Final Data" or first sheet)
print("\n" + "=" * 60)
print("EXTRACTING PARTICIPANT DATA")
print("=" * 60)

# Try to find the main data sheet
main_sheet = None
for sheet in xl.sheet_names:
    if 'final' in sheet.lower() or 'data' in sheet.lower():
        main_sheet = sheet
        break
if main_sheet is None:
    main_sheet = xl.sheet_names[0]

print(f"\nUsing sheet: {main_sheet}")
df = pd.read_excel(excel_file, sheet_name=main_sheet)

# Clean column names
df.columns = df.columns.str.strip()
print(f"\nCleaned columns: {list(df.columns)}")

# Count non-null values for each column
print("\nNon-null counts:")
for col in df.columns:
    non_null = df[col].notna().sum()
    print(f"  {col}: {non_null}/{len(df)}")

# Export to JSON for comparison
output_data = []
for idx, row in df.iterrows():
    participant = {}
    for col in df.columns:
        val = row[col]
        if pd.notna(val):
            participant[col] = val
        else:
            participant[col] = None
    output_data.append(participant)

# Save to JSON
with open('/home/ubuntu/palitana-yatra-app/final_data_extracted.json', 'w') as f:
    json.dump(output_data, f, indent=2, default=str)

print(f"\nExtracted {len(output_data)} participants to final_data_extracted.json")
