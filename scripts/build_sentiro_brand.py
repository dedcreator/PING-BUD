import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import label

def build_sentiro_brand():
    print("🎨 Generating Sentiro (sentiro.xyz) Black & White Sentinel Brand Suite...")
    src_master = "/Users/apple/.gemini/antigravity-cli/brain/29f0c594-b5a2-4143-8e9f-57b1074cbf1d/pxxl_logo.png"
    master_img = Image.open(src_master).convert("RGBA")
    arr = np.array(master_img)
    mask = arr[:, :, 3] > 100
    labeled, num_features = label(mask)
    sizes = np.bincount(labeled.ravel())

    # Keep the Sentinel helm & orbital sensor halo
    helmet_mask = np.zeros_like(mask, dtype=bool)
    for f_id in range(1, num_features + 1):
        if sizes[f_id] > 20000:
            helmet_mask |= (labeled == f_id)

    bbox_y, bbox_x = np.where(helmet_mask)
    min_x, max_x = np.min(bbox_x), np.max(bbox_x)
    min_y, max_y = np.min(bbox_y), np.max(bbox_y)
    bw = max_x - min_x
    bh = max_y - min_y
    scale = 750.0 / max(bw, bh)
    shift_x = (1000 - bw * scale) / 2 - min_x * scale
    shift_y = (1000 - bh * scale) / 2 - min_y * scale + 15

    gray = (helmet_mask.astype(np.uint8)) * 255
    contours, hierarchy = cv2.findContours(gray, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

    svg_paths = []
    for c in contours:
        c_approx = cv2.approxPolyDP(c, epsilon=1.2, closed=True)
        pts = c_approx.reshape(-1, 2)
        if len(pts) < 3:
            continue
        pts_norm = [(round(p[0] * scale + shift_x, 1), round(p[1] * scale + shift_y, 1)) for p in pts]
        path_d = f"M {pts_norm[0][0]} {pts_norm[0][1]} " + " ".join([f"L {p[0]} {p[1]}" for p in pts_norm[1:]]) + " Z"
        svg_paths.append(path_d)

    full_svg_path = " ".join(svg_paths)

    os.makedirs("frontend/public", exist_ok=True)
    os.makedirs("frontend/src/app", exist_ok=True)

    # 1. Save SVG Badge: Black and White feeling of pxxl.app, Sentinel themed!
    badge_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <!-- Outer Clean White Sentinel Disc -->
  <circle cx="500" cy="500" r="480" fill="#FFFFFF" stroke="#14B8A6" stroke-width="26"/>
  <!-- Pure Black Sentinel Helm & Orbital Ring -->
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_svg_path}" fill="#090D16"/>
</svg>'''

    with open("frontend/public/logo-badge.svg", "w") as f:
        f.write(badge_svg)
    print("✅ Saved frontend/public/logo-badge.svg")

    # 2. Save Pure Vector Icon
    icon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_svg_path}" fill="currentColor"/>
</svg>'''
    with open("frontend/public/logo-icon.svg", "w") as f:
        f.write(icon_svg)
    print("✅ Saved frontend/public/logo-icon.svg")

    # 3. Save SVG Full Horizontal Logo Lockup: Sentiro (sentiro.xyz)
    full_logo_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 100" fill="none">
  <g transform="translate(10, 10) scale(0.08)">
    <circle cx="500" cy="500" r="480" fill="#FFFFFF" stroke="#14B8A6" stroke-width="28"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="{full_svg_path}" fill="#090D16"/>
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
    print("✅ Saved frontend/public/logo.svg")

    # 4. Render High-Resolution Raster 1024x1024 Badge
    badge_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge_1024)

    # Clean White disc with crisp Teal outer rim
    draw.ellipse([20, 20, 1004, 1004], fill=(255, 255, 255, 255), outline=(20, 184, 166, 255), width=24)

    isolated = np.zeros_like(arr)
    isolated[helmet_mask] = arr[helmet_mask]
    helmet_img = Image.fromarray(isolated)
    helmet_cropped = helmet_img.crop((min_x, min_y, max_x, max_y))

    hw = 680
    hh = int(hw * bh / bw)
    h_scaled = helmet_cropped.resize((hw, hh), Image.Resampling.LANCZOS)
    ox = (1024 - hw) // 2
    oy = (1024 - hh) // 2 + 15

    # Pure Obsidian Black (9, 13, 22)
    h_arr = np.array(h_scaled)
    h_black_arr = np.zeros_like(h_arr)
    h_black_arr[:, :, 0] = 9
    h_black_arr[:, :, 1] = 13
    h_black_arr[:, :, 2] = 22
    h_black_arr[:, :, 3] = h_arr[:, :, 3]
    h_black = Image.fromarray(h_black_arr)

    badge_1024.paste(h_black, (ox, oy), mask=h_black)

    # Anti-aliased circular boundary mask
    c_mask = Image.new("L", (1024, 1024), 0)
    cm_draw = ImageDraw.Draw(c_mask)
    cm_draw.ellipse([18, 18, 1006, 1006], fill=255)
    final_badge = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    final_badge.paste(badge_1024, (0, 0), mask=c_mask)

    # Save to public directory
    final_badge.save("frontend/public/sentiro-avatar.png", format="PNG")
    final_badge.save("frontend/public/sentiro-badge.png", format="PNG")
    final_badge.save("frontend/public/pipbud-avatar.png", format="PNG")
    final_badge.save("frontend/public/pipbud-badge.png", format="PNG")
    final_badge.save("frontend/public/pipbud-sentinel.png", format="PNG")
    final_badge.save("frontend/public/logo.png", format="PNG")
    final_badge.save("frontend/public/pingbud-badge-light.png", format="PNG")
    print("✅ Saved sentiro-avatar.png & logo.png (1024x1024)")

    # 5. Favicons and Next.js App Icons
    fav16 = final_badge.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save("frontend/public/favicon-16x16.png", format="PNG")

    fav32 = final_badge.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save("frontend/public/favicon-32x32.png", format="PNG")

    apple_icon = final_badge.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save("frontend/public/apple-touch-icon.png", format="PNG")
    apple_icon.save("frontend/src/app/apple-icon.png", format="PNG")

    icon_512 = final_badge.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save("frontend/src/app/icon.png", format="PNG")

    final_badge.save(
        "frontend/public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    final_badge.save(
        "frontend/src/app/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("✅ Generated favicon suite & app icons")

    # 6. High-Impact Social OpenGraph Image (1200 x 630) for sentiro.xyz
    W, H = 1200, 630
    og = Image.new("RGBA", (W, H), (9, 13, 22, 255))
    og_draw = ImageDraw.Draw(og)

    for y in range(H):
        ratio = y / H
        r = int(9 * (1 - ratio * 0.25))
        g = int(13 * (1 - ratio * 0.25))
        b = int(22 * (1 - ratio * 0.2))
        og_draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    grid_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_img)
    for x in range(0, W, 40):
        g_draw.line([(x, 0), (x, H)], fill=(20, 184, 166, 14), width=1)
    for y in range(0, H, 40):
        g_draw.line([(0, y), (W, y)], fill=(20, 184, 166, 14), width=1)
    og = Image.alpha_composite(og, grid_img)

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx_glow, cy_glow = 920, 315
    for radius in range(350, 0, -25):
        alpha = int(45 * (1 - radius / 350))
        glow_draw.ellipse([cx_glow - radius, cy_glow - radius, cx_glow + radius, cy_glow + radius], fill=(20, 184, 166, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    og = Image.alpha_composite(og, glow)

    badge_size = 440
    b_sm = final_badge.resize((badge_size, badge_size), Image.Resampling.LANCZOS)
    bx = 700
    by = (H - badge_size) // 2
    og.paste(b_sm, (bx, by), mask=b_sm)

    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(ov)

    font_h1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 54)
    font_desc = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
    font_pill = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 13)
    font_mono = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)

    # Domain Chip
    ov_draw.rounded_rectangle([75, 80, 75 + 280, 80 + 36], radius=18, fill=(20, 184, 166, 35), outline=(20, 184, 166, 120), width=1)
    ov_draw.ellipse([75 + 14, 80 + 13, 75 + 24, 80 + 23], fill=(45, 212, 191, 255))
    ov_draw.text((75 + 32, 80 + 9), "SENTIRO.XYZ  •  THE IT SENTINEL", fill=(45, 212, 191, 255), font=font_pill)

    ov_draw.text((75, 150), "Zero Downtime.", fill=(255, 255, 255, 255), font=font_h1)
    ov_draw.text((75, 215), "Zero SaaS Bloat.", fill=(45, 212, 191, 255), font=font_h1)

    ov_draw.text((75, 300), "Multi-region edge consensus probing, sub-30s heartbeats,", fill=(148, 163, 184, 255), font=font_desc)
    ov_draw.text((75, 332), "and instant Telegram alerts priced sustainably at N2,000/mo.", fill=(148, 163, 184, 255), font=font_desc)

    badges = [
        ("N2,000 / mo Indie Pro", (13, 148, 136, 65), (45, 212, 191, 230), (240, 253, 250, 255)),
        ("4-Node Consensus", (30, 41, 59, 190), (71, 85, 105, 190), (226, 232, 240, 255)),
        ("Free Telegram Bot", (30, 41, 59, 190), (71, 85, 105, 190), (226, 232, 240, 255)),
    ]
    cur_x = 75
    for text, bg_c, border_c, text_c in badges:
        bbox = ov_draw.textbbox((0, 0), text, font=font_pill)
        bw_badge = (bbox[2] - bbox[0]) + 32
        ov_draw.rounded_rectangle([cur_x, 400, cur_x + bw_badge, 400 + 36], radius=18, fill=bg_c, outline=border_c, width=1)
        ov_draw.text((cur_x + 16, 400 + 10), text, fill=text_c, font=font_pill)
        cur_x += bw_badge + 14

    ov_draw.text((75, 510), "sentiro.xyz  •  18ms Edge Latency  •  SQLite WAL  •  Sub-120MB RAM", fill=(148, 163, 184, 255), font=font_mono)

    og = Image.alpha_composite(og, ov)
    og.convert("RGB").save("frontend/public/og-image.png", format="PNG", quality=95)
    og.convert("RGB").save("frontend/src/app/opengraph-image.png", format="PNG", quality=95)
    print("✅ Saved og-image.png & opengraph-image.png (1200x630)")

if __name__ == "__main__":
    build_sentiro_brand()
