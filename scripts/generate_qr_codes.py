#!/usr/bin/env python3
"""
Generate QR codes for all 413 participants from corrected data
Creates labeled QR code images and a zip file
"""

import json
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
import zipfile

# Load corrected participant data
with open('/home/ubuntu/palitana-yatra-app/participants_corrected.json', 'r') as f:
    participants = json.load(f)

print(f"Generating QR codes for {len(participants)} participants...")

# Create output directory
output_dir = '/home/ubuntu/palitana-yatra-app/qr_codes_final'
os.makedirs(output_dir, exist_ok=True)

# Try to load a font, fall back to default if not available
try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
except:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

for i, p in enumerate(participants):
    badge = p['badgeNumber']
    name = p['name']
    qr_token = p['qrToken']
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_token)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to RGB if needed
    if qr_img.mode != 'RGB':
        qr_img = qr_img.convert('RGB')
    
    qr_width, qr_height = qr_img.size
    
    # Create labeled image
    label_height = 80
    final_img = Image.new('RGB', (qr_width, qr_height + label_height), 'white')
    final_img.paste(qr_img, (0, 0, qr_width, qr_height))
    
    # Add label
    draw = ImageDraw.Draw(final_img)
    
    # Badge number
    badge_text = f"#{badge}"
    draw.text((10, qr_height + 10), badge_text, fill='black', font=font_large)
    
    # Name (truncate if too long)
    display_name = name[:30] + "..." if len(name) > 30 else name
    draw.text((10, qr_height + 45), display_name, fill='black', font=font_small)
    
    # Save image
    # Clean filename - remove special characters
    clean_name = ''.join(c if c.isalnum() or c in ' _-' else '' for c in name)
    clean_name = clean_name.replace(' ', '_')[:20]
    filename = f"QR_{badge:03d}_{clean_name}.png"
    filepath = os.path.join(output_dir, filename)
    final_img.save(filepath)
    
    if (i + 1) % 50 == 0:
        print(f"Generated {i + 1}/{len(participants)} QR codes...")

print(f"\n✅ Generated all {len(participants)} QR codes")

# Create zip file
zip_path = '/home/ubuntu/palitana-yatra-app/palitana_qr_codes_corrected.zip'
print(f"\nCreating zip file: {zip_path}")

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for filename in sorted(os.listdir(output_dir)):
        if filename.endswith('.png'):
            filepath = os.path.join(output_dir, filename)
            zipf.write(filepath, filename)

print(f"✅ Created zip file with {len(participants)} QR codes")
print(f"\nOutput files:")
print(f"  - QR codes directory: {output_dir}")
print(f"  - Zip file: {zip_path}")
