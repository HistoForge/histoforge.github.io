---
orphan: true
---

# Contributing

For a documentation issue, [open an issue](https://github.com/HistoForge/histoforge.github.io/issues)
with the page link, what is unclear and the correction you suggest. For a software problem, include your operating system and QuPath and
HistoForge versions. Do not attach patient data, private slides, account tokens or
unredacted logs.

## Edit and check

Articles live in `docs/`. Landing-page markup lives in `_templates/landing.html`;
styles and browser scripts live in `_static/`.

Use short instructions and the labels shown in the application. Explain what the
user should do and what they should see. Check behavior against the released
software before describing it as available.

After installing the dependencies in the README, run:

```bash
make test
make html
make linkcheck
```

Use these Makefile targets so the site includes its dependency licences.
Tests require Node.js 22 as well as Python 3.12. For layout changes, inspect the built
pages at desktop and narrow widths, including keyboard navigation.

Use only images you have permission to share. Record their source, licence,
modifications and relevant model limitations in
[Image credits](docs/reference/image-credits.md). Preserve third-party notices.
Do not commit generated builds, private catalog snapshots or review notes.

The optional `make review` build adds local browser comments. Comments stay in
that browser; they are not shared through this repository. Use `make html` for
the normal site.

GitHub Actions runs these checks on pull requests and pushes to `main`. In the
HistoForge website repository, a successful `main` build deploys to GitHub Pages.
It publishes the normal HTML build, not the source files or local review build.
