import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def build_robotic_sentinel():
    print("🤖 Processing Robotic Sentinel Brand Assets...")
    
    # Selected: Variant 1 (Dynamic 3/4 robotic Sentinel helm)
    src_path = '/Users/apple/.gemini/antigravity-cli/brain/29f0c594-b5a2-4143-8e9f-57b1074cbf1d/pipbud_sentinel_logo_1793287620011.jpg'
    img = Image.open(src_path).convert('RGBA')

    os.makedirs('frontend/public', exist_ok=True)
    os.makedirs('frontend/src/app', exist_ok=True)

    # 1. Master Logo Files
    img.save('frontend/public/pipbud-sentinel.png', format='PNG')
    img.save('frontend/public/logo.png', format='PNG')
    img.save('frontend/public/pipbud-badge.png', format='PNG')

    # 2. Extract circular mask for clean transparency outside the glowing rim
    W, H = img.size
    mask = Image.new('L', (W, H), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.ellipse([22, 22, W - 22, H - 22], fill=255)
    
    badge_trans = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    badge_trans.paste(img, (0, 0), mask=mask)
    badge_trans.save('frontend/public/pipbud-avatar.png', format='PNG')

    # 3. Favicon Assets
    fav16 = badge_trans.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save('frontend/public/favicon-16x16.png', format='PNG')

    fav32 = badge_trans.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save('frontend/public/favicon-32x32.png', format='PNG')

    apple_icon = badge_trans.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('frontend/public/apple-touch-icon.png', format='PNG')
    apple_icon.save('frontend/src/app/apple-icon.png', format='PNG')

    app_icon_512 = badge_trans.resize((512, 512), Image.Resampling.LANCZOS)
    app_icon_512.save('frontend/src/app/icon.png', format='PNG')

    # Multi-resolution ICO
    badge_trans.save(
        'frontend/public/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    badge_trans.save(
        'frontend/src/app/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("✅ Favicons and app icons generated")

    # 4. Generate Open Graph Image for PipBud (1200 x 630)
    OG_W, OG_H = 1200, 630
    og = Image.new('RGBA', (OG_W, OG_H), (9, 13, 22, 255))
    draw = ImageDraw.Draw(og)

    # Subtle background gradient
    for y in range(OG_H):
        ratio = y / OG_H
        r = int(9 * (1 - ratio * 0.3))
        g = int(13 * (1 - ratio * 0.3))
        b = int(22 * (1 - ratio * 0.25))
        draw.line([(0, y), (OG_W, y)], fill=(r, g, b, 255))

    # Tech grid pattern in background
    grid_img = Image.new('RGBA', (OG_W, OG_H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_img)
    grid_color = (20, 184, 166, 16)
    for x in range(0, OG_W, 40):
        g_draw.line([(x, 0), (x, OG_H)], fill=grid_color, width=1)
    for y in range(0, OG_H, 40):
        g_draw.line([(0, y), (OG_W, y)], fill=grid_color, width=1)
    og = Image.alpha_composite(og, grid_img)

    # Radial ambient teal glow behind Sentinel on the right
    glow = Image.new('RGBA', (OG_W, OG_H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = 920, 315
    for radius in range(360, 0, -20):
        alpha = int(45 * (1 - radius / 360))
        glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(20, 184, 166, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    og = Image.alpha_composite(og, glow)

    # Place Robotic Sentinel Mascot on the right
    mascot_size = 460
    mascot_sm = badge_trans.resize((mascot_size, mascot_size), Image.Resampling.LANCZOS)
    mx = 680
    my = (OG_H - mascot_size) // 2
    og.paste(mascot_sm, (mx, my), mask=mascot_sm)

    # Floating HUD status pills over / around mascot
    overlay = Image.new('RGBA', (OG_W, OG_H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    font_badge = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 13)
    font_hero = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 60)
    font_sub = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 22)
    font_tagline = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 16)
    font_logo_text = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 26)

    # Top Status Pill
    b1_x, b1_y = 660, my - 16
    ov_draw.rounded_rectangle([b1_x, b1_y, b1_x + 230, b1_y + 34], radius=17, fill=(15, 23, 42, 230), outline=(16, 185, 129, 210), width=1)
    ov_draw.ellipse([b1_x + 14, b1_y + 12, b1_x + 24, b1_y + 22], fill=(16, 185, 129, 255))
    ov_draw.text((b1_x + 32, b1_y + 9), "SENTINEL ACTIVE • 0ms", fill=(241, 245, 249, 255), font=font_badge)

    # Bottom Consensus Pill
    b2_x, b2_y = 680, my + mascot_size - 18
    ov_draw.rounded_rectangle([b2_x, b2_y, b2_x + 380, b2_y + 36], radius=18, fill=(15, 23, 42, 240), outline=(20, 184, 166, 200), width=1)
    ov_draw.text((b2_x + 18, b2_y + 10), "CONSENSUS: 100% OPERATIONAL", fill=(45, 212, 191, 255), font=font_badge)

    # Left Side: Typography & Branding
    lx = 75
    ly = 75

    # Brand Chip: [ PipBud • The Sentinel ]
    mini_badge = badge_trans.resize((40, 40), Image.Resampling.LANCZOS)
    og.paste(mini_badge, (lx, ly), mask=mini_badge)
    ov_draw.text((lx + 52, ly + 6), "PipBud", fill=(255, 255, 255, 255), font=font_logo_text)
    ov_draw.text((lx + 155, ly + 13), "•  UPTIME SENTINEL", fill=(45, 212, 191, 255), font=font_badge)

    # Big Minimalist Hero
    ly += 90
    ov_draw.text((lx, ly), "zero downtime.", fill=(255, 255, 255, 255), font=font_hero)
    ly += 70
    ov_draw.text((lx, ly), "zero bloat.", fill=(45, 212, 191, 255), font=font_hero)

    # Subtitle
    ly += 80
    ov_draw.text((lx, ly), "Your autonomous Sentinel monitoring every ping, SSL cert,", fill=(148, 163, 184, 255), font=font_sub)
    ly += 32
    ov_draw.text((lx, ly), "and edge endpoint without legacy SaaS bloat.", fill=(148, 163, 184, 255), font=font_sub)

    # Feature Badges
    ly += 65
    badges = [
        "Advanced Status Pages",
        "Multi-Region Probes",
        "Telegram & Email Alerts",
    ]
    bx = lx
    font_pill = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 13)
    for b_text in badges:
        bbox = ov_draw.textbbox((0, 0), b_text, font=font_pill)
        bw = (bbox[2] - bbox[0]) + 30
        ov_draw.rounded_rectangle([bx, ly, bx + bw, ly + 32], radius=16, fill=(15, 23, 42, 200), outline=(20, 184, 166, 140), width=1)
        ov_draw.text((bx + 15, ly + 8), b_text, fill=(226, 232, 240, 255), font=font_pill)
        bx += bw + 12

    # Bottom Tagline
    ov_draw.text((lx, 550), "we monitor the edge. you sleep soundly.", fill=(100, 116, 139, 255), font=font_tagline)

    og = Image.alpha_composite(og, overlay)
    og.convert('RGB').save('frontend/public/og-image.png', format='PNG', quality=95)
    og.convert('RGB').save('frontend/src/app/opengraph-image.png', format='PNG', quality=95)
    print("✅ PipBud Robotic Sentinel OG images generated (1200x630)")

if __name__ == '__main__':
    build_robotic_sentinel()
