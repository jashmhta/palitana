#!/usr/bin/env python3
"""
Generate QR codes for all participants with filenames: badge_number_name.png
"""

import json
import os
import re
import zipfile

try:
    import qrcode
except ImportError:
    os.system("pip3 install qrcode[pil]")
    import qrcode

# Load participant data
with open('/home/ubuntu/palitana-yatra-app/participants_corrected.json', 'r') as f:
    participants = json.load(f)

# Create output directory
output_dir = '/home/ubuntu/palitana-yatra-app/qr_codes_named'
os.makedirs(output_dir, exist_ok=True)

print(f"Generating QR codes for {len(participants)} participants...")

def sanitize_filename(name):
    """Remove or replace characters that are invalid in filenames"""
    # Replace spaces with underscores
    name = name.replace(' ', '_')
    # Remove special characters except underscores and hyphens
    name = re.sub(r'[^\w\-]', '', name)
    # Remove multiple underscores
    name = re.sub(r'_+', '_', name)
    return name

generated_count = 0
for p in participants:
    badge_number = p['badgeNumber']
    name = p['name']
    qr_token = p['qrToken']
    
    # Sanitize name for filename
    safe_name = sanitize_filename(name)
    
    # Create filename: badge_number_name.png
    filename = f"{badge_number}_{safe_name}.png"
    filepath = os.path.join(output_dir, filename)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filepath)
    
    generated_count += 1
    if generated_count % 50 == 0:
        print(f"Generated {generated_count}/{len(participants)} QR codes...")

print(f"✅ Generated all {generated_count} QR codes")

# Create zip file
zip_path = '/home/ubuntu/palitana-yatra-app/palitana_qr_codes_named.zip'
print(f"Creating zip file: {zip_path}")

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for filename in sorted(os.listdir(output_dir)):
        if filename.endswith('.png'):
            filepath = os.path.join(output_dir, filename)
            zipf.write(filepath, filename)

# Get zip file size
zip_size = os.path.getsize(zip_path) / (1024 * 1024)
print(f"✅ Created zip file: {zip_path} ({zip_size:.2f} MB)")

# List first 10 files as sample
print("\nSample filenames:")
files = sorted(os.listdir(output_dir))[:10]
for f in files:
    print(f"  {f}")
print(f"  ... and {len(os.listdir(output_dir)) - 10} more")
