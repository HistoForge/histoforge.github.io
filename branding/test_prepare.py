"""Optional Pillow checks for selected web exports and deterministic alpha cleanup."""

import unittest

from PIL import Image, ImageDraw

from prepare import ROOT, clean_rosette_alpha


class BrandAssetTest(unittest.TestCase):
    def test_exports_preserve_original_colors_and_geometry(self):
        for name, web_size in (
            ("rosette", 128),
            ("rosette-rounded", 128),
            ("tissue-roi", 128),
            ("mascot", 256),
        ):
            with self.subTest(name=name):
                with Image.open(ROOT / f"{name}.png") as original:
                    resized = original.copy()
                resized.thumbnail((web_size, web_size), Image.Resampling.LANCZOS)
                path = ROOT.parent / "_static/images/brand" / f"{name}.png"
                with Image.open(path) as web:
                    self.assertEqual(web.mode, "RGBA")
                    self.assertEqual(web.size, resized.size)
                    self.assertEqual(web.tobytes(), resized.tobytes())

    def test_round_mark_has_transparent_padding_and_center(self):
        with Image.open(ROOT / "rosette-rounded.png") as mark:
            width, height = mark.size
            self.assertEqual(width, height)
            alpha = mark.getchannel("A")
            for point in ((0, 0), (width - 1, height - 1), (width // 2, height // 2)):
                self.assertEqual(alpha.getpixel(point), 0)
        with Image.open(ROOT.parent / "_static/images/brand/rosette-rounded.png") as web:
            self.assertFalse(
                any(
                    min(r, g, b) >= 235 and a >= 32
                    for r, g, b, a in web.get_flattened_data()
                ),
                "White export residue must not appear on the dark documentation header",
            )

    def test_alpha_cleanup_keeps_six_cells_and_removes_export_noise(self):
        source = Image.new("RGBA", (180, 120))
        draw = ImageDraw.Draw(source)
        centers = [(x, y) for y in (30, 90) for x in (30, 90, 150)]
        for x, y in centers:
            draw.ellipse((x - 14, y - 14, x + 14, y + 14), fill=(220, 140, 155, 253))
        draw.rectangle((44, 25, 48, 35), fill=(255, 255, 255, 255))
        source.putpixel((2, 2), (220, 140, 155, 255))
        source.putpixel((90, 60), (220, 140, 155, 12))
        original_bytes = source.tobytes()
        alpha = clean_rosette_alpha(source)
        for point in centers:
            self.assertEqual(alpha.getpixel(point), 255)
        for point in ((2, 2), (90, 60), (47, 30)):
            self.assertEqual(alpha.getpixel(point), 0)
        self.assertEqual(source.tobytes(), original_bytes)

    def test_tissue_roi_has_no_white_canvas_in_its_web_export(self):
        with Image.open(ROOT / "tissue-roi.png") as mark:
            self.assertEqual(mark.size[0], mark.size[1])
            self.assertEqual(mark.getpixel((0, 0))[3], 0)
            self.assertEqual(mark.getpixel((mark.width // 2, mark.height // 2))[3], 255)


if __name__ == "__main__":
    unittest.main()
