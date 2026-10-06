from PIL import Image, ImageDraw

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#08080a"/>
  <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="#ff6600" stroke-width="1.5" stroke-opacity="0.4"/>
  <!-- Overload 6DOF Tactical Reticle / Chevron -->
  <path d="M32 10 L48 30 L40 30 L32 20 L24 30 L16 30 Z" fill="#ff6600"/>
  <path d="M32 26 L46 44 L38 44 L32 36 L26 44 L18 44 Z" fill="#ff8533" opacity="0.85"/>
  <polygon points="32,46 36,52 32,58 28,52" fill="#ffaa66"/>
  <!-- Crosshair tick marks -->
  <line x1="8" y1="32" x2="12" y2="32" stroke="#ff6600" stroke-width="2" stroke-linecap="round"/>
  <line x1="52" y1="32" x2="56" y2="32" stroke="#ff6600" stroke-width="2" stroke-linecap="round"/>
</svg>"""

with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

images = []
for size in [16, 32, 48, 64]:
    img = Image.new('RGBA', (size, size), (8, 8, 10, 255))
    draw = ImageDraw.Draw(img)
    s = size / 64.0
    
    # Outer border
    draw.rounded_rectangle([1*s, 1*s, 62*s, 62*s], radius=int(12*s), outline=(255, 102, 0, 120), width=max(1, int(1.5*s)))
    
    # Chevron 1
    poly1 = [(32*s, 10*s), (48*s, 30*s), (40*s, 30*s), (32*s, 20*s), (24*s, 30*s), (16*s, 30*s)]
    draw.polygon(poly1, fill=(255, 102, 0, 255))
    
    # Chevron 2
    poly2 = [(32*s, 26*s), (46*s, 44*s), (38*s, 44*s), (32*s, 36*s), (26*s, 44*s), (18*s, 44*s)]
    draw.polygon(poly2, fill=(255, 133, 51, 230))
    
    # Center diamond
    poly3 = [(32*s, 46*s), (36*s, 52*s), (32*s, 58*s), (28*s, 52*s)]
    draw.polygon(poly3, fill=(255, 170, 102, 255))
    
    # Side ticks
    draw.line([(8*s, 32*s), (12*s, 32*s)], fill=(255, 102, 0, 255), width=max(1, int(2*s)))
    draw.line([(52*s, 32*s), (56*s, 32*s)], fill=(255, 102, 0, 255), width=max(1, int(2*s)))
    images.append(img)

images[0].save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)], append_images=images[1:])
print('Favicon files generated successfully in public/')
