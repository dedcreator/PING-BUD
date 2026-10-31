import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_unique_sentinel():
    print("🛡️ Synthesizing Original Black & White Sentinel Emblem for Sentiro (sentiro.xyz)...")
    
    # SVG Dimensions: 1000 x 1000 viewBox
    # We will build pure mathematical SVG vector paths with high-contrast monochrome design.
    # Color palette:
    # Outer disc: #FFFFFF (crisp white)
    # Outer ring: #0D9488 or #14B8A6 subtle accent
    # Sentinel Body: Pure obsidian black (#0A0F1D)
    # Visor & Eye Cutouts: Pure white negative space (#FFFFFF) with teal heartbeat pulse

    # 1. HELM MAIN SILHOUETTE (Outer contour)
    # A formidable, sleek, geometric cyber-sentinel helm:
    # Symmetrical points around center x = 500
    helm_points = [
        # Top apex crest
        (500, 150),
        # Swept antenna fin right
        (560, 190),
        (620, 160),  # Right horn tip
        (595, 250),  # Right notch
        (680, 280),  # Right upper shoulder
        (720, 390),  # Right temple flare
        (710, 520),  # Right upper jaw
        (660, 660),  # Right lower cheek
        (590, 770),  # Right chin taper
        (500, 840),  # Chin point
        (410, 770),  # Left chin taper
        (340, 660),  # Left lower cheek
        (290, 520),  # Left upper jaw
        (280, 390),  # Left temple flare
        (320, 280),  # Left upper shoulder
        (405, 250),  # Left notch
        (380, 160),  # Left horn tip
        (440, 190),  # Swept antenna fin left
    ]
    helm_path_d = "M " + " L ".join([f"{p[0]} {p[1]}" for p in helm_points]) + " Z"

    # 2. VISOR HORIZONTAL CUTOUT (Negative space - white)
    # A wide cybernetic visor spanning across the eyes
    # Symmetrical chevron visor slit
    visor_points = [
        (340, 470),
        (460, 485),
        (500, 495),
        (540, 485),
        (660, 470),
        (645, 520),
        (540, 540),
        (500, 550),
        (460, 540),
        (355, 520),
    ]
    visor_path_d = "M " + " L ".join([f"{p[0]} {p[1]}" for p in visor_points]) + " Z"

    # 3. FOREHEAD SENSOR SLITS (Telemetry array in brow)
    # Right sensor slot
    brow_right = [
        (530, 340),
        (610, 330),
        (630, 365),
        (545, 375),
    ]
    brow_right_d = "M " + " L ".join([f"{p[0]} {p[1]}" for p in brow_right]) + " Z"

    # Left sensor slot
    brow_left = [
        (470, 340),
        (390, 330),
        (370, 365),
        (455, 375),
    ]
    brow_left_d = "M " + " L ".join([f"{p[0]} {p[1]}" for p in brow_left]) + " Z"

    # 4. CHIN AIR / TELEMETRY VENTS
    chin_vents = [
        # Center vertical slit
        "M 493 630 L 507 630 L 507 720 L 493 720 Z",
        # Right angled vent
        "M 535 640 L 550 635 L 565 705 L 550 710 Z",
        # Left angled vent
        "M 465 640 L 450 635 L 435 705 L 450 710 Z",
    ]

    # 5. ORBITAL CONSENSUS RADAR BRACKETS (Flanking telemetry arcs)
    # Outer concentric radar shields that evoke multi-region synthetic consensus
    # Right arc
    arc_right = "M 760 320 C 810 390 835 480 835 560 C 835 630 810 700 770 755 L 735 730 C 770 680 790 620 790 560 C 790 495 770 425 730 365 Z"
    arc_left = "M 240 320 C 190 390 165 480 165 560 C 165 630 190 700 230 755 L 265 730 C 230 680 210 620 210 560 C 210 495 230 425 270 365 Z"

    # 6. CENTRAL HEARTBEAT / PING OSCILLOSCOPE in the visor
    # Teal glowing pulse wave centered in the visor:
    # Flat -> tiny dip -> sharp spike -> rebound -> flat
    pulse_line = "M 370 500 L 440 500 L 460 500 L 475 515 L 490 445 L 510 550 L 525 485 L 540 500 L 630 500"

    # Compile the Master SVG (Black & White high contrast disc badge)
    svg_badge = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <defs>
    <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- High-Contrast Clean White Disc with Sleek Precision Rim -->
  <circle cx="500" cy="500" r="485" fill="#FFFFFF" stroke="#0F172A" stroke-width="12"/>
  <circle cx="500" cy="500" r="468" fill="none" stroke="#14B8A6" stroke-width="6" opacity="0.85"/>

  <!-- Orbital Consensus Telemetry Arcs (Pure Obsidian Black) -->
  <path d="{arc_right}" fill="#0A0F1D"/>
  <path d="{arc_left}" fill="#0A0F1D"/>

  <!-- Main Sentinel Helm Body (Pure Obsidian Black) -->
  <path d="{helm_path_d}" fill="#0A0F1D"/>

  <!-- Forehead Telemetry Sensor Slits (Pure White Cutouts) -->
  <path d="{brow_right_d}" fill="#FFFFFF"/>
  <path d="{brow_left_d}" fill="#FFFFFF"/>

  <!-- Chin Telemetry Vents (Pure White Cutouts) -->
  <path d="{chin_vents[0]}" fill="#FFFFFF"/>
  <path d="{chin_vents[1]}" fill="#FFFFFF"/>
  <path d="{chin_vents[2]}" fill="#FFFFFF"/>

  <!-- Cyber Visor Aperture (Pure White Cutout) -->
  <path d="{visor_path_d}" fill="#FFFFFF"/>

  <!-- Visor Heartbeat Synthetic Ping Wave (Vibrant Teal) -->
  <path d="{pulse_line}" stroke="#0D9488" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Focus ping core diamond -->
  <polygon points="500,440 508,455 500,470 492,455" fill="#14B8A6"/>
