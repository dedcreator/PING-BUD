import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_font(size, bold=False):
    font_paths = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/SFNS.ttf',
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_bolt(draw, x, y, size=14, color=(45, 212, 191, 255)):
    s = size / 14.0
    pts = [
        (x + 7*s, y),
        (x + 2*s, y + 8*s),
        (x + 6*s, y + 8*s),
        (x + 4*s, y + 14*s),
        (x + 12*s, y + 5*s),
        (x + 7*s, y + 5*s),
    ]
    draw.polygon(pts, fill=color)

def create_brand_suite():
    src_mascot = '/Users/apple/.gemini/antigravity-cli/brain/29f0c594-b5a2-4143-8e9f-57b1074cbf1d/pingbud_mascot_1793280241761.jpg'
    img = Image.open(src_mascot).convert('RGBA')

    os.makedirs('frontend/public', exist_ok=True)
    os.makedirs('frontend/src/app', exist_ok=True)

    # 1. Full Mascot
    img.save('frontend/public/pingbud-mascot.png', format='PNG')
    img.save('frontend/public/logo-mascot.png', format='PNG')
    print('Saved full mascot')

    # 2. Tight Head Crop (Visor focus) for favicons
    head_crop = img.crop((180, 90, 844, 754))
    head_crop.save('frontend/public/pingbud-head.png', format='PNG')

    # Avatar Crop (Head + shoulders) for circular badge
    avatar_crop = img.crop((112, 80, 912, 880))
    avatar_512 = avatar_crop.resize((512, 512), Image.Resampling.LANCZOS)
    avatar_512.save('frontend/public/pingbud-avatar.png', format='PNG')
    avatar_512.save('frontend/public/logo.png', format='PNG')

    # 3. Favicon PNGs
    fav16 = head_crop.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save('frontend/public/favicon-16x16.png', format='PNG')

    fav32 = head_crop.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save('frontend/public/favicon-32x32.png', format='PNG')

    fav48 = head_crop.resize((48, 48), Image.Resampling.LANCZOS)
    fav64 = head_crop.resize((64, 64), Image.Resampling.LANCZOS)

    # 4. Multi-resolution ICO
    head_crop.save(
        'frontend/public/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    head_crop.save(
        'frontend/src/app/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print('Saved favicon.ico')

    # 5. App Icons for Next.js App Router
    apple_icon = avatar_crop.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('frontend/public/apple-touch-icon.png', format='PNG')
    apple_icon.save('frontend/src/app/apple-icon.png', format='PNG')

    icon_512 = avatar_crop.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save('frontend/src/app/icon.png', format='PNG')
    print('Saved Next.js icons')

    # 6. Render High-Resolution OG Image (1200 x 630)
    W, H = 1200, 630
    og = Image.new('RGBA', (W, H), (11, 17, 32, 255))
    draw = ImageDraw.Draw(og)

    # Gradient background
    for y in range(H):
        ratio = y / H
        r = int(12 * (1 - ratio * 0.4))
        g = int(19 * (1 - ratio * 0.4))
        b = int(35 * (1 - ratio * 0.35))
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Tech grid pattern in background
    grid_color = (20, 184, 166, 18) # teal 7% opacity
    grid_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_img)
    grid_step = 40
    for x in range(0, W, grid_step):
        grid_draw.line([(x, 0), (x, H)], fill=grid_color, width=1)
    for y in range(0, H, grid_step):
        grid_draw.line([(0, y), (W, y)], fill=grid_color, width=1)
    og = Image.alpha_composite(og, grid_img)

    # Radial ambient teal glow behind mascot (around x=920, y=315)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = 920, 315
    for radius in range(380, 0, -20):
        alpha = int(42 * (1 - radius / 380))
        glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(20, 184, 166, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    og = Image.alpha_composite(og, glow)

    # Place Mascot on the Right
    mascot_size = 460
    mascot_resized = avatar_crop.resize((mascot_size, mascot_size), Image.Resampling.LANCZOS)
    
    # Create circular mask
    mask = Image.new('L', (mascot_size, mascot_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, mascot_size, mascot_size], fill=255)

    mascot_circ = Image.new('RGBA', (mascot_size, mascot_size), (0, 0, 0, 0))
    mascot_circ.paste(mascot_resized, (0, 0), mask=mask)

    mx = 680
    my = (H - mascot_size) // 2

    # Draw glowing rings around mascot
    hud_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    hud_draw = ImageDraw.Draw(hud_overlay)
    
    # Outer ring
    hud_draw.ellipse([mx - 16, my - 16, mx + mascot_size + 16, my + mascot_size + 16], outline=(20, 184, 166, 80), width=2)
    # Target brackets
    hud_draw.arc([mx - 28, my - 28, mx + mascot_size + 28, my + mascot_size + 28], start=30, end=60, fill=(45, 212, 191, 200), width=3)
    hud_draw.arc([mx - 28, my - 28, mx + mascot_size + 28, my + mascot_size + 28], start=120, end=150, fill=(45, 212, 191, 200), width=3)
    hud_draw.arc([mx - 28, my - 28, mx + mascot_size + 28, my + mascot_size + 28], start=210, end=240, fill=(45, 212, 191, 200), width=3)
    hud_draw.arc([mx - 28, my - 28, mx + mascot_size + 28, my + mascot_size + 28], start=300, end=330, fill=(45, 212, 191, 200), width=3)

    # Inner crisp ring
    hud_draw.ellipse([mx - 2, my - 2, mx + mascot_size + 2, my + mascot_size + 2], outline=(45, 212, 191, 240), width=3)
    
    og = Image.alpha_composite(og, hud_overlay)
    og.paste(mascot_circ, (mx, my), mask=mascot_circ)

    # Floating HUD Badges over / beside mascot
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)

    font_badge = get_font(14, bold=True)

    # Top Status Pill
    b1_x, b1_y = 650, my - 14
    draw_ov.rounded_rectangle([b1_x, b1_y, b1_x + 248, b1_y + 36], radius=18, fill=(15, 23, 42, 235), outline=(16, 185, 129, 210), width=2)
    draw_ov.ellipse([b1_x + 14, b1_y + 13, b1_x + 24, b1_y + 23], fill=(16, 185, 129, 255)) # Green dot
    draw_ov.text((b1_x + 32, b1_y + 10), "ALL SYSTEMS OPERATIONAL", fill=(241, 245, 249, 255), font=font_badge)

    # Bottom Consensus Pill
    b2_x, b2_y = 660, my + mascot_size - 22
    draw_ov.rounded_rectangle([b2_x, b2_y, b2_x + 475, b2_y + 40], radius=20, fill=(15, 23, 42, 245), outline=(20, 184, 166, 200), width=2)
    draw_bolt(draw_ov, b2_x + 16, b2_y + 12, size=15, color=(45, 212, 191, 255))
    draw_ov.text((b2_x + 36, b2_y + 11), "CONSENSUS: 100%  •  4/4 ACTIVE EDGE PROBES", fill=(45, 212, 191, 255), font=font_badge)

    # Left Side: Branding & Value Props
    font_brand = get_font(15, bold=True)
    font_h1 = get_font(54, bold=True)
    font_h1_sub = get_font(54, bold=True)
    font_desc = get_font(19, bold=False)
    font_pill = get_font(14, bold=True)
    font_footer = get_font(14, bold=False)

    lx = 75
    ly = 85

    # Brand Chip: [ PINGBUD.US  •  UPTIME BUDDY ]
    draw_ov.rounded_rectangle([lx, ly, lx + 330, ly + 36], radius=8, fill=(20, 184, 166, 35), outline=(20, 184, 166, 120), width=1)
    draw_ov.ellipse([lx + 14, ly + 13, lx + 24, ly + 23], fill=(45, 212, 191, 255))
    draw_ov.text((lx + 32, ly + 9), "PINGBUD.US  •  UPTIME BUDDY", fill=(45, 212, 191, 255), font=font_brand)

    # Headline
    ly += 65
    draw_ov.text((lx, ly), "Never miss an outage.", fill=(255, 255, 255, 255), font=font_h1)
    ly += 62
    draw_ov.text((lx, ly), "Meet your 24/7 Buddy.", fill=(45, 212, 191, 255), font=font_h1_sub)

    # Description
    ly += 76
    draw_ov.text((lx, ly), "Multi-region edge consensus, sub-30s heartbeat checks,", fill=(148, 163, 184, 255), font=font_desc)
    ly += 28
    draw_ov.text((lx, ly), "and instant Telegram alerts without the $80/month bloat.", fill=(148, 163, 184, 255), font=font_desc)

    # Key Value Badges
    ly += 54
    badges = [
        ("N2,000 / mo Indie Pro", (13, 148, 136, 65), (45, 212, 191, 230), (240, 253, 250, 255)),
        ("Multi-Region Consensus", (30, 41, 59, 190), (71, 85, 105, 190), (226, 232, 240, 255)),
        ("Free Telegram Alerts", (30, 41, 59, 190), (71, 85, 105, 190), (226, 232, 240, 255)),
    ]

    bx = lx
    for text, bg_c, border_c, text_c in badges:
        bbox = draw_ov.textbbox((0, 0), text, font=font_pill)
        tw = bbox[2] - bbox[0]
        pad_x = 18
        bw = tw + pad_x * 2
        draw_ov.rounded_rectangle([bx, ly, bx + bw, ly + 36], radius=18, fill=bg_c, outline=border_c, width=1)
        draw_ov.text((bx + pad_x, ly + 9), text, fill=text_c, font=font_pill)
        bx += bw + 14

    # Footer Tech Specs with drawn bolt
    ly += 60
    draw_bolt(draw_ov, lx, ly + 2, size=14, color=(45, 212, 191, 255))
    draw_ov.text((lx + 20, ly), "18ms Edge Latency  •  SQLite WAL  •  Sub-120MB RAM  •  Zero Overhead", fill=(148, 163, 184, 255), font=font_footer)

    og = Image.alpha_composite(og, overlay)

    # Save OG images
    og.convert('RGB').save('frontend/public/og-image.png', format='PNG', quality=95)
    og.convert('RGB').save('frontend/src/app/opengraph-image.png', format='PNG', quality=95)
    print('Updated og-image.png (1200x630)')

if __name__ == '__main__':
    create_brand_suite()
