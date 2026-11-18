"""Check the search metadata produced by the real public Sphinx build."""

from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest
from urllib.parse import urlsplit
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://histoforge.github.io/"


class PageMetadata(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.canonicals = []
        self.verification_tags = []
        self.download_links = []
        self.site_names = []
        self.structured_data = []
        self._structured_data_chunks = None
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "link" and attributes.get("rel") == "canonical":
            self.canonicals.append(attributes["href"])
        if tag == "meta" and attributes.get("name") == "google-site-verification":
            self.verification_tags.append(attributes["content"])
        if tag == "a" and "download-link" in attributes.get("class", "").split():
            self.download_links.append(attributes)
        if tag == "meta" and attributes.get("property") == "og:site_name":
            self.site_names.append(attributes["content"])
        if tag == "script" and attributes.get("type") == "application/ld+json":
            self._structured_data_chunks = []

    def handle_data(self, data):
        if self._structured_data_chunks is not None:
            self._structured_data_chunks.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._structured_data_chunks is not None:
            self.structured_data.append(json.loads("".join(self._structured_data_chunks)))
            self._structured_data_chunks = None


class SearchMetadataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = TemporaryDirectory()
        cls.addClassCleanup(cls.directory.cleanup)
        cls.output = Path(cls.directory.name) / "html"
        subprocess.run(
            [
                sys.executable, "-m", "sphinx", "-q", "-W", "-b", "html",
                "-d", str(Path(cls.directory.name) / "doctrees"),
                str(ROOT), str(cls.output),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

    def test_sitemap_contains_real_pages_with_matching_canonicals(self):
        sitemap = ElementTree.parse(self.output / "sitemap.xml")
        urls = [element.text for element in sitemap.findall(
            ".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc"
        )]
        self.assertIn(BASE_URL, urls)
        self.assertIn(BASE_URL + "docs/", urls)
        self.assertIn(BASE_URL + "docs/getting-started/installation.html", urls)
        self.assertEqual(len(urls), len(set(urls)))
        html_pages = {path.relative_to(self.output).as_posix()
                      for path in self.output.rglob("*.html")}
        self.assertEqual(len(urls), len(html_pages - {
            "home/index.html", "genindex.html", "search.html"
        }))
        for url in urls:
            with self.subTest(url=url):
                parsed = urlsplit(url)
                self.assertEqual(parsed.scheme, "https")
                self.assertEqual(parsed.netloc, "histoforge.github.io")
                self.assertFalse(parsed.query or parsed.fragment)
                relative_path = parsed.path.lstrip("/")
                if not relative_path or relative_path.endswith("/"):
                    relative_path += "index.html"
                page = self.output / relative_path
                self.assertTrue(page.is_file())
                self.assertEqual(PageMetadata(page).canonicals, [url])

    def test_redirect_and_verification_tag(self):
        self.assertEqual(
            PageMetadata(self.output / "home/index.html").canonicals, [BASE_URL]
        )
        tags = PageMetadata(self.output / "index.html").verification_tags
        self.assertEqual(len(tags), 1)
        self.assertTrue(tags[0])

    def test_robots_allows_crawling_and_advertises_the_sitemap(self):
        self.assertEqual(
            (self.output / "robots.txt").read_text(encoding="utf-8"),
            f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}sitemap.xml\n",
        )

    def test_homepage_declares_the_site_name_at_its_canonical_url(self):
        metadata = PageMetadata(self.output / "index.html")
        self.assertEqual(metadata.site_names, ["HistoForge"])
        self.assertEqual(metadata.canonicals, [BASE_URL])
        self.assertEqual(metadata.structured_data, [{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": metadata.site_names[0],
            "url": metadata.canonicals[0],
        }])

    def test_landing_and_guides_share_the_same_analytics_controls(self):
        for name in ["index.html", "docs/index.html", "privacy.html"]:
            with self.subTest(page=name):
                html = (self.output / name).read_text(encoding="utf-8")
                self.assertEqual(html.count('class="analytics-notice"'), 1)
                self.assertIn('data-analytics-settings hidden', html)
                self.assertIn('data-measurement-id="G-', html)
                self.assertEqual(html.count('/analytics.js?'), 1)

    def test_download_and_release_notes_match_the_displayed_version(self):
        homepage = self.output / "index.html"
        html = homepage.read_text(encoding="utf-8")
        version = re.search(r"Version (\d[\w.-]*) ", html)
        self.assertIsNotNone(version)
        version = version.group(1)
        archive = "https://github.com/HistoForge/histoforge-qupath-extension/releases"
        jar = f"{archive}/download/v{version}/histoforge-extension-{version}-all.jar"
        links = PageMetadata(homepage).download_links
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0]["href"], jar)
        self.assertIn("data-analytics-download", links[0])
        self.assertEqual(html.count("data-analytics-download"), 1)
        self.assertIn(f'href="{archive}/tag/v{version}"', html)
        self.assertIn(f'aria-label="What’s new in HistoForge {version}">What’s new</a>', html)

        guide = (self.output / "docs/getting-started/installation.html").read_text(encoding="utf-8")
        self.assertIn(f'href="{jar}">Download HistoForge {version}</a>', guide)
        self.assertIn(f'href="{archive}">Release notes and downloads</a>', guide)