</svg>'''

    # Dark Theme Master SVG (For dark background headers / standalone icon)
    svg_dark_badge = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <!-- Deep Obsidian Shield Disc -->
  <circle cx="500" cy="500" r="485" fill="#090D16" stroke="#1E293B" stroke-width="12"/>
  <circle cx="500" cy="500" r="468" fill="none" stroke="#14B8A6" stroke-width="6" opacity="0.6"/>

  <!-- Orbital Consensus Telemetry Arcs (Pure White) -->
  <path d="{arc_right}" fill="#F8FAFC"/>
  <path d="{arc_left}" fill="#F8FAFC"/>

  <!-- Main Sentinel Helm Body (Pure White) -->
  <path d="{helm_path_d}" fill="#F8FAFC"/>

  <!-- Forehead Telemetry Sensor Slits (Deep Obsidian Cutouts) -->
  <path d="{brow_right_d}" fill="#090D16"/>
  <path d="{brow_left_d}" fill="#090D16"/>

  <!-- Chin Telemetry Vents (Deep Obsidian Cutouts) -->
  <path d="{chin_vents[0]}" fill="#090D16"/>
  <path d="{chin_vents[1]}" fill="#090D16"/>
  <path d="{chin_vents[2]}" fill="#090D16"/>

  <!-- Cyber Visor Aperture (Deep Obsidian Cutout) -->
  <path d="{visor_path_d}" fill="#090D16"/>

  <!-- Visor Heartbeat Synthetic Ping Wave (Vibrant Teal) -->
  <path d="{pulse_line}" stroke="#14B8A6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Focus ping core diamond -->
  <polygon points="500,440 508,455 500,470 492,455" fill="#14B8A6"/>
</svg>'''

    # Pure Icon (CurrentColor for SVG scaling)
    svg_icon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <path d="{arc_right}" fill="currentColor"/>
  <path d="{arc_left}" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="{helm_path_d} {visor_path_d} {brow_right_d} {brow_left_d} {chin_vents[0]} {chin_vents[1]} {chin_vents[2]}" fill="currentColor"/>
  <path d="{pulse_line}" stroke="#14B8A6" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

    os.makedirs("frontend/public", exist_ok=True)
    os.makedirs("frontend/src/app", exist_ok=True)

    with open("frontend/public/logo-badge.svg", "w") as f:
        f.write(svg_badge)
    with open("frontend/public/logo-icon.svg", "w") as f:
        f.write(svg_icon)
    with open("frontend/public/logo-dark.svg", "w") as f:
        f.write(svg_dark_badge)

    # Full Horizontal SVG Logo Lockup (Icon + Typography + sentiro.xyz)
    full_logo_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 100" fill="none">
  <g transform="translate(10, 10) scale(0.08)">
    <circle cx="500" cy="500" r="485" fill="#FFFFFF" stroke="#0F172A" stroke-width="12"/>
    <circle cx="500" cy="500" r="468" fill="none" stroke="#14B8A6" stroke-width="6" opacity="0.85"/>
    <path d="{arc_right}" fill="#0A0F1D"/>
    <path d="{arc_left}" fill="#0A0F1D"/>
    <path d="{helm_path_d}" fill="#0A0F1D"/>
    <path d="{brow_right_d}" fill="#FFFFFF"/>
    <path d="{brow_left_d}" fill="#FFFFFF"/>
    <path d="{chin_vents[0]}" fill="#FFFFFF"/>
    <path d="{chin_vents[1]}" fill="#FFFFFF"/>
    <path d="{chin_vents[2]}" fill="#FFFFFF"/>
    <path d="{visor_path_d}" fill="#FFFFFF"/>
    <path d="{pulse_line}" stroke="#0D9488" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="500,440 508,455 500,470 492,455" fill="#14B8A6"/>
  </g>
  <text x="108" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="34" letter-spacing="-1" fill="#FFFFFF">sent<tspan fill="#14B8A6">iro</tspan></text>
  <text x="110" y="73" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="600" font-size="11" letter-spacing="1.5" fill="#94A3B8">UPTIME &amp; CONSENSUS SENTINEL</text>
  <g transform="translate(325, 30)">
    <rect width="84" height="22" rx="6" fill="#0F172A" stroke="#14B8A6" stroke-width="1.2"/>
    <text x="42" y="15" font-family="monospace" font-weight="700" font-size="11" fill="#2DD4BF" text-anchor="middle">sentiro.xyz</text>
  </g>
