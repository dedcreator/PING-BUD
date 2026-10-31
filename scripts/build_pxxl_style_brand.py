import os
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import label

def build_all_assets():
    print("🎨 Starting PingBud Artistic Brand Asset Generation...")
    os.makedirs('frontend/public', exist_ok=True)
    os.makedirs('frontend/src/app', exist_ok=True)

    # 1. Extract pure vector helmet contours from master
    src_master = '/Users/apple/.gemini/antigravity-cli/brain/29f0c594-b5a2-4143-8e9f-57b1074cbf1d/pxxl_logo.png'
    master_img = Image.open(src_master).convert('RGBA')
    arr = np.array(master_img)
    mask = arr[:, :, 3] > 100
    labeled, num_features = label(mask)

    # Keep features 6, 9, 10, 11 (the pure helmet)
    helmet_mask = (labeled == 6) | (labeled == 9) | (labeled == 10) | (labeled == 11)
    
    # 2. Vector SVG extraction
    gray = (helmet_mask.astype(np.uint8)) * 255
    contours, hierarchy = cv2.findContours(gray, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

    # Center bounding box
    bbox_y, bbox_x = np.where(helmet_mask)
    min_x, max_x = np.min(bbox_x), np.max(bbox_x)
    min_y, max_y = np.min(bbox_y), np.max(bbox_y)
    bw = max_x - min_x
    bh = max_y - min_y
    scale = 800.0 / max(bw, bh)
    shift_x = (1000 - bw * scale) / 2 - min_x * scale
    shift_y = (1000 - bh * scale) / 2 - min_y * scale

    svg_paths = []
    for c in contours:
        c_approx = cv2.approxPolyDP(c, epsilon=1.2, closed=True)
        pts = c_approx.reshape(-1, 2)
        if len(pts) < 3:
            continue
        pts_norm = [(round(p[0] * scale + shift_x, 1), round(p[1] * scale + shift_y, 1)) for p in pts]
        path_d = f'M {pts_norm[0][0]} {pts_norm[0][1]} ' + ' '.join([f'L {p[0]} {p[1]}' for p in pts_norm[1:]]) + ' Z'
        svg_paths.append(path_d)

    full_svg_path = ' '.join(svg_paths)

    # Save SVG Icon
    icon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_svg_path}" fill="currentColor"/>
</svg>'''
    with open('frontend/public/logo-icon.svg', 'w') as f:
        f.write(icon_svg)
    print("✅ Saved logo-icon.svg")

    # Save SVG Badge (Circular with Teal Rim)
    badge_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <circle cx="500" cy="500" r="480" fill="#090D16" stroke="#14B8A6" stroke-width="24"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_svg_path}" fill="#FFFFFF"/>
</svg>'''
    with open('frontend/public/logo-badge.svg', 'w') as f:
        f.write(badge_svg)
    print("✅ Saved logo-badge.svg")

    # Save SVG Full Horizontal Logo Lockup
    full_logo_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 100" fill="none">
  <g transform="translate(10, 10) scale(0.08)">
    <circle cx="500" cy="500" r="480" fill="#090D16" stroke="#14B8A6" stroke-width="28"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="{full_svg_path}" fill="#FFFFFF"/>
  </g>
  <text x="108" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="34" letter-spacing="-1" fill="#FFFFFF">ping<tspan fill="#14B8A6">bud</tspan><tspan fill="#64748B" font-weight="600" font-size="28">.us</tspan></text>
  <text x="110" y="73" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="600" font-size="11" letter-spacing="1.5" fill="#94A3B8">UPTIME &amp; CONSENSUS SENTINEL</text>
  <g transform="translate(380, 30)">
    <rect width="54" height="22" rx="6" fill="#0F172A" stroke="#14B8A6" stroke-width="1.2"/>
    <text x="27" y="15" font-family="monospace" font-weight="700" font-size="11" fill="#2DD4BF" text-anchor="middle">SAAS</text>
  </g>
