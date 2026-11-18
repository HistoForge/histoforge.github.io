"""Publish consistent page URLs and discovery files with the HTML build."""

from pathlib import Path
from urllib.parse import urljoin
from xml.etree import ElementTree


def page_url(app, pagename):
    """Use directory URLs for index pages and the root for the old home redirect."""
    if pagename == "home/index":
        pagename = "index"
    uri = app.builder.get_target_uri(pagename)
    if uri == "index.html":
        uri = ""
    elif uri.endswith("/index.html"):
        uri = uri.removesuffix("index.html")
    return urljoin(app.config.html_baseurl, uri)


def set_canonical_url(app, pagename, templatename, context, doctree):
    context["pageurl"] = page_url(app, pagename)


def write_search_files(app, exception):
    """List current content pages only after a successful HTML build."""
    if exception is not None or app.builder.name != "html":
        return
    pages = app.env.found_docs | set(app.config.html_additional_pages)
    pages.discard("home/index")
    sitemap = ElementTree.Element(
        "urlset", {"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    )
    for url in sorted({page_url(app, page) for page in pages}):
        entry = ElementTree.SubElement(sitemap, "url")
        ElementTree.SubElement(entry, "loc").text = url
    output = Path(app.outdir)
    ElementTree.ElementTree(sitemap).write(
        output / "sitemap.xml", encoding="utf-8", xml_declaration=True
    )
    sitemap_url = urljoin(app.config.html_baseurl, "sitemap.xml")
    (output / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {sitemap_url}\n", encoding="utf-8"
    )


def setup(app):
    app.connect("html-page-context", set_canonical_url)
    app.connect("build-finished", write_search_files)
    return {"parallel_read_safe": True, "parallel_write_safe": True}
