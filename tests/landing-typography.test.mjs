import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = read("_static/css/landing.css");
const template = read("_templates/landing.html");
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

test("contribution copy inherits the body typography and line spacing", () => {
  assert.match(css, /body \{[^}]*font-size: var\(--text-body\); line-height: 1\.6;/);
  const overrides = rules.filter(([, selector, declarations]) =>
    /\.contact(?:\s|\b)/.test(selector) &&
    !selector.includes("h2") &&
    /(?:^|;)\s*(?:font(?:-[\w-]+)?|line-height|letter-spacing)\s*:/.test(declarations));
  assert.equal(overrides.length, 0);
});

test("the introductory description has its own 18 px lead size and 28 px line spacing", () => {
  assert.match(css, /--text-lead: 1\.125rem;/);
  assert.match(css, /\.introduction-copy \{[^}]*font-size: var\(--text-lead\); line-height: 1\.75rem;/);
  assert.doesNotMatch(css, /\.introduction-copy \{[^}]*(?:font-family|font-weight):/);
});

test("all gallery headings use regular weight without component-specific tracking", () => {
  const heading = rules.filter(([, selector, declarations]) =>
    selector.includes(".capture-heading h3") && /font-weight/.test(declarations));
  assert.equal(heading.length, 1);
  assert.equal(heading[0][1].trim(), ".capture-heading h3");
  assert.match(heading[0][2], /font-size: var\(--text-feature\); font-weight: 400;/);
  assert.doesNotMatch(css, /\.capture-heading h3 \{[^}]*letter-spacing:/);
});

test("gallery image sizes use one 75 percent scale without scaling text or the viewer", () => {
  assert.match(css, /--gallery-scale: \.75;/);
  assert.match(css, /--gallery-card-size: calc\(min\(68cqw, max\(416px, calc\(100vh - 200px\)\)\) \* var\(--gallery-scale\)\);/);
  assert.match(css, /\.capture-frame \{[^}]*width: calc\(100% \* var\(--gallery-scale\)\); margin-inline: auto;/);
  const consumers = rules.filter(([, , declarations]) => declarations.includes("var(--gallery-scale)"));
  assert.deepEqual(consumers.map(([, selector]) => selector.trim().split("\n").at(-1)), [".workflow", ".capture-frame"]);
});

test("Documentation has no trailing arrow; module links use an up-right arrow", () => {
  const docs = template.match(/<a class="documentation-link"[\s\S]*?<\/a>/)[0];
  assert.doesNotMatch(docs, /arrow/);
  assert.match(docs, /icon\('book'\)/);
  assert.match(template, /id="icon-arrow-up-right"[^>]*>\s*<path d="m7 17 10-10M7 7h10v10"/);
  assert.equal([...template.matchAll(/icon\('arrow-up-right'\)/g)].length, 2);
  assert.doesNotMatch(template, /icon\('arrow'\)|id="icon-arrow"/);
  assert.doesNotMatch(css, /\.documentation-link.*icon:last-child/);
});
