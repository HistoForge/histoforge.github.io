SPHINXBUILD ?= sphinx-build
PYTHON ?= python
SOURCEDIR = .
BUILDDIR = _build

.PHONY: html review linkcheck test modules modules-private clean

html:
	$(SPHINXBUILD) -a -W --keep-going -b html "$(SOURCEDIR)" "$(BUILDDIR)/html"
	cp -R LICENSES "$(BUILDDIR)/html/"

review:
	$(SPHINXBUILD) -a -W --keep-going -t review -b html "$(SOURCEDIR)" "$(BUILDDIR)/review"
	cp -R LICENSES "$(BUILDDIR)/review/"

linkcheck:
	$(SPHINXBUILD) -W --keep-going -b linkcheck "$(SOURCEDIR)" "$(BUILDDIR)/linkcheck"

test:
	node --test tests/*.test.mjs
	$(PYTHON) -m unittest discover -s tests -p 'test_*.py'

modules:
	$(PYTHON) catalog.py

modules-private:
	$(PYTHON) catalog.py --private

clean:
	rm -rf "$(BUILDDIR)"
