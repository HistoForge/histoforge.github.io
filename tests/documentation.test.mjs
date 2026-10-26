import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, readdirSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

function children(path) {
  return [...read(path).matchAll(/```\{toctree\}\n([\s\S]*?)```/g)]
    .flatMap((match) => match[1].split("\n"))
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith(":"))
    .map((line) => resolve(root, dirname(path), line + ".md").slice(root.length));
}

function articles(directory = "docs") {
  return readdirSync(join(root, directory), {withFileTypes: true}).flatMap((entry) =>
    entry.isDirectory() ? articles(join(directory, entry.name)) :
      entry.name.endsWith(".md") ? [join(directory, entry.name)] : []);
}

test("navigation follows overview, setup, usage, training, authoring, reference, contribution", () => {
  assert.deepEqual(children("docs/index.md"), ["docs/key-concepts.md", "docs/getting-started/index.md",
    "docs/using-histoforge/index.md", "docs/training/index.md", "docs/module-authoring/index.md", "docs/reference/index.md",
    "docs/contribute.md"]);
  assert.deepEqual(children("docs/getting-started/index.md"), [
    "docs/getting-started/before-you-start.md", "docs/getting-started/modal.md",
    "docs/getting-started/hugging-face.md", "docs/getting-started/installation.md"]);
  assert.deepEqual(children("docs/using-histoforge/index.md"), [
    "docs/using-histoforge/modules.md", "docs/getting-started/first-analysis.md",
    "docs/using-histoforge/whole-slide.md", "docs/using-histoforge/actions-and-results.md",
    "docs/using-histoforge/export.md", "docs/using-histoforge/cloud-images.md"]);
  assert.deepEqual(children("docs/using-histoforge/cloud-images.md"), [
    "docs/using-histoforge/cloud-aws-setup.md"]);
  assert.deepEqual(children("docs/training/index.md"), [
    "docs/training/choose-model.md", "docs/training/prepare-data.md", "docs/training/train.md",
    "docs/training/review-result.md", "docs/training/publish.md"]);
  assert.deepEqual(children("docs/reference/index.md"), [
    "docs/reference/data-and-privacy.md", "docs/reference/troubleshooting.md",
    "docs/reference/recipe.md", "docs/reference/model-compatibility.md",
    "docs/reference/script-functions.md", "docs/reference/citing.md"]);
  assert.deepEqual(children("docs/module-authoring/index.md"), [
    "docs/module-authoring/ai-assisted.md",
    "docs/module-authoring/first-module.md", "docs/module-authoring/add-model.md",
    "docs/module-authoring/recipes.md", "docs/module-authoring/processing-scripts.md",
    "docs/module-authoring/measurements.md", "docs/module-authoring/test-and-share.md"]);
});

test("every guide has one navigation entry; image credits are linked from the gallery only", () => {
  const visited = new Set();
  function visit(path) {
    assert.ok(!visited.has(path), `Repeated or circular navigation: ${path}`);
    visited.add(path);
    children(path).forEach(visit);
  }
  visit("docs/index.md");
  const imageCredits = "docs/reference/image-credits.md";
  assert.deepEqual([...visited].sort(), articles().filter(path => path !== imageCredits).sort());
  assert.match(read(imageCredits), /^---\norphan: true\n---\n/);
  assert.match(read("_templates/landing.html"), /pathto\('docs\/reference\/image-credits'\)/);
});

test("screenshot source markers are unique", () => {
  const markers = articles().flatMap((path) =>
    [...read(path).matchAll(/^% Screenshot: ([a-z0-9-]+)$/gm)].map((match) => match[1]));
  assert.equal(new Set(markers).size, markers.length);
});

test("public copy excludes development notices and release checklists", () => {
  for (const path of articles()) {
    assert.doesNotMatch(read(path), /Development version|Pre-release documentation|What is pending|PUBLISHING_CHECKLIST|REVIEW\.md/);
  }
});

test("agent instructions and author-only documents are excluded from site builds", () => {
  const exclusions = read("conf.py").match(/exclude_patterns = \[([\s\S]*?)\n\]/)?.[1];
  assert.ok(exclusions, "Missing Sphinx source exclusions");
  for (const path of [".agents", "AGENTS.md", "AUTHORING.md", "PUBLISHING_CHECKLIST.md", "REVIEW.md"]) {
    assert.ok(exclusions.includes(`"${path}"`), `Internal source is not excluded: ${path}`);
  }
});

