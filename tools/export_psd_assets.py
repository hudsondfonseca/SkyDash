"""Export the numbered Sky Dash PSD art pack to transparent PNG resources.

Usage: python tools/export_psd_assets.py "C:/path/to/PSD folder"
The source PSD files are never modified.
"""
from collections import Counter, deque
from pathlib import Path
import sys
from PIL import Image

ASSETS = {
    1: ("projectiles", "orange-blast"), 2: ("projectiles", "diagonal-bolt"),
    3: ("effects", "explosion"), 4: ("enemies", "alien-ivory"),
    5: ("enemies", "alien-green"), 6: ("enemies", "alien-armor"),
    7: ("effects", "energy-shield"), 8: ("projectiles", "blue-energy-wave"),
    9: ("ui", "planet-insignia"), 10: ("background", "nebula-violet"),
    11: ("effects", "asteroid-trail"), 12: ("background", "galaxy-cyan"),
    13: ("background", "nebula-magenta"), 14: ("effects", "comet-blue"),
    15: ("background", "sun"), 16: ("background", "moon"),
    17: ("background", "planet-earth"), 18: ("background", "planet-striped"),
    19: ("background", "planet-ring-green"), 20: ("background", "planet-ring-red"),
}

def transparent_edge_background(image):
    image = image.convert("RGBA")
    px = image.load(); w, h = image.size
    seen = bytearray(w * h); queue = deque()
    corners=[px[0,0][:3],px[w-1,0][:3],px[0,h-1][:3],px[w-1,h-1][:3]]
    common=Counter(tuple((v//8)*8 for v in color) for color in corners).most_common(1)[0][0]
    def is_background(x, y):
        r, g, b, a = px[x, y]
        if not a: return False
        dark = max(r,g,b) < 48 and b < 100
        edge_color = sum((v-common[i])**2 for i,v in enumerate((r,g,b))) <= 26**2
        return dark or edge_color
    for x in range(w):
        for y in (0, h - 1):
            if is_background(x, y): seen[y*w+x] = 1; queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_background(x, y) and not seen[y*w+x]: seen[y*w+x] = 1; queue.append((x, y))
    while queue:
        x, y = queue.popleft(); r,g,b,_ = px[x,y]; px[x,y] = (r,g,b,0)
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h:
                i=ny*w+nx
                if not seen[i] and is_background(nx,ny): seen[i]=1; queue.append((nx,ny))
    return image

def main(source):
    root = Path(__file__).resolve().parents[1]
    for number, (category, name) in ASSETS.items():
        path = source / f"{number}.psd"
        with Image.open(path) as psd:
            png = transparent_edge_background(psd.copy())
        if number == 3:
            px=png.load(); w,h=png.size; cx=(w-1)/2; cy=(h-1)/2
            from math import sqrt
            for y in range(h):
                for x in range(w):
                    r,g,b,a=px[x,y]
                    radius=sqrt(((x-cx)/cx)**2+((y-cy)/cy)**2)
                    if radius>.94: px[x,y]=(r,g,b,0)
        destination = root / "assets" / "psd" / category / f"{name}.png"
        destination.parent.mkdir(parents=True, exist_ok=True)
        png.save(destination, optimize=True)
        print(f"{number}.psd -> {destination.relative_to(root)}")

if __name__ == "__main__":
    main(Path(sys.argv[1]).expanduser().resolve())
