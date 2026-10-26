"""Make WebP copies of the portfolio artwork for responsive <picture> tags.

Run from the repo root:  python3 .github/scripts/make-images.py
Needs Pillow (pip install pillow). Originals in assets/work/ are never changed;
studio/ and the <img> fallbacks still point at them.
Output: assets/work/webp/<name>-<width>.webp for each width up to the original
(plus the original width when it is well above the largest standard size).
"""
import os
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

SRC = 'assets/work'
OUT = 'assets/work/webp'
WIDTHS = (480, 800, 1200, 1600)
QUALITY = 80  # tested: keeps paper grain and brush texture; AVIF at the same size did not


def build(name):
    base, _ = os.path.splitext(name)
    im = Image.open(os.path.join(SRC, name))
    im.load()
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'transparency' in im.info else 'RGB')
    widths = [w for w in WIDTHS if w <= im.width]
    if im.width - max(widths) > 100:  # e.g. a 1556px original also gets a 1556 copy
        widths.append(im.width)
    made = []
    for w in widths:
        h = round(im.height * w / im.width)
        r = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        path = os.path.join(OUT, f'{base}-{w}.webp')
        r.save(path, 'WEBP', quality=QUALITY, method=6)
        made.append(path)
    return name, made


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = sorted(n for n in os.listdir(SRC) if n.lower().endswith(('.jpg', '.jpeg', '.png')))
    with ProcessPoolExecutor() as ex:
        for name, made in ex.map(build, names):
            print(name, len(made))