</svg>'''
    with open('frontend/public/logo.svg', 'w') as f:
        f.write(full_logo_svg)
    print("✅ Saved logo.svg")

    # 3. High-Res Circular Badges in PNG (1024x1024)
    isolated = np.zeros_like(arr)
    isolated[helmet_mask] = arr[helmet_mask]
    helmet_raw = Image.fromarray(isolated)
    helmet_cropped = helmet_raw.crop((min_x, min_y, max_x, max_y))

    # Badge Dark (Midnight Void + White Emblem + Teal Rim)
    badge_1024_dark = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(badge_1024_dark)
    d_draw.ellipse([20, 20, 1004, 1004], fill=(9, 13, 22, 255), outline=(20, 184, 166, 255), width=20)
    
    # Scale helmet to fit inside badge
    hw = 700
    hh = int(hw * bh / bw)
    h_scaled = helmet_cropped.resize((hw, hh), Image.Resampling.LANCZOS)
    ox = (1024 - hw) // 2
    oy = (1024 - hh) // 2 + 10
    badge_1024_dark.paste(h_scaled, (ox, oy), mask=h_scaled)
    badge_1024_dark.save('frontend/public/logo.png', format='PNG')
    badge_1024_dark.save('frontend/public/pingbud-badge-dark.png', format='PNG')
    print("✅ Saved logo.png (1024x1024 dark)")

    # Badge Light (White + Dark Slate Emblem + Teal Rim) - exact pxxl.app icon inverted counterpart
    badge_1024_light = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    l_draw = ImageDraw.Draw(badge_1024_light)
    l_draw.ellipse([20, 20, 1004, 1004], fill=(255, 255, 255, 255), outline=(20, 184, 166, 255), width=20)

    h_arr = np.array(h_scaled)
    h_slate_arr = np.zeros_like(h_arr)
    h_slate_arr[:, :, 0] = 9
    h_slate_arr[:, :, 1] = 13
    h_slate_arr[:, :, 2] = 22
    h_slate_arr[:, :, 3] = h_arr[:, :, 3]
    h_slate = Image.fromarray(h_slate_arr)
    badge_1024_light.paste(h_slate, (ox, oy), mask=h_slate)
    badge_1024_light.save('frontend/public/pingbud-badge-light.png', format='PNG')
    print("✅ Saved pingbud-badge-light.png")

    # Pure White Helmet on Transparent (like pxxl_logo_white.png)
    white_helmet_only = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    white_helmet_only.paste(h_scaled, (ox, oy), mask=h_scaled)
    white_helmet_only.save('frontend/public/logo-white.png', format='PNG')
    white_helmet_only.save('frontend/public/pingbud-mark.png', format='PNG')
    print("✅ Saved logo-white.png & pingbud-mark.png")

    # 4. Generate Favicon & App Icons
    fav16 = badge_1024_dark.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save('frontend/public/favicon-16x16.png', format='PNG')

    fav32 = badge_1024_dark.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save('frontend/public/favicon-32x32.png', format='PNG')

    apple_icon = badge_1024_dark.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('frontend/public/apple-touch-icon.png', format='PNG')
    apple_icon.save('frontend/src/app/apple-icon.png', format='PNG')

    app_icon_512 = badge_1024_dark.resize((512, 512), Image.Resampling.LANCZOS)
    app_icon_512.save('frontend/src/app/icon.png', format='PNG')

    # Multi-resolution ICO
    badge_1024_dark.save(
        'frontend/public/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    badge_1024_dark.save(
        'frontend/src/app/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("✅ Saved favicon.ico (multi-resolution), 16x16, 32x32, 180x180, 512x512")

    # 5. Open Graph (OG) Image (1200 x 630)
    astro_path = '/Users/apple/.gemini/antigravity-cli/brain/29f0c594-b5a2-4143-8e9f-57b1074cbf1d/pingbud_og_astronaut_1793281887122.jpg'
    astro_img = Image.open(astro_path).convert('RGBA')

    W, H = 1200, 630
    orig_w, orig_h = astro_img.size
    scaled_w = int(orig_w * (H / orig_h))
    astro_resized = astro_img.resize((scaled_w, H), Image.Resampling.LANCZOS)

    og = Image.new('RGBA', (W, H), (2, 6, 15, 255))
    og.paste(astro_resized, (W - scaled_w, 0))

    # Smooth black gradient fade for left-side typography
    fade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fade_draw = ImageDraw.Draw(fade)
    fade_w = 780
    for x in range(fade_w):
        ratio = x / fade_w
        alpha = int(255 * (0.5 + 0.5 * np.cos(np.pi * ratio)))
        fade_draw.line([(x, 0), (x, H)], fill=(2, 6, 15, alpha))
    og = Image.alpha_composite(og, fade)

    badge_sm = badge_1024_dark.resize((52, 52), Image.Resampling.LANCZOS)

    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_logo = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 24)
    font_top_right = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 20)
    font_hero = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 64)
    font_tagline = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 24)

    # Top Left Logo Lockup
    og.paste(badge_sm, (60, 48), mask=badge_sm)
    draw.text((126, 60), 'PingBud', fill=(255, 255, 255, 255), font=font_logo)

    # Top Right Brand URL
    draw.text((W - 175, 60), 'pingbud.us', fill=(148, 163, 184, 255), font=font_top_right)

    # Minimalist Hero Headline
    draw.text((60, 205), 'zero downtime.', fill=(255, 255, 255, 255), font=font_hero)
    draw.text((60, 285), 'zero bloat.', fill=(45, 212, 191, 255), font=font_hero)

    # Bottom Tagline
    draw.text((60, 535), 'we ping the edge. you sleep soundly.', fill=(203, 213, 225, 230), font=font_tagline)

    og = Image.alpha_composite(og, overlay)

    og.convert('RGB').save('frontend/public/og-image.png', format='PNG', quality=95)
    og.convert('RGB').save('frontend/src/app/opengraph-image.png', format='PNG', quality=95)
    print("✅ Saved og-image.png (1200x630) & opengraph-image.png")

if __name__ == '__main__':
    build_all_assets()
