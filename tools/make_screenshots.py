"""make_screenshots.py — sample photos + screenshots for Vice Coast Cover Studio.

Draws two original sample scenes (a sunset boulevard and a pier at dusk) with
Pillow, then renders the four screenshots listed in shots.json: exported
covers in the three post sizes plus the editor with a photo loaded. The cover
renderer mirrors app/src/studio.js (panels, grade wash, caption band, plate)
so the screenshots show what the app itself exports. Every JPEG is kept at
most 256 KiB with its long side at most 1280 px, per the gate.
"""

import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLES = os.path.join(ROOT, "app", "samples")
SHOTS = os.path.join(ROOT, "screenshots")
MAX_BYTES = 256 * 1024

FONT_DIRS = ["/usr/share/fonts/truetype/dejavu", "/usr/share/fonts"]


def font(name, size):
    for d in FONT_DIRS:
        path = os.path.join(d, name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def bold(size):
    return font("DejaVuSans-Bold.ttf", size)


def bold_oblique(size):
    for name in ("DejaVuSans-BoldOblique.ttf", "DejaVuSans-Bold.ttf"):
        for d in FONT_DIRS:
            path = os.path.join(d, name)
            if os.path.exists(path):
                return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def vertical_gradient(w, h, stops):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t0 <= t <= t1:
                f = 0 if t1 == t0 else (t - t0) / (t1 - t0)
                col = tuple(int(c0[k] + (c1[k] - c0[k]) * f) for k in range(3))
                break
        else:
            col = stops[-1][1]
        for x in range(w):
            px[x, y] = col
    return img


def draw_palm(draw, x, base_y, height, colour):
    top_y = base_y - height
    draw.line([(x, base_y), (x + height * 0.12, top_y)], fill=colour, width=max(3, int(height) // 40))
    cx, cy = x + height * 0.12, top_y
    for ang in (-160, -120, -80, -40, -10, 25):
        rad = math.radians(ang)
        ex = cx + math.cos(rad) * height * 0.42
        ey = cy + math.sin(rad) * height * 0.42 + height * 0.16
        mx = cx + math.cos(rad) * height * 0.24
        my = cy + math.sin(rad) * height * 0.24 - height * 0.06
        draw.line([(cx, cy), (mx, my), (ex, ey)], fill=colour, width=max(2, int(height) // 55))


def make_boulevard(path):
    w, h = 1280, 960
    img = vertical_gradient(w, h, [(0.0, (58, 32, 120)), (0.45, (214, 72, 110)),
                                    (0.72, (255, 140, 66)), (1.0, (255, 196, 96))])
    d = ImageDraw.Draw(img)
    d.ellipse([w * 0.58, h * 0.30, w * 0.86, h * 0.62], fill=(255, 232, 168))
    skyline = (36, 18, 64)
    towers = [0.34, 0.52, 0.42, 0.64, 0.47, 0.58, 0.39, 0.55]
    tw = w / len(towers)
    for i, t in enumerate(towers):
        d.rectangle([i * tw + 3, h * 0.78 - h * t, (i + 1) * tw - 3, h * 0.78], fill=skyline)
        for wy in range(int(h * 0.78 - h * t) + 14, int(h * 0.76), 26):
            for wx in range(int(i * tw) + 12, int((i + 1) * tw) - 14, 24):
                if (wx + wy) % 3:
                    d.rectangle([wx, wy, wx + 8, wy + 11], fill=(255, 210, 110))
    d.rectangle([0, h * 0.78, w, h], fill=(28, 14, 52))
    d.polygon([(w * 0.44, h), (w * 0.56, h), (w * 0.515, h * 0.78), (w * 0.485, h * 0.78)], fill=(52, 34, 86))
    for i in range(6):
        y = h * 0.80 + i * h * 0.033
        d.rectangle([w * 0.497, y, w * 0.503, y + h * 0.016], fill=(255, 196, 96))
    for x, hh in [(w * 0.10, h * 0.42), (w * 0.22, h * 0.34), (w * 0.84, h * 0.38), (w * 0.93, h * 0.30)]:
        draw_palm(d, x, h * 0.94, hh, (18, 8, 36))
    img.save(path, "JPEG", quality=88)


def make_pier(path):
    w, h = 1280, 960
    img = vertical_gradient(w, h, [(0.0, (30, 24, 92)), (0.5, (146, 52, 128)),
                                    (0.75, (240, 110, 92)), (1.0, (255, 178, 102))])
    d = ImageDraw.Draw(img)
    d.ellipse([w * 0.12, h * 0.36, w * 0.34, h * 0.60], fill=(255, 226, 156))
    sea_y = h * 0.62
    d.rectangle([0, sea_y, w, h], fill=(24, 30, 84))
    for i in range(26):
        y = sea_y + 8 + i * (h - sea_y) / 26
        x0 = (i * 173) % w
        d.line([(x0, y), (x0 + 60 + (i % 5) * 22, y)], fill=(255, 170, 110), width=3)
    deck_y = h * 0.66
    d.rectangle([w * 0.30, deck_y, w, deck_y + 14], fill=(20, 12, 44))
    for x in range(int(w * 0.34), w, 90):
        d.rectangle([x, deck_y + 14, x + 10, h * 0.92], fill=(20, 12, 44))
    d.polygon([(w * 0.72, deck_y), (w * 0.80, deck_y - h * 0.30), (w * 0.88, deck_y)], fill=(20, 12, 44))
    d.ellipse([w * 0.795, deck_y - h * 0.30, w * 0.815, deck_y - h * 0.28], fill=(255, 240, 190))
    draw_palm(d, w * 0.08, h * 0.90, h * 0.44, (14, 8, 32))
    draw_palm(d, w * 0.17, h * 0.88, h * 0.34, (14, 8, 32))
    img.save(path, "JPEG", quality=88)


# ---------- cover renderer (mirrors the app) ----------

CAPTION_BAND = 0.24
GUTTER = 0.012


def layout_panels(name):
    if name == "hero":
        return [(0, 0, 0.62, 1), (0.62, 0, 0.38, 0.5), (0.62, 0.5, 0.38, 0.5)]
    if name == "triptych":
        return [(0, 0, 1 / 3, 1), (1 / 3, 0, 1 / 3, 1), (2 / 3, 0, 1 / 3, 1)]
    return [(0, 0, 0.5, 0.5), (0.5, 0, 0.5, 0.5), (0, 0.5, 0.5, 0.5), (0.5, 0.5, 0.5, 0.5)]


def crop_fill(photo, rect_w, rect_h, zoom=1.0, fx=0.5, fy=0.5):
    panel_ratio = rect_w / rect_h
    photo_ratio = photo.width / photo.height
    if photo_ratio > panel_ratio:
        bh = photo.height
        bw = photo.height * panel_ratio
    else:
        bw = photo.width
        bh = photo.width / panel_ratio
    sw, sh = bw / zoom, bh / zoom
    sx = min(max(fx * photo.width - sw / 2, 0), photo.width - sw)
    sy = min(max(fy * photo.height - sh / 2, 0), photo.height - sh)
    return photo.crop((int(sx), int(sy), int(sx + sw), int(sy + sh))).resize(
        (int(rect_w), int(rect_h)), Image.LANCZOS)


def grade_wash(w, h, grade):
    washes = {
        "sunset": ([(255, 154, 61), (255, 94, 122), (122, 60, 255)], 0.30),
        "neon": ([(0, 229, 255), (255, 47, 179), (61, 27, 255)], 0.28),
        "clean": ([(255, 255, 255)] * 3, 0.0),
    }
    cols, alpha = washes[grade]
    if alpha == 0:
        return None
    grad = vertical_gradient(w, h, [(0.0, cols[0]), (0.55, cols[1]), (1.0, cols[2])])
    return grad, alpha


def render_cover(w, h, layout, grade, title, sub, plate, photos, zooms=None, focuses=None):
    img = Image.new("RGB", (w, h), (13, 7, 33))
    photo_h = h * (1 - CAPTION_BAND)
    g = w * GUTTER
    rects = []
    for i, (fx, fy, fw, fh) in enumerate(layout_panels(layout)):
        rect = (fx * w + g / 2, fy * photo_h + g / 2, fw * w - g, fh * photo_h - g)
        rects.append(rect)
        photo = photos[i % len(photos)]
        zoom = (zooms or {}).get(i, 1.0)
        focus = (focuses or {}).get(i, (0.5, 0.5))
        panel_img = crop_fill(photo, rect[2], rect[3], zoom, focus[0], focus[1])
        img.paste(panel_img, (int(rect[0]), int(rect[1])))
    wash = grade_wash(w, int(photo_h), grade)
    if wash:
        grad, alpha = wash
        region = img.crop((0, 0, w, int(photo_h)))
        img.paste(Image.blend(region, grad, alpha), (0, 0))
    # caption band
    d = ImageDraw.Draw(img)
    band_y = int(photo_h)
    band_h = h - band_y
    for y in range(band_y, h):
        t = (y - band_y) / max(1, band_h)
        col = tuple(int((29, 17, 54)[k] + ((13, 7, 33)[k] - (29, 17, 54)[k]) * t) for k in range(3))
        d.line([(0, y), (w, y)], fill=col)
    d.rectangle([0, band_y, w, band_y + max(3, int(h * 0.006))], fill=(255, 184, 77))
    title_size = int(band_h * 0.34)
    tf = bold_oblique(title_size)
    while title_size > 10 and d.textlength(title, font=tf) > w * 0.86:
        title_size -= 4
        tf = bold_oblique(title_size)
    d.text((w / 2 + title_size * 0.03, band_y + band_h * 0.52), title, font=tf,
           fill=(255, 107, 94), anchor="mm")
    d.text((w / 2, band_y + band_h * 0.52), title, font=tf, fill=(255, 247, 234), anchor="mm")
    if sub:
        sf = bold(int(band_h * 0.13))
        d.text((w / 2, band_y + band_h * 0.80), " ".join(sub), font=sf, fill=(47, 212, 196), anchor="mm")
    pw, ph = band_h * 0.62, band_h * 0.40
    px, py = w - pw - band_h * 0.16, band_y + band_h * 0.14
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=ph * 0.18, fill=(255, 184, 77))
    d.text((px + pw / 2, py + ph / 2), plate, font=bold(int(ph * 0.62)), fill=(36, 18, 57), anchor="mm")
    return img


def render_editor(w, h, cover, title, sub):
    img = Image.new("RGB", (w, h), (20, 16, 33))
    d = ImageDraw.Draw(img)
    # top bar
    d.rectangle([0, 0, w, 86], fill=(31, 24, 51))
    d.rounded_rectangle([22, 16, 92, 70], radius=10, fill=(255, 184, 77))
    d.text((57, 43), "VI", font=bold(26), fill=(36, 18, 57), anchor="mm")
    d.text((108, 30), "Vice Coast Cover Studio", font=bold(24), fill=(245, 238, 252))
    d.text((108, 58), "Photos stay on your machine — nothing is uploaded.", font=bold(13), fill=(185, 168, 217))
    for i, label in enumerate(["Add photos", "Use sample photos", "Export PNG"]):
        bx = w - 470 + i * 152
        fill = (47, 212, 196) if i == 0 else ((255, 184, 77) if i == 2 else (42, 31, 71))
        ink = (6, 35, 31) if i == 0 else ((42, 18, 6) if i == 2 else (245, 238, 252))
        d.rounded_rectangle([bx, 24, bx + 142, 62], radius=19, fill=fill)
        d.text((bx + 71, 43), label, font=bold(13), fill=ink, anchor="mm")
    # stage with the cover
    stage = (24, 106, w - 392, h - 24)
    d.rounded_rectangle(stage, radius=14, fill=(26, 19, 48), outline=(53, 42, 85), width=2)
    avail_w, avail_h = stage[2] - stage[0] - 32, stage[3] - stage[1] - 64
    scale = min(avail_w / cover.width, avail_h / cover.height)
    cw, ch = int(cover.width * scale), int(cover.height * scale)
    cx, cy = stage[0] + (stage[2] - stage[0] - cw) // 2, stage[1] + 16
    img.paste(cover.resize((cw, ch), Image.LANCZOS), (cx, cy))
    d = ImageDraw.Draw(img)
    d.rectangle([cx, cy, cx + cw, cy + ch], outline=(47, 212, 196), width=3)
    d.text(((stage[0] + stage[2]) // 2, stage[3] - 26),
           "Click a panel to select it, then drag to reposition. Scroll on a panel to zoom.",
           font=bold(13), fill=(185, 168, 217), anchor="mm")
    # side panel
    px0, py0, px1, py1 = w - 368, 106, w - 24, h - 24
    d.rounded_rectangle([px0, py0, px1, py1], radius=14, fill=(31, 24, 51), outline=(53, 42, 85), width=2)
    y = py0 + 18
    groups = [
        ("LAYOUT", ["Classic grid", "Hero + duo", "Triptych"], 0),
        ("POST SIZE", ["1080 × 1080", "1080 × 1350", "1920 × 1080"], 0),
        ("COLOUR GRADE", ["Vice sunset", "Neon night", "Clean"], 0),
    ]
    for heading, chips, on in groups:
        d.text((px0 + 18, y), heading, font=bold(12), fill=(255, 184, 77))
        y += 22
        x = px0 + 18
        for i, chip in enumerate(chips):
            tw = int(d.textlength(chip, font=bold(12))) + 24
            if x + tw > px1 - 12:
                x = px0 + 18
                y += 36
            fill = (255, 107, 94) if i == on else (42, 31, 71)
            d.rounded_rectangle([x, y, x + tw, y + 28], radius=14, fill=fill)
            d.text((x + tw / 2, y + 14), chip, font=bold(12), fill=(255, 245, 242), anchor="mm")
            x += tw + 8
        y += 52
    d.text((px0 + 18, y), "CAPTION", font=bold(12), fill=(255, 184, 77))
    y += 24
    for label, value in [("Title", title), ("Subtitle", sub), ("Plate", "VI")]:
        d.text((px0 + 18, y), label, font=bold(12), fill=(185, 168, 217))
        y += 18
        d.rounded_rectangle([px0 + 18, y, px1 - 18, y + 36], radius=9, fill=(23, 17, 41), outline=(53, 42, 85))
        d.text((px0 + 30, y + 18), value, font=bold(15), fill=(245, 238, 252), anchor="lm")
        y += 52
    d.text((px0 + 18, y), "SELECTED PANEL", font=bold(12), fill=(255, 184, 77))
    y += 26
    d.text((px0 + 18, y), "Zoom", font=bold(12), fill=(185, 168, 217))
    y += 20
    d.rounded_rectangle([px0 + 18, y, px1 - 18, y + 8], radius=4, fill=(53, 42, 85))
    d.ellipse([px0 + 18, y - 6, px0 + 38, y + 14], fill=(255, 107, 94))
    y += 30
    d.text((px0 + 18, y), "Panel 1 of 4 · 2 photo(s) loaded · zoom 100%", font=bold(12), fill=(47, 212, 196))
    return img


def save_capped(img, path):
    # Step the JPEG quality down until the file fits the gate's 256 KiB cap.
    quality = 88
    while True:
        img.save(path, "JPEG", quality=quality)
        if os.path.getsize(path) <= MAX_BYTES or quality <= 40:
            break
        quality -= 8
    return os.path.getsize(path)


def main():
    os.makedirs(SAMPLES, exist_ok=True)
    os.makedirs(SHOTS, exist_ok=True)
    make_boulevard(os.path.join(SAMPLES, "boulevard.jpg"))
    make_pier(os.path.join(SAMPLES, "pier.jpg"))
    photos = [Image.open(os.path.join(SAMPLES, "boulevard.jpg")),
              Image.open(os.path.join(SAMPLES, "pier.jpg"))]
    with open(os.path.join(ROOT, "shots.json"), encoding="utf-8") as fh:
        plan = json.load(fh)
    for shot in plan:
        if shot["kind"] == "editor":
            cover = render_cover(1080, 1080, shot["layout"], shot["grade"],
                                 shot["caption"], shot["sub"], "VI", photos)
            img = render_editor(shot["w"], shot["h"], cover, shot["caption"], shot["sub"])
        else:
            img = render_cover(shot["w"], shot["h"], shot["layout"], shot["grade"],
                               shot["caption"], shot["sub"], "VI", photos,
                               zooms={1: 1.35, 2: 1.2}, focuses={1: (0.62, 0.4), 3: (0.4, 0.55)})
        size = save_capped(img, os.path.join(SHOTS, shot["name"]))
        print(f"{shot['name']}: {img.width}x{img.height} {size} bytes")


if __name__ == "__main__":
    main()
