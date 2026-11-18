# <img src="_static/images/brand/tissue-roi.png" width="32" height="32" alt=""> HistoForge website and documentation

Source for the [HistoForge website](https://histoforge.github.io/) and
[documentation](https://histoforge.github.io/docs/). HistoForge is a histology
image-analysis platform for QuPath.

Found an unclear instruction or missing topic? [Open an issue](https://github.com/HistoForge/histoforge.github.io/issues)
with the page link and a short explanation.

## Build locally

Use Python 3.12:

```bash
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
make html
```

Serve the preview locally so the gallery and other browser scripts work:

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory _build/html
```

Open <http://127.0.0.1:8000/> for the landing page or <http://127.0.0.1:8000/docs/>
for the guides.

See [Contributing](https://github.com/HistoForge/histoforge.github.io/blob/main/CONTRIBUTING.md)
for editing and checks, [Branding](https://github.com/HistoForge/histoforge.github.io/blob/main/BRANDING.md)
for artwork preparation, and [Third-party notices](THIRD_PARTY_NOTICES.md) for
attribution. Microscopy images have separate
[credits and licences](https://histoforge.github.io/docs/reference/image-credits.html).
