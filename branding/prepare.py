"""Prepare selected brand artwork without redrawing or recoloring it.

Optional asset-maintenance step; not required by Sphinx. Requires Pillow 12.3.0.
Run from the repository root: python branding/prepare.py
"""

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent


def clean_rosette_alpha(source: Image.Image) -> Image.Image:
    """Keep the six cells, removing transparent-export flecks and white fringes."""
    red, green, blue, alpha = source.split()
    minimum = ImageChops.darker(ImageChops.darker(red, green), blue)
    maximum = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    chroma = ImageChops.subtract(maximum, minimum)
    near_white = ImageChops.multiply(
        minimum.point(lambda value: 255 if value >= 235 else 0),
        chroma.point(lambda value: 255 if value <= 12 else 0),
    )
    mask = ImageChops.subtract(alpha, near_white).point(
        lambda value: 255 if value >= 128 else 0
    )
    # Remove one-pixel fringes and isolated specks, without changing source RGB.
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    width, height = mask.size
    pixels = bytearray(mask.tobytes())
    components = []
    for start in range(len(pixels)):
        if not pixels[start]:
            continue
        pixels[start] = 0
        pending = deque([start])
        component = []
        while pending:
            index = pending.popleft()
            component.append(index)
            x, y = index % width, index // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    neighbor = ny * width + nx
                    if pixels[neighbor]:
                        pixels[neighbor] = 0
                        pending.append(neighbor)
        components.append(component)
    components.sort(key=len, reverse=True)
    assert len(components) >= 6, "The rosette must retain six separate cells"
    assert len(components[5]) > width * height * 0.01, "A cell is missing"
    if len(components) > 6:
        assert len(components[6]) < len(components[5]) * 0.01, "Unexpected artwork"
    cleaned = bytearray(width * height)
    for component in components[:6]:
        for index in component:
            cleaned[index] = 255
    # Feather less than one source pixel; web exports are then downsampled normally.
    return Image.frombytes("L", mask.size, bytes(cleaned)).filter(
        ImageFilter.GaussianBlur(0.35)
    )


def opaque_source_alpha(source: Image.Image) -> Image.Image:
    """Remove the originals' connected near-white exterior background."""
    red, green, blue = source.split()
    minimum = ImageChops.darker(ImageChops.darker(red, green), blue)
    maximum = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    chroma = ImageChops.subtract(maximum, minimum)
    near_white = ImageChops.multiply(
        minimum.point(lambda value: 255 if value >= 235 else 0),
        chroma.point(lambda value: 255 if value <= 12 else 0),
    )
    # Only connected exterior background is removed. Enclosed eye highlights stay.
    ImageDraw.floodfill(near_white, (0, 0), 128)
    background = near_white.point(lambda value: 255 if value == 128 else 0)
    alpha = ImageChops.invert(background)
    # Antialias the one-pixel boundary only; retain all original RGB values.
    edge = ImageChops.subtract(background.filter(ImageFilter.MaxFilter(3)), background)
    edge_alpha = minimum.point(lambda value: min(255, round((255 - value) * 255 / 48)))
    alpha.paste(edge_alpha, mask=edge)
    return alpha


def prepare(name: str, web_size: int, *, clean_alpha: bool = False) -> None:
    with Image.open(ROOT / "source" / f"{name}.png") as image:
        source = image.convert("RGBA" if clean_alpha else "RGB")
    alpha = clean_rosette_alpha(source) if clean_alpha else opaque_source_alpha(source)
    bounds = alpha.getbbox()
    assert bounds is not None, f"No foreground in {name}"
    artwork = source.convert("RGBA")
    artwork.putalpha(alpha)
    artwork = artwork.crop(bounds)
    assert artwork.convert("RGB").tobytes() == source.convert("RGB").crop(bounds).tobytes()
    padding = round(max(artwork.size) * 0.04)
    size = tuple(side + 2 * padding for side in artwork.size)
    if name in ("rosette", "rosette-rounded"):
        size = (max(size), max(size))
    cutout = Image.new("RGBA", size)
    offset = tuple((full - part) // 2 for full, part in zip(size, artwork.size))
    cutout.paste(artwork, offset)
    cutout.save(ROOT / f"{name}.png", optimize=True)
    filename = f"{name}.png"
    web = cutout.copy()
    web.thumbnail((web_size, web_size), Image.Resampling.LANCZOS)
    web.save(ROOT.parent / "_static" / "images" / "brand" / filename, optimize=True)
    print(f"{name}: crop={bounds}; cutout={cutout.size}; web={web.size}; {filename}")


if __name__ == "__main__":
    prepare("rosette", 128)
    prepare("mascot", 256)
    prepare("rosette-rounded", 128, clean_alpha=True)
    prepare("tissue-roi", 128)
