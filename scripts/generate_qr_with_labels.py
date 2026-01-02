#!/usr/bin/env python3
"""
Generate QR codes with name and badge number printed below the QR code
"""

import json
import os
import re
import zipfile

try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    os.system("pip3 install qrcode[pil] pillow")
    import qrcode
    from PIL import Image, ImageDraw, ImageFont

# Load participant data
with open('/home/ubuntu/palitana-yatra-app/participants_corrected.json', 'r') as f:
    participants = json.load(f)

# Sort by badge number
participants_sorted = sorted(participants, key=lambda x: x['badgeNumber'])

# Create output directory
output_dir = '/home/ubuntu/palitana-yatra-app/qr_codes_labeled'
os.makedirs(output_dir, exist_ok=True)

# Clear existing files
for f in os.listdir(output_dir):
    os.remove(os.path.join(output_dir, f))

print(f"Generating labeled QR codes for {len(participants_sorted)} participants...")

def sanitize_filename(name):
    """Remove or replace characters that are invalid in filenames"""
    name = name.replace(' ', '_')
    name = re.sub(r'[^\w\-]', '', name)
    name = re.sub(r'_+', '_', name)
    return name

# Try to use a nice font, fallback to default
try:
    # Try different font paths
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    font_large = None
    font_small = None
    for fp in font_paths:
        if os.path.exists(fp):
            font_large = ImageFont.truetype(fp, 28)
            font_small = ImageFont.truetype(fp, 22)
            break
    if font_large is None:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
except:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

generated_count = 0
for p in participants_sorted:
    badge_number = p['badgeNumber']
    name = p['name']
    qr_token = p['qrToken']
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_token)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
    qr_width, qr_height = qr_img.size
    
    # Create new image with space for text below
    padding = 20
    text_height = 80
    new_width = qr_width + padding * 2
    new_height = qr_height + text_height + padding
    
    # Create white background
    final_img = Image.new('RGB', (new_width, new_height), 'white')
    
    # Paste QR code centered
    qr_x = (new_width - qr_width) // 2
    final_img.paste(qr_img, (qr_x, padding // 2))
    
    # Add text below QR code
    draw = ImageDraw.Draw(final_img)
    
    # Badge number text
    badge_text = f"#{badge_number}"
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_large)
    badge_width = badge_bbox[2] - badge_bbox[0]
    badge_x = (new_width - badge_width) // 2
    badge_y = qr_height + padding // 2 + 5
    draw.text((badge_x, badge_y), badge_text, fill='black', font=font_large)
    
    # Name text (truncate if too long)
    display_name = name if len(name) <= 30 else name[:27] + "..."
    name_bbox = draw.textbbox((0, 0), display_name, font=font_small)
    name_width = name_bbox[2] - name_bbox[0]
    name_x = (new_width - name_width) // 2
    name_y = badge_y + 35
    draw.text((name_x, name_y), display_name, fill='black', font=font_small)
    
    # Save image
    safe_name = sanitize_filename(name)
    filename = f"{badge_number:03d}_{safe_name}.png"
    filepath = os.path.join(output_dir, filename)
    final_img.save(filepath)
    
    generated_count += 1
    if generated_count % 50 == 0:
        print(f"Generated {generated_count}/{len(participants_sorted)} QR codes...")

print(f"✅ Generated all {generated_count} labeled QR codes")

# Create zip file with files in serial order
zip_path = '/home/ubuntu/palitana-yatra-app/palitana_qr_codes_with_labels.zip'
print(f"\nCreating zip file: {zip_path}")

# Get files sorted by badge number
all_files = sorted(os.listdir(output_dir), key=lambda x: int(x.split('_')[0]))

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for filename in all_files:
        filepath = os.path.join(output_dir, filename)
        zipf.write(filepath, filename)

size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"✅ Created zip file: {zip_path} ({size_mb:.2f} MB)")

print(f"\nSample files:")
for f in all_files[:5]:
    print(f"  {f}")
print(f"  ...")
for f in all_files[-3:]:
    print(f"  {f}")