</svg>'''
    with open("frontend/public/logo.svg", "w") as f:
        f.write(full_logo_svg)

    print("✅ Saved SVG assets: logo-badge.svg, logo-icon.svg, logo-dark.svg, logo.svg")

    # High-Resolution Raster Generation via Supersampling (2048x2048 -> down to target sizes)
    # We will render the high-contrast B&W Sentinel badge accurately using PIL drawing primitives
    print("🎨 Rendering supersampled ultra-crisp raster suite (2048x2048 base)...")
    dim = 2048
    s = dim / 1000.0  # scale factor

    def scale_pts(pts):
        return [(round(x * s), round(y * s)) for x, y in pts]

    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. White Disc
    r_outer = round(485 * s)
    cx, cy = dim // 2, dim // 2
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=(255, 255, 255, 255), outline=(15, 23, 42, 255), width=round(12 * s))

    # Teal inner accent ring
    r_inner = round(468 * s)
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=(20, 184, 166, 210), width=round(6 * s))

    # 2. Arcs (approximate with smooth polygon/curves or thick pie slices)
    # Let's draw arcs using bezier/sampled points
    def draw_path_polygon(pts, fill_color):
        draw.polygon(scale_pts(pts), fill=fill_color)

    # Radar brackets (polygonal sampling)
    # Right arc
    t_vals = np.linspace(0, 1, 30)
    # Outer curve
    pts_arc_r_outer = []
    for t in t_vals:
        # cubic bezier from (760, 320) through (810, 390), (835, 480) to (835, 560)
        # We can calculate cubic bezier
        p0 = np.array([760, 320])
        p1 = np.array([825, 420])
        p2 = np.array([835, 560])
        p = (1-t)**2 * p0 + 2*(1-t)*t * p1 + t**2 * p2
        pts_arc_r_outer.append((p[0], p[1]))
    for t in t_vals:
        p0 = np.array([835, 560])
        p1 = np.array([820, 680])
        p2 = np.array([770, 755])
        p = (1-t)**2 * p0 + 2*(1-t)*t * p1 + t**2 * p2
        pts_arc_r_outer.append((p[0], p[1]))

    pts_arc_r_inner = []
    for t in t_vals:
        p0 = np.array([735, 730])
        p1 = np.array([785, 620])
        p2 = np.array([785, 560])
        p = (1-t)**2 * p0 + 2*(1-t)*t * p1 + t**2 * p2
        pts_arc_r_inner.append((p[0], p[1]))
    for t in t_vals:
        p0 = np.array([785, 560])
        p1 = np.array([770, 440])
        p2 = np.array([730, 365])
        p = (1-t)**2 * p0 + 2*(1-t)*t * p1 + t**2 * p2
        pts_arc_r_inner.append((p[0], p[1]))

    arc_r_pts = pts_arc_r_outer + pts_arc_r_inner
    draw.polygon(scale_pts(arc_r_pts), fill=(10, 15, 29, 255))

    # Mirror for left arc
    arc_l_pts = [(1000 - x, y) for x, y in arc_r_pts]
    draw.polygon(scale_pts(arc_l_pts), fill=(10, 15, 29, 255))

    # 3. Main Helm Body (Pure Obsidian Black)
    draw.polygon(scale_pts(helm_points), fill=(10, 15, 29, 255))

    # 4. Forehead Slits (Pure White)
    draw.polygon(scale_pts(brow_right), fill=(255, 255, 255, 255))
    draw.polygon(scale_pts(brow_left), fill=(255, 255, 255, 255))

    # 5. Chin Vents (Pure White)
    chin_v1 = [(493, 630), (507, 630), (507, 720), (493, 720)]
    chin_v2 = [(535, 640), (550, 635), (565, 705), (550, 710)]
    chin_v3 = [(465, 640), (450, 635), (435, 705), (450, 710)]
    draw.polygon(scale_pts(chin_v1), fill=(255, 255, 255, 255))
    draw.polygon(scale_pts(chin_v2), fill=(255, 255, 255, 255))
    draw.polygon(scale_pts(chin_v3), fill=(255, 255, 255, 255))

    # 6. Visor Aperture (Pure White)
    draw.polygon(scale_pts(visor_points), fill=(255, 255, 255, 255))

    # 7. Visor Heartbeat Oscilloscope Pulse (Teal)
    pulse_pts = [
        (370, 500), (440, 500), (460, 500), (475, 515),
        (490, 445), (510, 550), (525, 485), (540, 500), (630, 500)
    ]
    draw.line(scale_pts(pulse_pts), fill=(13, 148, 136, 255), width=round(12 * s), joint="curve")

    # Central Ping Diamond Core
    diamond = [(500, 440), (508, 455), (500, 470), (492, 455)]
    draw.polygon(scale_pts(diamond), fill=(20, 184, 166, 255))

    # Now downsample with high-quality Lanczos resampling
    print("📐 Generating all required brand resolutions...")
    sizes = {
        "frontend/public/sentiro-avatar.png": (512, 512),
        "frontend/public/logo.png": (512, 512),
        "frontend/public/apple-touch-icon.png": (180, 180),
        "frontend/public/apple-touch-icon-precomposed.png": (180, 180),
        "frontend/public/icon.png": (512, 512),
        "frontend/public/favicon-32x32.png": (32, 32),
        "frontend/public/favicon-16x16.png": (16, 16),
        "frontend/src/app/icon.png": (512, 512),
        "frontend/src/app/apple-icon.png": (180, 180),
    }

    for path, (w, h) in sizes.items():
        resized = img.resize((w, h), Image.Resampling.LANCZOS)
        resized.save(path, "PNG", optimize=True)
        print(f"  ✓ Saved {path} ({w}x{h})")

    # Generate ICO file
    ico_img = img.resize((32, 32), Image.Resampling.LANCZOS)
    ico_img.save("frontend/public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    ico_img.save("frontend/src/app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("  ✓ Saved favicon.ico")

    # Generate Horizontal Banner / OpenGraph Image (1200 x 630)
    print("🖼️ Generating 1200x630 OG Banner for sentiro.xyz...")
    og = Image.new("RGBA", (1200, 630), (11, 17, 32, 255))
    og_draw = ImageDraw.Draw(og)

    # Grid lines / cyber matrix background
    for y in range(0, 630, 45):
        og_draw.line([(0, y), (1200, y)], fill=(17, 26, 46, 160), width=1)
    for x in range(0, 1200, 45):
        og_draw.line([(x, 0), (x, 630)], fill=(17, 26, 46, 160), width=1)

    # Emblem on the left
    badge_360 = img.resize((360, 360), Image.Resampling.LANCZOS)
    og.paste(badge_360, (100, 135), badge_360)

    # High-contrast typography on the right
    # Try finding system fonts or fall back to default
    font_path = "/System/Library/Fonts/SFPro-Bold.ttf"
    if not os.path.exists(font_path):
        font_path = "/System/Library/Fonts/Helvetica.ttc"
    
    try:
        title_font = ImageFont.truetype(font_path, 80)
        subtitle_font = ImageFont.truetype(font_path, 34)
        tag_font = ImageFont.truetype(font_path, 22)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        tag_font = ImageFont.load_default()

    og_draw.text((500, 160), "sentiro", font=title_font, fill=(255, 255, 255, 255))
    # SRE tag badge
    og_draw.rectangle([760, 180, 840, 225], fill=(20, 184, 166, 40), outline=(20, 184, 166, 200), width=2)
    og_draw.text((775, 192), "SRE", font=tag_font, fill=(20, 184, 166, 255))

    og_draw.text((500, 265), "Your 24/7 IT Sentinel", font=subtitle_font, fill=(20, 184, 166, 255))
    og_draw.text((500, 320), "Ultra-Lean Synthetic Uptime & Consensus Probes", font=tag_font, fill=(148, 163, 184, 255))
    og_draw.text((500, 360), "Sub-30s heartbeats • Multi-Region Edge • sentiro.xyz", font=tag_font, fill=(100, 116, 139, 255))

    # Live operational status pill
    og_draw.rounded_rectangle([500, 420, 840, 465], radius=10, fill=(15, 23, 42, 255), outline=(30, 41, 59, 255), width=2)
    og_draw.ellipse([520, 437, 532, 449], fill=(16, 185, 129, 255))
    og_draw.text((545, 432), "99.99% Consensus Probes Operational", font=tag_font, fill=(241, 245, 249, 255))

    og.save("frontend/public/og-image.png", "PNG", optimize=True)
    og.save("frontend/src/app/opengraph-image.png", "PNG", optimize=True)
    print("  ✓ Saved og-image.png (1200x630)")

    print("✨ Sentiro Brand Suite synthesis complete!")

if __name__ == "__main__":
    create_unique_sentinel()
