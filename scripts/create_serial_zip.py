#!/usr/bin/env python3
"""
Create zip file with QR codes added in strict badge number serial order
"""

import os
import zipfile

# Source directory
source_dir = '/home/ubuntu/palitana-yatra-app/qr_codes_serial'

# Get all files
all_files = [f for f in os.listdir(source_dir) if f.endswith('.png')]

# Sort by badge number (extract number from filename)
def get_badge_num(filename):
    return int(filename.split('_')[0])

files_sorted = sorted(all_files, key=get_badge_num)

print(f"Total files: {len(files_sorted)}")
print(f"First 10 files in order:")
for f in files_sorted[:10]:
    print(f"  {f}")
print(f"...")
print(f"Last 5 files in order:")
for f in files_sorted[-5:]:
    print(f"  {f}")

# Create zip file with files added in serial order
zip_path = '/home/ubuntu/palitana-yatra-app/palitana_qr_codes_serial_order.zip'

print(f"\nCreating zip file: {zip_path}")
print("Adding files in strict serial order...")

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for idx, filename in enumerate(files_sorted):
        filepath = os.path.join(source_dir, filename)
        zipf.write(filepath, filename)
        if (idx + 1) % 100 == 0:
            print(f"  Added {idx + 1}/{len(files_sorted)} files...")

print(f"\n✅ Created zip file with {len(files_sorted)} files in serial order")

# Verify the order inside the zip
print("\nVerifying order inside zip:")
with zipfile.ZipFile(zip_path, 'r') as zipf:
    names = zipf.namelist()
    print(f"First 10 files in zip:")
    for n in names[:10]:
        print(f"  {n}")
    print(f"...")
    print(f"Last 5 files in zip:")
    for n in names[-5:]:
        print(f"  {n}")

# Get file size
size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"\nZip file size: {size_mb:.2f} MB")