test("idle costs link to the stopping warning and retention describes scheduled cleanup", () => {
  const costs = read("docs/getting-started/modal.md");
  const troubleshooting = read("docs/reference/troubleshooting.md");
  const privacy = read("docs/reference/data-and-privacy.md");
  assert.match(costs, /\{ref\}`[^`]+<stopping-the-backend>`/);
  assert.match(costs, /^\(costs-while-histoforge-is-idle\)=$/m);
  assert.match(troubleshooting, /^\(stopping-the-backend\)=$/m);
  assert.match(troubleshooting, /\*\*Reconnect\*\*\s+requires an existing deployment; it does not redeploy it/);
  assert.match(privacy, /expired analysis files every hour/);
  assert.match(privacy, /maximum usable lifetime of 48 hours\./);
  assert.match(privacy, /clock\s+starts when the backend reserves the upload, before it receives the image files/);
  assert.match(privacy, /Completing the\s+upload does not restart the clock/);
  assert.match(privacy, /incomplete upload expires after one hour without activity/);
  assert.match(privacy, /does not extend upload expiry/);
  assert.match(privacy, /Expired\s+uploads cannot be reused even if their files remain in storage/);
  assert.match(privacy, /do not promise physical deletion at the expiry time/);
  assert.match(privacy, /do not apply to the training datasets/);
  assert.doesNotMatch(privacy, /not by a timed deletion service/);
});

test("connection checks stay distinct from reconnecting and updating shared backends", () => {
  const setup = read("docs/getting-started/installation.md");
  const troubleshooting = read("docs/reference/troubleshooting.md");
  const warning = setup.indexOf("finish its cloud work before connecting here");
  assert.ok(warning >= 0 && warning < setup.indexOf("1. Open **Extensions"));
  assert.match(setup, /a new connection can disconnect that session/);
  assert.match(troubleshooting, /\*\*Reconnect\*\* replaces the backend's connection key/);
  assert.match(troubleshooting, /another QuPath session\s+using the same backend/);
  assert.match(troubleshooting, /\*\*Retry\*\* or \*\*Recheck\*\* to check status without replacing the key/);
  assert.match(troubleshooting, /\*\*Update cloud backend\*\* in \*\*Settings\*\* is not a version check/);
  assert.match(troubleshooting, /After confirmation, it stops\s+unfinished cloud work and redeploys/);
  assert.match(troubleshooting, /Do not submit work or reconnect from another session until the update finishes/);
  assert.match(troubleshooting, /backend version without updating, use \*\*Recheck\*\* in \*\*Settings\*\*/);
});

test("QuPath token setup does not expose manual Secret configuration", () => {
  for (const path of articles()) {
    assert.doesNotMatch(read(path), /HF_TOKEN|histoforge-huggingface|save-the-token-in-modal/);
  }
  const setup = read("docs/getting-started/installation.md").split("## Connect the backend")[1];
  assert.match(setup, /\*\*Enter or replace token\*\*/);
  assert.ok(setup.indexOf("**Save token**") < setup.indexOf("**Set up backend**"));
  assert.match(setup, /Token verified and saved/);
  assert.match(setup, /QuPath does not ask you to choose a workspace/);
  assert.doesNotMatch(setup, /Confirm the Modal workspace/);
});

test("installation separates JAR and backend updates and protects unfinished analysis", () => {
  const setup = read("docs/getting-started/installation.md");
  assert.match(setup, /same file with QuPath 0\.6\.0 or 0\.7\.0/);
  const warning = setup.indexOf("finish or stop unfinished analysis in **Jobs**");
  assert.ok(warning >= 0 && warning < setup.indexOf("1. [Download HistoForge"));
  assert.match(setup, /before replacing the JAR/);
  assert.match(setup, /Replacing the JAR does not update the cloud backend/);
  assert.match(setup, /\*\*Settings → Update cloud backend\*\*/);
  assert.match(setup, /updating cancels unfinished analysis and training/);
  assert.match(setup, /troubleshooting\.md#connection/);
  assert.match(read("docs/getting-started/before-you-start.md"),
    /no separate Windows and macOS JARs/);
  assert.match(read("docs/reference/troubleshooting.md"),
    /even if its displayed version number is unchanged/);
});

test("inference precision explains speed, cost and trade-offs before the controls", () => {
  const text = read("docs/using-histoforge/actions-and-results.md")
    .split("## Inference precision\n")[1]?.split("\n## ")[0];
  assert.ok(text, "Missing inference precision guidance");
  const benefit = text.indexOf("BF16 can run model predictions faster on supported cloud GPUs");
  assert.ok(benefit >= 0 && benefit < text.indexOf("**Settings → Inference precision**"));
  const cost = text.indexOf("Shorter GPU runs can also reduce");
  assert.ok(cost > benefit && cost < text.indexOf("**Settings → Inference precision**"));
  assert.match(text, /Shorter GPU runs can also reduce\s+compute costs/);
  assert.match(text, /uses fewer digits\s+in some calculations/);
  assert.match(text, /predictions and measurements can differ from \*\*Default\*\*/);
  assert.match(text, /Speed and cost savings depend on the model, image and GPU/);
  assert.match(text, /\*\*Settings → Inference precision\*\*/);
  assert.match(text, /new \*\*Fill\*\*\s+and \*\*Redo\*\* runs/);
  assert.match(text, /\*\*BF16 \(if applicable\)\*\* is selected initially/);
  assert.match(text, /model and GPU support\s+it; otherwise it uses \*\*Default\*\*/);
  assert.match(text, /\*\*Default\*\* uses the model's standard numerical precision/);
  assert.match(text, /does not alter existing results, unfinished runs or training/);
  assert.match(text, /Use \*\*Redo\*\*\s+to replace existing results/);
});

test("cloud setup and first analysis use the connection-status tooltip", () => {
  const setup = read("docs/getting-started/installation.md").split("## Connect the backend")[1];
  const labels = ["**Extensions → HistoForge → Open HistoForge**", "**Set up cloud**",
    "**Enter or replace token**", "**Save token**", "**Set up backend**"];
  const positions = labels.map((label) => setup.indexOf(label));
  assert.ok(positions.every((position) => position >= 0), "Missing setup control");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(setup, /\*\*Project\*\* and \*\*Jobs\*\* tabs are available without a cloud connection/);
  assert.match(setup, /hover over the status dot at the top right/);
  assert.match(setup, /tooltip shows \*\*Connected\*\*/);
  assert.doesNotMatch(setup, /header shows \*\*Connected\*\*|tabs appear/);
  const first = read("docs/getting-started/first-analysis.md");
  assert.match(first, /Hover over the top-right status dot/);
  assert.match(first, /tooltip says\s+\*\*Connected\*\*/);
  assert.doesNotMatch(first, /header should show/);
  const troubleshooting = read("docs/reference/troubleshooting.md");
  assert.match(troubleshooting, /\*\*Cloud backend not configured\*\* \| Select \*\*Set up cloud\*\*/);
});

test("training distinguishes marked ROIs from ordinary shapes and explains object limits", () => {
  const training = read("docs/training/prepare-data.md");
  assert.match(training, /not QuPath's ordinary rectangle tool/);
  assert.match(training, /annotations are not training ROIs, even if you rename them/);
  assert.match(training, /smaller,\s+non-overlapping HistoForge ROIs/);
  assert.match(training, /Existing detections\s+with mapped training classes count/);
});

test("training object-size filtering applies to predictions, not training annotations", () => {
  const row = read("docs/training/train.md").split("\n")
    .find(line => line.startsWith("| **Minimum object area** |"));
  assert.ok(row, "Missing minimum-object-area guidance");
  assert.match(row, /predicted objects smaller than this area/);
  assert.match(row, /during validation and later analysis/);
  assert.match(row, /square pixels at the model's resolution/);
  assert.match(row, /training annotations are unchanged/);
});

test("training reports distinguish browser snapshots from retained module reports", () => {
  const review = read("docs/training/review-result.md");
  assert.match(review, /\*\*⋯ → View training report\*\*/);
  assert.match(review, /\*\*Open latest details\*\* again/);
  assert.match(review, /refreshing the browser page does not update it/);
  assert.match(review, /module retains its own training report/);
  const privacy = read("docs/reference/data-and-privacy.md");
  assert.match(privacy, /\*\*Modules → ⋯ → Remove module…\*\*/);
  assert.doesNotMatch(privacy, /\*\*Modules → ⋯ → Delete\*\*/);
  const training = read("docs/training/train.md");
  assert.match(training, /\*\*Cancel\*\* in \*\*Jobs\*\* when it is offered/);
  assert.match(training, /Wait for \*\*Cancelled\*\*/);
});

test("analysis entry points link to the shared image preparation limits", () => {
  for (const path of [
    "docs/getting-started/first-analysis.md",
    "docs/using-histoforge/whole-slide.md",
    "docs/using-histoforge/cloud-images.md",
    "docs/reference/data-and-privacy.md",
    "docs/reference/troubleshooting.md",
  ]) {
    assert.match(read(path), /actions-and-results\.md#image-preparation-limits/,
      `Missing source-image guidance: ${path}`);
  }
  assert.match(read("docs/using-histoforge/actions-and-results.md"),
    /^## Image preparation limits$/m);
});

test("size-limit troubleshooting identifies the failure and preserves saved results", () => {
  const text = read("docs/reference/troubleshooting.md");
  assert.match(text, /^\(prepared-image-exceeds-the-size-limit\)=$/m);
  assert.match(text, /^### Image-size limits$/m);
  assert.match(text, /a prepared image file, a model's input dimensions/);
  assert.match(text, /Previously saved results are kept/);
  assert.match(read("docs/using-histoforge/cloud-images.md"),
    /\]\(prepared-image-exceeds-the-size-limit\)/);
});

test("analysis and export explain exact-class annotation selection", () => {
  const first = read("docs/getting-started/first-analysis.md");
  const actions = read("docs/using-histoforge/actions-and-results.md");
  for (const label of ["HistoForge ROIs", "Annotations by class", "Annotation class"]) {
    assert.ok(first.includes(`**${label}**`), `Missing region-selection control: ${label}`);
  }
  assert.match(first, /not just the highlighted one/);
  assert.match(actions, /Class names must match\s+exactly/);
  assert.match(actions, /Points, lines, detections\s+and annotations produced by HistoForge/);
  assert.match(actions, /must not overlap, although their edges may touch/);
  assert.match(actions, /\*\*Fill\*\* and \*\*Redo\*\* lock and save/);
  assert.match(actions, /\*\*Metrics\*\* and \*\*Export\*\* do not change annotation locks/);
  assert.match(actions, /does not analyze the whole slide instead/);
  assert.match(read("docs/using-histoforge/export.md"), /same annotation class used for analysis/);
  assert.match(first, /same \*\*Scope\*\* and annotation class used for analysis/);
  assert.match(read("docs/key-concepts.md"), /\*\*Annotations by class\*\*/);
});

test("local image guidance bounds reader tests and original-slide uploads", () => {
  const prerequisites = read("docs/getting-started/before-you-start.md");
  const actions = read("docs/using-histoforge/actions-and-results.md");
  const privacy = read("docs/reference/data-and-privacy.md");
  assert.match(prerequisites, /\*\*Default \(let QuPath decide\)\*\*/);
  assert.match(prerequisites, /tested for image reading/);
  assert.match(prerequisites, /does not guarantee\s+that every file variant/);
  assert.match(prerequisites, /8-bit RGB/);
  for (const format of ["SVS", "NDPI", "TIFF", "SCN", "CZI", "BIF", "MRXS", "VSI", "OME-TIFF"]) {
    assert.ok(prerequisites.includes(format), `Missing tested format family: ${format}`);
  }
  assert.match(actions, /OpenSlide\s+or Bio-Formats/);
  assert.match(actions, /\*\*32 GiB in total\*\*, including packaged companion files/);
  assert.doesNotMatch(actions, /restricted to eligible single-file TIFFs|not available through\s+Bio-Formats/);
  assert.match(privacy, /entire slide,\s+its required companion files and embedded metadata/);
  assert.match(privacy, /data outside the selected region/);
  assert.match(read("docs/using-histoforge/cloud-images.md"), /cannot send the original S3 file directly to Modal/);
});

test("processing completion is not presented as a per-region save guarantee", () => {
  const actions = read("docs/using-histoforge/actions-and-results.md");
  assert.match(actions, /may save results from several regions together/);
  assert.match(actions, /not mean its results have been saved/);
  assert.match(actions, /lose unsaved results/);
  for (const path of articles()) assert.doesNotMatch(read(path), /Regions are saved independently/);
});

test("recovery uses Jobs controls without promising automatic continuation", () => {
  const troubleshooting = read("docs/reference/troubleshooting.md");
  for (const label of ["Jobs", "Details", "Continue analysis", "Reconnect to analysis",
    "Stop analysis", "Cancel batch"]) {
    assert.ok(troubleshooting.includes(`**${label}**`), `Missing recovery control: ${label}`);
  }
  assert.match(troubleshooting, /\*\*Retry cloud\s+cancellation\*\*/);
  assert.match(troubleshooting, /cancellation has not been confirmed/);
  assert.match(troubleshooting, /recovery is not guaranteed/);
  assert.match(troubleshooting, /does not restart analysis automatically/);
  assert.match(troubleshooting, /Images and regions not yet started must be selected again/);
  for (const path of articles()) {
    assert.doesNotMatch(read(path), /Unfinished HistoForge work|\| \*\*(Resume|Abandon|Decide later)\*\* \|/);
  }
});

test("script reference documents every shared function and is linked from authoring", () => {
  const text = read("docs/reference/script-functions.md");
  const functions = ["area", "byClass", "pct", "eccentricity", "minorAxis", "majorAxis",
    "solidity", "mainPoly", "matchLargestByCentroid"];
  for (const name of functions) {
    assert.match(text, new RegExp(`^#{2,3} ${name}$`, "m"), `Missing function: ${name}`);
    assert.match(text, new RegExp(`m\\.${name}\\(`), `Missing call example: ${name}`);
  }
  assert.match(read("docs/module-authoring/processing-scripts.md"), /\.\.\/reference\/script-functions\.md/);
  assert.doesNotMatch(text, /\/Users\/|codex:\/\/|32512054775ac12cfd40404b9ffc5d131d24ef3e/);
});

