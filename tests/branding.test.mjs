import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync, readdirSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const bytes = (path) => readFileSync(new URL(`../${path}`, import.meta.url));

test("the selected original artwork is preserved byte for byte", () => {
  const guide = read("BRANDING.md");
  for (const [name, label] of [
    ["rosette", "Rosette"],
    ["mascot", "Mascot"],
    ["rosette-rounded", "Rounded rosette"],
    ["tissue-roi", "Tissue ROI"],
  ]) {
    const expected = guide.match(new RegExp(`${label} SHA-256: .([a-f0-9]{64})`))[1];
    assert.equal(createHash("sha256").update(bytes(`branding/source/${name}.png`)).digest("hex"), expected);
  }
});

test("web assets are compact RGBA PNGs with the correct aspect ratio", () => {
  for (const [name, width] of [["rosette", 128], ["rosette-rounded", 128], ["tissue-roi", 128], ["mascot", 256]]) {
    const png = bytes(`_static/images/brand/${name}.png`);
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png[25], 6, "RGBA color type required");
    assert.equal(png.readUInt32BE(16), width);
    const height = png.readUInt32BE(20);
    assert.ok(name === "mascot" ? height < width : height === width);
    assert.ok(png.length < 100_000, "Keep header assets small");
  }
});

test("headers and favicon share the configured product mark with live text", () => {
  const config = read("conf.py");
  assert.match(config, /html_logo = "_static\/images\/brand\/tissue-roi\.png"/);
  assert.match(config, /html_favicon = html_logo/);
  assert.match(config, /_landing_assets = \([\s\S]*?\n    html_logo,/);
  assert.match(read("README.md"), /src="_static\/images\/brand\/tissue-roi\.png"/);
  const landing = read("_templates/landing.html");
  const docs = read("_templates/layout.html");
  assert.match(landing, /src="\{\{ logo_url \}\}"[^>]+alt=""/);
  assert.match(landing, /<span>HistoForge<\/span>/);
  assert.match(landing, /href="\{\{ favicon_url \}\}"/);
  assert.match(docs, /src="\{\{ logo_url \}\}"[^>]+alt=""/);
  assert.match(docs, /<span>\{\{ project \}\}<\/span>/);
  assert.equal([...docs.matchAll(/\{\{ brand\(\) \}\}/g)].length, 2);
  assert.match(docs, /include "searchbox.html"/);
  assert.match(docs, /class="version-switch"/);
  assert.match(docs, /class="language-switch"/);
});

test("the mascot is retained as an asset without a documentation placement", () => {
  const pages = readdirSync(new URL("../docs/", import.meta.url), {recursive: true})
    .filter((path) => path.endsWith(".md") && /brand\/mascot/.test(read(`docs/${path}`)));
  assert.deepEqual(pages, []);
  assert.doesNotMatch(read("_static/css/custom.css"), /hf-setup-mascot/);
  assert.doesNotMatch(read("_templates/landing.html") + read("_templates/layout.html"), /mascot/);
  assert.match(read("conf.py"), /exclude_patterns = \[[\s\S]*?"branding"/);
  assert.match(read("conf.py"), /exclude_patterns = \[[\s\S]*?"BRANDING.md"/);
});
