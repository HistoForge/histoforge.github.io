"""Sphinx configuration for the public HistoForge documentation."""

from hashlib import sha256
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from catalog import load_landing_modules

project = "HistoForge"
author = "HistoForge contributors"
copyright = "2026, HistoForge contributors"

version = ""
release = ""

extensions = [
    "myst_parser",
    "sphinx_rtd_theme",
]

source_suffix = {
    ".md": "markdown",
    ".rst": "restructuredtext",
}
master_doc = "docs/index"
templates_path = ["_templates"]
exclude_patterns = [
    ".git",
    ".agents",
    ".venv",
    "_build",
    "_review",
    "_static",
    "_catalog",
    "tests",
    "branding",
    "LICENSES",
    "AGENTS.md",
    "AUTHORING.md",
    "BRANDING.md",
    "PUBLISHING_CHECKLIST.md",
    "README.md",
    "REVIEW.md",
    "SCREENSHOTS.md",
    "THIRD_PARTY_NOTICES.md",
]

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "replacements",
    "smartquotes",
]

myst_heading_anchors = 2

html_theme = "sphinx_rtd_theme"
html_theme_options = {
    "collapse_navigation": True,
    "navigation_depth": 4,
    "sticky_navigation": True,
    "style_nav_header_background": "#343131",
}
html_title = "HistoForge documentation"
html_logo = "_static/images/brand/tissue-roi.png"
html_favicon = html_logo
html_static_path = ["_static"]
# Preserve the public licence and attribution URLs alongside the built pages.
html_extra_path = [
    "LICENSE",
    "LICENSE-CC-BY-4.0.txt",
    "LICENSE-MIT.txt",
    "THIRD_PARTY_NOTICES.md",
    "README.md",
]
html_css_files = ["css/custom.css"]
html_show_sourcelink = False
html_show_sphinx = False

# The landing page is the site root; the guides keep their /docs/ URLs.
html_additional_pages = {"index": "landing.html", "home/index": "home-redirect.html"}
html_context = {
    "review_enabled": tags.has("review"),
    # Verified public release; the same JAR supports both QuPath versions.
    "landing_download_url": "https://github.com/HistoForge/histoforge-qupath-extension/releases/download/v0.2.2/histoforge-extension-0.2.2-all.jar",
    "landing_modules": load_landing_modules(review=tags.has("review")),
}

# This standalone template bypasses the theme's asset hashing. Version its assets
# together so a cached script or stylesheet cannot disagree with fresh markup.
_landing_assets = (
    "_static/css/landing.css",
    "_static/landing.js",
    "_static/gallery-viewer.js",
    "_static/modules.js",
    "_static/images/huggingface.svg",
    html_logo,
    "_review/landing-design.css",
    "_review/landing-design.js",
)
html_context["landing_asset_version"] = sha256(
    b"".join((Path(__file__).parent / name).read_bytes() for name in _landing_assets)
).hexdigest()[:12]

# Login-only URL linked by HF's public token guide; anonymous requests return 401.
linkcheck_ignore = [r"^https://huggingface\.co/settings/tokens$"]

# Review assets are copied and loaded only in the separate local review build.
if tags.has("review"):
    html_static_path.append("_review")
    html_css_files.append("review.css")
    html_js_files = [("review.js", {"type": "module"})]
