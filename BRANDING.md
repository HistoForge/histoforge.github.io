# Artwork

The tissue-and-ROI mark appears beside the HistoForge name and serves as the favicon.
The mascot and rosette variants are retained as source assets.

- Original images: `branding/source/`
- Full-size cutouts: `branding/`
- Web images: `_static/images/brand/`

Keep the original images unchanged. Preserve their colours and proportions; use
empty alt text when a mark sits beside the written name.

## Prepare web images

With Pillow 12.3.0 installed:

```bash
python branding/prepare.py
python -m unittest discover -s branding -p 'test_*.py'
```

The script removes background residue, crops empty margins and resizes the images.
It changes transparency and framing, not the source RGB values.

## Source checksums

- Rosette SHA-256: `1220c8a4b47549d6e21f521d3e342dba8a03b2babdc52c2f52d6d464d44da5f4`.
- Mascot SHA-256: `0226a8a787b979810f7070ad47086ee6d38d8aee173a9f1c36fb95566aab4b81`.
- Rounded rosette SHA-256: `aa1ab796fceb44e481ddd0c2c8cd1dbfda14bd06bc99439d9eec554746e39e77`.
- Tissue ROI SHA-256: `4a26c37a6730dc134940c595a143ae0228ab11a594392f8352ad7e4a4bf0ab85`.
