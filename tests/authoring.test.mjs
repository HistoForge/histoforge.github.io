import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const guidePaths = readdirSync(join(root, "docs/module-authoring"))
  .filter((name) => name.endsWith(".md"))
  .map((name) => `docs/module-authoring/${name}`);

test("AI instructions have one source and link to existing documentation", () => {
  const promptPath = "_static/prompts/create-module.txt";
  assert.ok(read("docs/module-authoring/ai-assisted.md").includes(
    `{literalinclude} ../../${promptPath}`));
  const prompt = read(promptPath);
  const links = [...prompt.matchAll(/https:\/\/histoforge\.github\.io\/(docs\/[^\s#]+)\.html/g)];
  assert.ok(links.length > 0, "Missing documentation links in the AI instructions");
  for (const [, path] of links) {
    assert.doesNotThrow(() => read(`${path}.md`), `Missing documentation source: ${path}`);
  }
  assert.doesNotMatch(prompt, /https?:\/\/(?:localhost|127\.0\.0\.1)\b/);
});

test("complete authoring scripts have a single source shared with the rendered guide", () => {
  for (const [page, script] of [
    ["first-module", "count/metrics.groovy"],
    ["processing-scripts", "review_objects.groovy"],
    ["measurements", "measurements/metrics.groovy"],
  ]) {
    assert.ok(read(`docs/module-authoring/${page}.md`).includes(
      `{literalinclude} ../../examples/module-authoring/${script}`));
    const source = read(`examples/module-authoring/${script}`);
    const headers = [...source.matchAll(/\/\* @histoforge-(metrics|classes)\n([\s\S]*?)\n\*\//g)];
    assert.equal(headers.length, 1);
    const values = JSON.parse(headers[0][2]);
    assert.ok(Array.isArray(values) && values.length > 0);
    if (headers[0][1] === "metrics") {
      assert.equal(new Set(values.map((value) => value.name)).size, values.length);
      for (const value of values) {
        assert.ok(source.includes(`${value.name}:`), `Missing return for ${value.name}`);
        assert.ok(value.type === "distribution" ? value.aggregation === "pool" :
          ["sum", "mean"].includes(value.aggregation));
      }
    }
  }
});

test("recipe excerpts are valid JSON without fictional weight packages", () => {
  for (const path of [...guidePaths, "docs/reference/recipe.md"]) {
    for (const match of read(path).matchAll(/```json\n([\s\S]*?)```/g)) {
      assert.doesNotThrow(() => JSON.parse(match[1]), path);
    }
    assert.doesNotMatch(read(path), /\/Users\/|codex:\/\/|epivara\//i);
  }
  assert.match(read("docs/module-authoring/first-module.md"), /run successfully/);
  assert.match(read("docs/module-authoring/first-module.md"), /fresh test project/);
});

test("starters are explained in Training with exact links", () => {
  const text = read("docs/training/choose-model.md");
  for (const phrase of ["# Choose a starting model", "H&E-12", "DINOv3", "Cellpose", "HoVer",
    "Dense semantic", "% Revision: BASE-TRAINING"]) {
    assert.ok(text.includes(phrase));
  }
  const refs = [...text.matchAll(/https:\/\/huggingface\.co\/histoforge\/(starter-[a-z0-9-]+)\)/g)]
    .map((match) => match[1]);
  assert.deepEqual(refs, ["starter-he12-cellpose", "starter-dinov3-cellpose",
    "starter-he12-hovernet", "starter-dinov3-hovernet", "starter-he12-semantic",
    "starter-dinov3-semantic"]);
  assert.match(read("docs/module-authoring/add-model.md"), /training\/choose-model\.md/);
});

test("publishing and installing use current controls and shared procedures", () => {
  const publish = read("docs/training/publish.md");
  assert.match(publish, /\*\*New repo visibility\*\*/);
  assert.match(publish, /no license selector/);
  assert.match(publish, /does not assign a default license/);
  assert.doesNotMatch(publish, /Choose the applicable \*\*License\*\*|selected license identifier/);
  const install = read("docs/using-histoforge/modules.md");
  assert.match(install, /\*\*Install module\*\*/);
  assert.doesNotMatch(install, /\+ Add|Expand its card/);
  assert.match(read("docs/module-authoring/first-module.md"), /training\/publish\.md#publish-from-qupath/);
  assert.match(read("docs/module-authoring/test-and-share.md"), /\*\*Redo\*\*/);
  assert.match(read("docs/module-authoring/test-and-share.md"), /\*\*Metrics\*\*/);
});