test("public procedures do not restore obsolete install and training controls", () => {
  const obsolete = ["+ Add → From Hugging Face", "Expand its card", "**Result name**",
    "**Result inference GPU**", "**Validation size**", "**Customize...**",
    "**Minimum detected object area**"];
  for (const path of articles()) {
    const text = read(path);
    for (const label of obsolete) assert.ok(!text.includes(label), `${path}: ${label}`);
  }
  assert.match(read("docs/reference/troubleshooting.md"), /\*\*Modules → Install module\*\*/);
  for (const label of ["Name", "Type", "Inference GPU", "Training GPU", "Minimum object area", "Augmentations"]) {
    assert.ok(read("docs/training/train.md").includes(`**${label}**`), label);
  }
  assert.match(read("docs/training/prepare-data.md"), /\*\*% validation\*\*/);
});

test("beginner guides distinguish regions, modules, and measurement-only actions", () => {
  const concepts = read("docs/key-concepts.md");
  assert.match(concepts, /\*\*tissue region\*\* predicted by a model is a result, not an analysis ROI/);
  assert.match(concepts, /training\/choose-model\.md/);
  assert.doesNotMatch(read("docs/training/index.md"), /train (?:a module|one)/);
  for (const path of ["docs/using-histoforge/actions-and-results.md", "docs/key-concepts.md"]) {
    assert.match(read(path), /without\s+rerunning models or processing scripts/);
  }
  assert.match(read("docs/using-histoforge/export.md"), /does not run models or processing\s+scripts/);
});

