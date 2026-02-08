#!/usr/bin/env python3
"""
Generate PWA icons for POS System
Uses the exact lucide store icon
"""

from PIL import Image, ImageDraw
import os

# Icon sizes required for PWA
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Purple gradient colors (matching theme)
COLOR_START = (124, 58, 237)  # #7c3aed
COLOR_END = (109, 40, 217)    # #6d28d9

def create_gradient_background(size):
    """Create purple gradient background"""
    image = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(image)
    
    for y in range(size):
        # Calculate gradient color
        ratio = y / size
        r = int(COLOR_START[0] + (COLOR_END[0] - COLOR_START[0]) * ratio)
        g = int(COLOR_START[1] + (COLOR_END[1] - COLOR_START[1]) * ratio)
        b = int(COLOR_START[2] + (COLOR_END[2] - COLOR_START[2]) * ratio)
        
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    return image

def add_rounded_corners(image, radius_percent=0.18):
    """Add rounded corners to image"""
    size = image.size[0]
    radius = int(size * radius_percent)
    
    # Create mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    
    # Apply mask
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(image, (0, 0))
    output.putalpha(mask)
    
    return output

def draw_store_icon(image, size):
    """Draw the lucide store icon"""
    draw = ImageDraw.Draw(image)
    
    # Scale factor (icon is 50% of canvas size, centered)
    scale = size * 0.5 / 24
    offset = size * 0.25
    
    # Stroke width (scaled)
    stroke_width = max(2, int(2.5 * scale / 10))
    
    # Store icon paths (lucide store icon)
    # Simplified version - drawing basic store shape
    
    # Store roof (top triangle)
    points = [
        (offset + 12 * scale, offset + 3 * scale),  # Top center
        (offset + 2 * scale, offset + 7 * scale),   # Left
        (offset + 22 * scale, offset + 7 * scale),  # Right
    ]
    draw.line(points + [points[0]], fill='white', width=stroke_width)
    
    # Store base (rectangle)
    draw.rectangle([
        (offset + 2 * scale, offset + 7 * scale),
        (offset + 22 * scale, offset + 21 * scale)
    ], outline='white', width=stroke_width)
    
    # Vertical lines
    for x in [2, 22]:
        draw.line([
            (offset + x * scale, offset + 7 * scale),
            (offset + x * scale, offset + 13 * scale)
        ], fill='white', width=stroke_width)
    
    # Door
    draw.rectangle([
        (offset + 9 * scale, offset + 17 * scale),
        (offset + 15 * scale, offset + 21 * scale)
    ], outline='white', width=stroke_width)
    
    return image

def generate_icon(size):
    """Generate a single icon"""
    # Create gradient background
    image = create_gradient_background(size)
    
    # Add rounded corners
    image = add_rounded_corners(image, 0.18)
    
    # Draw store icon
    image = draw_store_icon(image, size)
    
    return image

def main():
    """Generate all icons"""
    output_dir = 'assets/icons'
    os.makedirs(output_dir, exist_ok=True)
    
    print("🎨 Generating PWA icons...")
    print(f"📁 Output directory: {output_dir}")
    print()
    
    for size in SIZES:
        filename = f'icon-{size}x{size}.png'
        filepath = os.path.join(output_dir, filename)
        
        print(f"⏳ Generating {filename}...")
        
        try:
            icon = generate_icon(size)
            icon.save(filepath, 'PNG')
            print(f"✅ Saved {filename}")
        except Exception as e:
            print(f"❌ Error generating {filename}: {e}")
    
    print()
    print("🎉 All icons generated successfully!")
    print(f"📍 Icons saved in: {output_dir}")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("❌ Error: PIL (Pillow) not installed")
        print("📦 Install with: pip install Pillow")
        print("   or: python -m pip install Pillow")