test("starter guidance separates task choice, initialization, and prediction settings", () => {
  const text = read("docs/training/choose-model.md");
  assert.match(text, /## Choose by the objects you need/);
  assert.match(text, /## Choose the starting weights/);
  assert.match(text, /Both Cellpose and HoVer can separate touching objects and segment nuclei/);
  assert.match(text, /not a guarantee that one will be more accurate or faster/);
  assert.match(text, /steps during prediction, not\s+training\s+epochs/);
  assert.match(text, /fixes this iteration count internally/);
  const table = text.match(/^\| Method \| Start here for \| H&E-12 weights \| DINOv3 weights \|\n(?:\|.*\n)+/m)?.[0];
  assert.ok(table, "Missing linked starter comparison table");
  assert.equal(table.trim().split("\n").length, 5, "Expected a header, separator and three methods");
  assert.equal([...table.matchAll(/https:\/\/huggingface\.co\/histoforge\/starter-/g)].length, 6);
});

test("privacy preserves the publication boundary for packaged supporting files", () => {
  const privacy = read("docs/reference/data-and-privacy.md");
  assert.doesNotMatch(privacy, /Training images are not included/);
  assert.match(privacy, /Publishing does not separately collect training images/);
  assert.match(privacy, /images\s+deliberately included in the module repository are published/);
  assert.match(privacy, /training\/publish\.md#publish-from-qupath/);
});

test("complete measurements example declares the distribution returned by the script", () => {
  const text = read("docs/reference/script-functions.md");
  const section = text.split("## Complete measurements example\n")[1];
  const script = section.match(/```groovy\n([\s\S]*?)```/)[1];
  const schema = JSON.parse(script.match(/\/\* @histoforge-metrics\n([\s\S]*?)\n\*\//)[1]);
  assert.deepEqual(schema, [{name: "nuclear_eccentricity", label: "Nuclear Eccentricity",
    type: "distribution", decimals: 2, aggregation: "pool"}]);
  assert.match(script, /m\.byClass\(children, "Round Leydig Nuclei"\)/);
  assert.match(script, /return \[nuclear_eccentricity: nuclei\.collect \{ m\.eccentricity\(it\) \}\]/);
});
