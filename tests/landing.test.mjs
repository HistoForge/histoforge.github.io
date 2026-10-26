import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {setup} from "./fixtures/landing-page.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const template = read("_templates/landing.html");
const features = JSON.parse(template.match(/\{% set features = (\[[\s\S]*?\]) %\}/)[1]);
const script = read("_static/landing.js");

test("cell and structure images retain their verified square pixels and credits", () => {
  const images = [
    ["lizard-dpath-36-nuclei.png", 885, "d8f284a51cb24584046f5893cf1957ab13274ea34584a94df24d5c73258c282b", "lizard-cells"],
    ["da-mi-kim-tissue-structures.png", 2048, "3e1c6371a0d864e08772f7a60036a2b0d8b32dee84652aec31699cbfab781394", "da-mi-kim-tissue-structures"],
  ];
  for (const [filename, size, digest, creditId] of images) {
    const bytes = readFileSync(new URL(`../_static/images/gallery/${filename}`, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), digest);
    assert.ok(template.includes(`gallery_image('${filename}', ${size}, ${size},`));
    assert.ok(template.includes(`}}#${creditId}`));
  }
  const credits = read("docs/reference/image-credits.md");
  assert.match(credits, /kaggle.com\/datasets\/aadimator\/lizard-dataset/);
  assert.match(credits, /creativecommons.org\/licenses\/by-nc-sa\/4.0/);
  assert.match(credits, /dpath_36/);
  assert.match(credits, /885 × 885/);
  assert.match(credits, /x = 84, y = 0/);
  assert.match(credits, /overlaid in QuPath/);
  assert.match(credits, /No nuclei are predicted as neutrophils\s+in this crop/);
  assert.match(credits, /missed or misclassified, including plasma cells/);
  assert.match(credits, /deliberately selected for illustration/);
  assert.match(credits, /validation scores contributed to model selection/);
  assert.doesNotMatch(credits, /dpath_26|dpath_41|absent from this crop/);
  for (const color of ["#E69F00", "#CC79A7", "#56B4E9", "#009E73", "#D55E00"]) {
    assert.ok(credits.includes(color));
  }
  assert.doesNotMatch(template, /puma-nuclei\.png|#puma-cells|lizard-dpath-41-nuclei\.png/);
  assert.match(credits, /10\.6084\/m9.figshare.28448267/);
  assert.match(credits, /demonstration pixel size is an estimate/);
  assert.match(credits, /not verified slide calibration/);
});

test("selected RINGS prediction stays uncropped and links its source credit", () => {
  const png = readFileSync(new URL("../_static/images/gallery/rings-tissue-regions.png", import.meta.url));
  assert.equal(png.readUInt32BE(16), 1000);
  assert.equal(png.readUInt32BE(20), 1000);
  assert.match(template, /gallery_image\('rings-tissue-regions\.png', 1000, 1000,/);
  assert.match(template, /pathto\('docs\/reference\/image-credits'\)/);
  const credit = read("docs/reference/image-credits.md");
  assert.match(credit, /10\.17632\/h8bdwrtnr5\.1/);
  assert.match(credit, /creativecommons.org\/licenses\/by\/4.0/);
  assert.match(credit, /P4_C10_16_9_7/);
  assert.match(credit, /not independent performance/);
  const css = read("_static/css/landing.css");
  assert.match(css, /\.workflow \{[^}]*margin: 48px auto 0;/);
  assert.match(css, /\.capture-frame img \{[^}]*object-fit: contain;/);
});

test("metrics retain the user's full-resolution screenshot and its scale limitation", () => {
  assert.match(template, /gallery_image\('histoforge-metrics\.png', 1714, 1724,/);
  const credits = read("docs/reference/image-credits.md");
  assert.match(credits, /screenshot of HistoForge's Project tab and actual measurement\s+table/);
  assert.match(credits, /tubule area, minor and major axes, and circularity/);
  assert.match(credits, /illustrative, not calibrated scientific measurements/);
  assert.doesNotMatch(template, /da-mi-kim-counts\.png/);
});

test("within-structure QuPath export retains its crop and discloses display restrictions", () => {
  const png = readFileSync(new URL("../_static/images/gallery/da-mi-kim-within-structures.png", import.meta.url));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1536);
  assert.equal(png.readUInt32BE(20), 1536);
  assert.equal(createHash("sha256").update(png).digest("hex"), "de3d1bbc94be4e4531e058db63cc958fc887b7702c3f19812fc4fb57082ddc50");
  const chunks = new Set();
  for (let offset = 8; offset < png.length;) {
    chunks.add(png.subarray(offset + 4, offset + 8).toString("ascii"));
    offset += png.readUInt32BE(offset) + 12;
    assert.ok(offset <= png.length);
  }
  assert.deepEqual([...chunks], ["IHDR", "IDAT", "IEND"]);
  assert.match(template, /gallery_image\('da-mi-kim-within-structures\.png', 1536, 1536,/);
  assert.match(template, /\}\}#da-mi-kim-within-structures/);
  const credits = read("docs/reference/image-credits.md").split("## Da-Mi Kim: within structures\n")[1].split("\n## ")[0];
  assert.match(credits, /30_14_jpg.rf.4e63e8ab51c4cd6a6706e81ce6ebcac0.jpg/);
  assert.match(credits, /x = 128, y = 256/);
  assert.match(credits, /without cell classifications/);
  assert.match(credits, /cell model ran separately on a crop around each detected tubule/);
  assert.match(credits, /those at the image edge/);
  assert.match(credits, /lumen model ran on the full field shown here/);
  assert.match(credits, /Both overlays are clipped to tubule outlines for display/);
  assert.match(credits, /predictions\s+are unchanged/);
  assert.match(credits, /exported from QuPath with filled nucleus masks and outlines/);
  assert.match(credits, /Red \(`#E53935`\)/);
  assert.match(credits, /Green \(`#167A45`\)/);
  assert.match(credits, /lumen overlays are hidden in the central tubule and the\s+tubule cut off at the top-center/);
  assert.match(credits, /main lumen overlay in the top-right corner\s+tubule is retained/);
  assert.match(credits, /small fragment beside it is hidden/);
  assert.match(credits, /unreleased research models trained on H&E/);
  assert.match(credits, /not independently measured accuracy/);
  assert.match(credits, /does not imply\s+that the models are available to download/);
});

test("real gallery captures open at their original resolution with keyboard access", () => {
  assert.match(template, /macro gallery_image\(filename, width, height, description\)/);
  assert.match(template, /pathto\('_static\/images\/gallery\/' ~ filename, 1\)/);
  assert.match(template, /<a class="capture-image" href="\{\{ image_url \}\}" aria-label="Open full-size image: \{\{ description \}\}">/);
  assert.match(template, /width="\{\{ width \}\}" height="\{\{ height \}\}" alt="\{\{ description \}\}"/);
  assert.match(read("_static/css/landing.css"), /\.capture-image:focus-visible \{ outline-offset: -4px; \}/);
});

test("interface captures retain full frames without embedded metadata", () => {
  const images = [
    ["histoforge-modules.png", 2282, 1928, "6fbf8a9260623487e81cac091e793dea24083f169f8f71a0aee5a121b5eaa3c4"],
    ["histoforge-training.png", 2282, 1928, "ace33c2583d7e7e6e2b4fb98f87dbf429b894b4cd1c812870b472c48c429010e"],
    ["histoforge-metrics.png", 1714, 1724, "7269b246ed090b66b2d5ddd251e0ddfd403ad8d88d25e60a69814518aef6ffc1"],
  ];
  for (const [filename, width, height, digest] of images) {
    const bytes = readFileSync(new URL(`../_static/images/gallery/${filename}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), digest);
    const chunks = new Set();
    for (let offset = 8; offset < bytes.length;) {
      chunks.add(bytes.subarray(offset + 4, offset + 8).toString("ascii"));
      offset += bytes.readUInt32BE(offset) + 12;
      assert.ok(offset <= bytes.length);
    }
    assert.deepEqual([...chunks], ["IHDR", "IDAT", "IEND"]);
    assert.ok(template.includes(`gallery_image('${filename}', ${width}, ${height},`));
  }
  assert.match(template, /\}\}#module-library/);
  assert.match(template, /\}\}#training-interface/);
  const credits = read("docs/reference/image-credits.md");
  assert.match(credits, /Modules-tab image shows installed modules/);
  assert.match(credits, /not a model-performance result/);
  assert.match(credits, /No training regions or data split have been prepared/);
  assert.match(credits, /does not show a training run or results/);
});

test("gallery images have no decorative frame border or shadow", () => {
  const css = read("_static/css/landing.css");
  const frame = css.match(/\.capture-frame \{([^}]+)\}/)[1];
  assert.doesNotMatch(frame, /(?:^|;)\s*(?:border(?:-width|-style|-color)?|outline|box-shadow)\s*:/);
  assert.doesNotMatch(frame, /border-radius|background/);
  assert.match(css, /\.capture-image:focus-visible/);
});

test("workflows use a static square diagram with the shared cross-section dependency", () => {
  const diagram = read("_templates/workflow-diagram.html");
  assert.match(diagram, /viewBox="0 0 1024 1024"/);
  assert.match(diagram, /role="img" aria-labelledby="recipe-diagram-title recipe-diagram-description"/);
  assert.match(diagram, /Leydig nuclei/);
  assert.match(diagram, /Lumens/);
  assert.match(diagram, /Spermatogenesis uses the same tubule preparation/);
  assert.match(diagram, /Reuses the selected/);
  assert.match(diagram, /Models not yet released/);
  assert.doesNotMatch(diagram, /<animate|<script|<foreignObject/);
  assert.match(template, /feature.id == 'workflows' %\}\s*\{% include 'workflow-diagram.html' %\}/);
});

test("gallery uses the page width without a topic list or reserved navigation column", () => {
  const css = read("_static/css/landing.css");
  assert.match(css, /\.workflow \{[^}]*max-width: none;/);
  assert.doesNotMatch(css, /workflow-nav|workflow-column-gap|workflow-step/);
  assert.doesNotMatch(template, /workflow-nav|workflow-step|step-number/);
  assert.match(css, /\.capture-heading \{[^}]*justify-content: center;[^}]*text-align: center;/);
  assert.match(css, /\.capture-credit \{[^}]*text-align: center;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.workflow \{ max-width: none; margin-top: 32px; \}/);
});

test("nine capabilities share one ordered source for titled screenshot panels", () => {
  assert.deepEqual(features.map((feature) => feature.title), [
    "Segment and classify cells",
    "Segment and classify tissue structures",
    "Segment and classify tissue regions",
    "Run models within detected structures",
    "Whole slide inference",
    "Calculate metrics",
    "Train and fine-tune models",
    "Create module workflows",
    "Download community modules and share your own",
  ]);
  assert.equal(new Set(features.map((feature) => feature.id)).size, 9);
  assert.equal([...template.matchAll(/for feature in features/g)].length, 1);
  assert.match(template, /id="view-\{\{ feature.id \}\}" aria-labelledby="title-\{\{ feature.id \}\}"/);
  assert.match(template, /<h3 id="title-\{\{ feature.id \}\}">\{\{ feature.title \}\}<\/h3>/);
  assert.doesNotMatch(template, /class="workflow-panel"[^>]*hidden/);
  assert.doesNotMatch(features.map((feature) => feature.title).join(" "), /tubule|germ.cell|Testicular/i);
  assert.doesNotMatch(template, /scale-controls|data-workflow-tab/);
});

test("landing uses the site root, links the guides and isolates review assets", () => {
  assert.match(read("conf.py"), /master_doc = "docs\/index"/);
  assert.match(read("conf.py"), /"index": "landing.html"/);
  assert.match(read("conf.py"), /"home\/index": "home-redirect.html"/);
  assert.match(template, /pathto\('docs\/index'\)/);
  assert.match(read("_templates/home-redirect.html"), /location.search \+ location.hash/);
  assert.equal([...template.matchAll(/pathto\('index'\)/g)].length, 1);
  assert.doesNotMatch(template, /css\/custom.css|theme.css/);
  const review = template.match(/\{% if review_enabled %\}([\s\S]*?)\{% endif %\}/)?.[1];
  assert.ok(review?.includes("review.css"));
  assert.ok(review?.includes("review.js"));
  assert.doesNotMatch(template.replace(review, ""), /review\.css|review\.js/);
});

test("landing uses labelled placeholders and only known public destinations", () => {
  assert.match(template, /Screenshot placeholder/);
  assert.deepEqual([...template.matchAll(/href="(https:[^"]+)"/g)].map((match) => match[1]), [
    "https://forum.image.sc/", "https://github.com/histoforge", "https://huggingface.co/models?other=histoforge",
    "https://huggingface.co/histoforge", "https://huggingface.co/models?other=histoforge",
  ]);
  assert.doesNotMatch(template, /https:[^"]+\.(png|jpe?g|webp)/);
});

test("landing and module guides link to the same cross-account library", () => {
  const destination = template.match(/href="([^"]+)"[^>]*aria-label="HistoForge modules library on Hugging Face"/)[1];
  const url = new URL(destination);
  assert.equal(url.origin, "https://huggingface.co");
  assert.equal(url.pathname, "/models");
  assert.deepEqual([...url.searchParams], [["other", "histoforge"]]);
  const discovery = template.match(/<p class="modules-discovery">([\s\S]*?)<\/p>/)[0];
  assert.ok(discovery.includes(`href="${destination}"`));
  assert.match(discovery, /For other modules, browse the\s*<a[^>]+>histoforge tag on Hugging Face<\/a>\./);
  assert.ok(template.indexOf('id="modules-heading"') < template.indexOf(discovery));
  assert.ok(template.indexOf(discovery) < template.indexOf('id="module-list"'));
  for (const guide of ["docs/using-histoforge/modules.md", "docs/training/publish.md"]) {
    assert.ok(read(guide).includes(`](${destination})`), `${guide} must link to the community library`);
  }
});

test("landing citation links to a navigable documentation page", () => {
  const footer = template.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /To reference HistoForge in scientific publications/);
  assert.match(footer, /href="\{\{ pathto\('docs\/reference\/citing'\) \}\}">How to cite HistoForge<\/a>/);
  const referenceTree = read("docs/reference/index.md").match(/```\{toctree\}\n([\s\S]*?)```/)[1];
  assert.match(referenceTree, /^citing$/m);
  const citation = read("docs/reference/citing.md");
  assert.match(citation, /^# How to cite HistoForge\n/);
  assert.match(citation, /https:\/\/qupath\.readthedocs\.io\/en\/stable\/docs\/intro\/citing\.html/);
  assert.match(citation, /## Models and modules/);
});

test("citation and intended use stay adjacent after the gallery in normal page flow", () => {
  assert.equal([...template.matchAll(/class="intended-use"/g)].length, 1);
  const footer = template.match(/<footer[\s\S]*?<\/footer>/)[0];
  const intendedUse = "HistoForge is not intended for clinical, diagnostic or therapeutic purposes.";
  assert.equal(footer.match(/<p class="intended-use">([^<]+)<\/p>/)[1], intendedUse);
  assert.ok(read("docs/index.md").includes(intendedUse));
  assert.match(footer, /How to cite HistoForge<\/a>\.<\/p>\s*<p class="intended-use">/);
  assert.doesNotMatch(footer, /site-navigation/);
  assert.ok(template.indexOf("</main>") < template.indexOf('<footer class="site-footer">'));
  const css = read("_static/css/landing.css");
  assert.doesNotMatch(css, /\.site-footer \{[^}]*position:\s*(?:sticky|fixed)/);
  assert.match(css, /\.site-footer p \+ p \{ margin-top: 4px; \}/);
  assert.match(css, /@media print[\s\S]*\.site-footer \{ padding: 12px 0;/);
  assert.doesNotMatch(css, /\.intended-use \{[^}]*position:/);
});

test("gallery fit depends on the viewport, not the normal-flow footer", () => {
  const page = setup({viewport: 800, stageHeight: 760});
  assert.equal(page.classes.has("is-carousel"), true);
  page.selectWithKeyboard(5);
  page.assertVisible(5);
  page.stage.offsetHeight = 780;
  page.document.dispatchEvent(new Event("hf-landing-layout"));
  assert.equal(page.classes.has("is-compact-gallery"), true);
  page.assertVisible(5);
  page.stage.offsetHeight = 760;
  page.document.dispatchEvent(new Event("hf-landing-layout"));
  assert.equal(page.classes.has("is-carousel"), true);
  page.selectWithKeyboard(6);
  page.assertVisible(6);
});

test("direct selection reaches every panel without moving the page", () => {
  const page = setup();
  page.assertVisible(0);
  features.forEach((_, index) => {
    assert.equal(page.selectWithKeyboard(index).defaultPrevented, true);
    page.assertVisible(index);
    assert.equal(page.window.scrollY, 0);
    assert.equal(page.reveals(), 0);
  });
});

test("neighbor selection follows the visible image, restores focus and stops autoplay", () => {
  const page = setup();
  page.document.activeElement = page.neighborButtons[1];
  page.neighborButtons[1].dispatchEvent(new Event("click"));
  page.flush();
  page.assertVisible(1);
  assert.equal(page.location.hash, "#view-structures");
  assert.equal(page.document.activeElement, page.panels[1]);
  page.advance(20000);
  page.assertVisible(1);
  assert.ok(setup({width: 390}).neighborButtons.every((button) => button.inert));
});

test("both neighbors wrap correctly and remain selectable after direct topic jumps", () => {
  const page = setup();
  for (const index of [0, 7, 4, 0, 3, 6, 2]) {
    page.selectWithKeyboard(index);
    const previous = (index + features.length - 1) % features.length;
    const next = (index + 1) % features.length;
    assert.equal(page.panels[index].style["--gallery-offset"], 0);
    assert.equal(page.panels[previous].style["--gallery-offset"], -1);
    assert.equal(page.panels[next].style["--gallery-offset"], 1);
    assert.equal(page.neighborButtons[0].getAttribute("aria-controls"), page.panels[previous].id);
    assert.equal(page.neighborButtons[1].getAttribute("aria-controls"), page.panels[next].id);
  }
  page.selectWithKeyboard(0);
  page.neighborButtons[0].dispatchEvent(new Event("click"));
  page.flush();
  page.assertVisible(features.length - 1);
  page.neighborButtons[1].dispatchEvent(new Event("click"));
  page.flush();
  page.assertVisible(0);
});

test("the final feature is reachable without extending the document", () => {
  const page = setup();
  const last = features.length - 1;
  const pageHeight = page.document.documentElement.scrollHeight;
  page.pressKey("End");
  page.assertVisible(last);
  page.selectWithKeyboard(0);
  page.assertVisible(0);
  page.selectWithKeyboard(last);
  page.assertVisible(last);
  assert.equal(page.document.documentElement.scrollHeight, pageHeight);
  assert.equal(pageHeight, 300 + page.stage.offsetHeight + 150);
  page.window.scrollTo({top: 200});
  page.flush();
  page.assertVisible(last);
});

test("initial fragments and hash changes select the correct screenshot", () => {
  const page = setup({hash: "#view-workflows"});
  page.assertVisible(7);
  page.location.hash = "#view-cells";
  page.window.dispatchEvent(new Event("hashchange"));
  page.flush();
  page.assertVisible(0);
  page.location.hash = "#view-structures";
  page.window.dispatchEvent(new Event("hashchange"));
  page.flush();
  page.assertVisible(1);
  page.location.hash = "#view-regions";
  page.window.dispatchEvent(new Event("hashchange"));
  page.flush();
  page.assertVisible(2);
  page.location.hash = "#main";
  page.window.dispatchEvent(new Event("hashchange"));
  page.assertVisible(2);
});

test("short viewports keep the selected image with compact navigation", () => {
  const page = setup({viewport: 550, stageHeight: 650});
  page.assertVisible(0);
  assert.equal(page.classes.has("is-compact-gallery"), true);
  assert.equal(page.galleryViewport.style.height, undefined);
  assert.equal(page.galleryViewport.getAttribute("tabindex"), "0");
  assert.equal(page.selectWithKeyboard(4).defaultPrevented, true);
  page.window.innerHeight = 900;
  page.window.dispatchEvent(new Event("resize"));
  assert.equal(page.classes.has("is-compact-gallery"), false);
  page.assertVisible(4);
  page.window.innerHeight = 550;
  page.window.dispatchEvent(new Event("resize"));
  assert.equal(page.classes.has("is-compact-gallery"), true);
  page.assertVisible(4);
});

test("narrow screens show one image with keyboard navigation", () => {
  const page = setup({width: 390, viewport: 900});
  page.assertVisible(0);
  assert.equal(page.selectWithKeyboard(6).defaultPrevented, true);
  page.assertVisible(6);
});

test("cached history restoration preserves the selected image rather than a stale fragment", () => {
  const page = setup();
  page.selectWithKeyboard(2);
  page.location.hash = "#view-community";
  const event = new Event("pageshow");
  Object.assign(event, {persisted: true});
  page.window.dispatchEvent(event);
  page.flush();
  page.assertVisible(2);
  assert.equal(page.location.hash, "#view-community");
});

test("initial native fragment positioning preserves the selected image", () => {
  const page = setup({hash: "#view-community"});
  page.window.dispatchEvent(new Event("pageshow"));
  page.flush();
  page.assertVisible(features.length - 1);
});

test("modified arrow keys retain browser behavior", () => {
  const page = setup();
  for (const options of [{metaKey: true}, {ctrlKey: true}, {shiftKey: true}, {altKey: true}]) {
    assert.equal(page.pressKey("ArrowRight", options).defaultPrevented, false);
    page.assertVisible(0);
  }
});

test("comment reveal positions the corresponding panel without a second scroll", () => {
  const page = setup();
  for (const target of [page.panels[3], page.panels[5]]) {
    const event = new Event("hf-review-reveal", {cancelable: true});
    Object.defineProperty(event, "target", {value: target});
    page.workflow.dispatchEvent(event);
    page.flush();
    assert.equal(event.defaultPrevented, true);
    page.assertVisible(target === page.panels[3] ? 3 : 5);
  }
  assert.equal(page.reveals(), 2);
  assert.match(read("_review/review.js"), /"hf-review-reveal", \{bubbles: true, cancelable: true\}/);
  assert.match(read("_review/review.js"), /if \(defaultScroll\) target.scrollIntoView/);
});

test("no scroll interception; reduced motion and print retain accessible content", () => {
  assert.doesNotMatch(script, /setInterval/);
  assert.doesNotMatch(script, /addEventListener\("(?:wheel|touchmove|scroll)"/);
  assert.doesNotMatch(script, /scrollTop|scrollRange|followScroll/);
  const css = read("_static/css/landing.css");
  const scrollers = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , declarations]) => /overflow-y:\s*(auto|scroll)/.test(declarations))
    .map(([, selector]) => selector.trim());
  assert.deepEqual(scrollers, []);
  assert.doesNotMatch(css, /position: sticky|workflow-track/);
  assert.doesNotMatch(css, /scroll-snap/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media print[\s\S]*opacity: 1 !important; transform: none !important/);
});

test("transitions retain outgoing pixels while exposing only the current panel to interaction", () => {
  const page = setup();
  for (const index of [2, 6, 3, 0]) {
    page.selectWithKeyboard(index);
    page.assertVisible(index);
    assert.ok(page.panels.every((panel) => !panel.hidden));
  }
  assert.equal(page.classes.has("is-measuring"), false);
  assert.doesNotMatch(script, /panel\.hidden\s*=/);
});

test("gallery stays in normal page flow and community links remain outside the footer", () => {
  assert.doesNotMatch(template, /landing-stage|landing-scroll/);
  assert.doesNotMatch(template, /workflow-hint|Scroll here to explore/);
  assert.match(template, /class="workflow-viewport" role="region" aria-labelledby="workflow-heading"/);
  const footer = template.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.doesNotMatch(footer, /site-navigation/);
  assert.match(footer, /How to cite HistoForge/);
  const page = setup();
  for (const index of [0, 3, 6]) {
    page.selectWithKeyboard(index);
    page.assertVisible(index);
    assert.equal(page.galleryViewport.style.height, undefined);
    assert.equal(page.galleryViewport.getAttribute("tabindex"), "0");
  }
  const css = read("_static/css/landing.css");
  assert.doesNotMatch(template, /workflow-track|workflow-scroll/);
  assert.doesNotMatch(css, /\.workflow-viewport \{[^}]*overflow/);
  assert.doesNotMatch(css, /scrollbar-gutter|padding-inline-end/);
  assert.doesNotMatch(css, /\.site-navigation \{[^}]*position:/);
  assert.doesNotMatch(css, /border-top/);
});

test("header groups all four destinations in one labelled navigation", () => {
  const header = template.match(/<header[\s\S]*?<\/header>/)[0];
  assert.equal([...template.matchAll(/class="site-navigation"/g)].length, 1);
  assert.doesNotMatch(header, /<small>/);
  const navigation = header.match(/<nav class="site-navigation"[^>]*>([\s\S]*?)<\/nav>/)[0];
  assert.match(navigation, /aria-label="Main navigation"/);
  assert.deepEqual([...navigation.matchAll(/<span>([^<]+)<\/span>/g)].map((match) => match[1]), [
    "Discuss", "Contribute", "Modules library", "Documentation",
  ]);
  const positions = ["wordmark", "site-navigation", "documentation-link"]
    .map((name) => header.indexOf(`class="${name}"`));
  assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
  assert.deepEqual([...header.matchAll(/href="(https:[^"]+)"/g)].map((match) => match[1]), [
    "https://forum.image.sc/", "https://github.com/histoforge", "https://huggingface.co/models?other=histoforge",
  ]);
  assert.match(header, /aria-label="HistoForge modules library on Hugging Face">\s*<img[^>]+>\s*<span>Modules library<\/span>/);
  const css = read("_static/css/landing.css");
  assert.match(css, /\.site-navigation \{[^}]*justify-content: flex-end;[^}]*margin-left: auto;/);
  for (const link of navigation.matchAll(/<a ([^>]+)>/g)) {
    assert.match(link[1], /aria-label="[^"]+"/);
    assert.match(link[1], /title="[^"]+"/);
  }
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.site-navigation a span \{ display: none; \}/);
});

test("header navigation shares the selected font, size and weight at every breakpoint", () => {
  const css = read("_static/css/landing.css");
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector, declarations]) =>
      /\.site-navigation a/.test(selector.trim()) &&
      /(?:^|;)\s*(?:font(?:-[\w-]+)?|line-height|letter-spacing)\s*:/.test(declarations));
  assert.equal(rules.length, 1);
  assert.match(rules[0][1], /\.site-navigation a/);
  assert.match(rules[0][2], /font: 500 var\(--text-small\)\/1\.5 var\(--font\)/);
});

test("centered landing content follows the reviewed order and keeps the platform in QuPath", () => {
  const sections = ["introduction", "introduction-copy", "release-download", "contact", "workflow", "module-catalog", "site-footer", "intended-use"];
  const positions = sections.map((name) => template.indexOf(`class="${name}"`));
  assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
  assert.doesNotMatch(template, /eyebrow|A QuPath extension for histopathology research/);
  assert.match(template, /AI for histology, <span>in QuPath\.<\/span>/);
  const introduction = template.match(/<section class="introduction"[\s\S]*?<\/section>/)[0];
  const copy = introduction.match(/<p class="introduction-copy">([\s\S]*?)<\/p>/)[1]
    .replace(/\s+/g, " ").trim();
  assert.equal(copy, "An open-source platform for histology image analysis. " +
    "Use community models to identify cells and tissue structures, get measurements, and train and share models using your own annotations. " +
    "Analysis and training run in your cloud account.");
  assert.equal(template.match(/<meta name="description" content="([^"]+)">/)[1], copy);
  assert.doesNotMatch(template, /data stays in your own cloud/i);
  assert.doesNotMatch(template, /workflow-playback|Pause automatic gallery advancement/);
  assert.ok(introduction.indexOf("</h1>") < introduction.indexOf('<p class="introduction-copy">'));
  const css = read("_static/css/landing.css");
  assert.match(css, /\.introduction \{ padding-block: 56px 24px; text-align: center/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.introduction \{ padding-block: 40px 24px;/);
  assert.match(css, /\.introduction-copy \{[^}]*max-width: 640px;[^}]*margin: 24px auto 0;/);
  assert.match(css, /\.contact \{[^}]*margin: 48px auto 0; text-align: center;/);
  assert.match(css, /\.site-footer \{[^}]*text-align: center/);
  assert.match(read("_static/images/huggingface.svg"), /#FFD21E/);
});

test("gallery is keyboard navigable without a topic list", () => {
  const page = setup({reduced: true});
  assert.ok(page.neighborButtons.every((button) => button.tabIndex === 0 && !button.inert));
  assert.equal(page.galleryViewport.getAttribute("aria-keyshortcuts"), "ArrowLeft ArrowRight Home End");
  const last = features.length - 1;
  for (const [key, index] of [["ArrowRight", 1], ["ArrowLeft", 0], ["ArrowLeft", last], ["Home", 0], ["End", last]]) {
    assert.equal(page.pressKey(key).defaultPrevented, true);
    page.assertVisible(index);
    assert.equal(page.location.hash, `#${page.panels[index].id}`);
    assert.equal(page.window.scrollY, 0);
  }
  page.document.activeElement = page.panels[last];
  page.pressKey("Home");
  assert.equal(page.document.activeElement, page.panels[0]);
  assert.equal(page.timers.size, 0);
  assert.equal(setup({width: 390}).galleryViewport.getAttribute("aria-keyshortcuts"), "ArrowLeft ArrowRight Home End");
});

test("download has no invented public destination or placeholder link", () => {
  const config = read("conf.py");
  assert.match(config, /"landing_download_url":/);
  assert.match(template, /\{% if landing_download_url or review_enabled %\}/);
  assert.match(template, /\{% if landing_download_url %\}\s*<a class="download-link" href="\{\{ landing_download_url \| e \}\}"/);
  assert.match(template, /<button class="download-link"[^>]*disabled aria-describedby="download-pending"/);
  assert.doesNotMatch(template, /href="#"|Coming soon|Version 1\.0/i);
});

test("news is removed from public and review layouts", () => {
  assert.doesNotMatch(template, /landing_news|news-heading|news-placeholder|class="news"/);
  assert.doesNotMatch(read("_static/css/landing.css"), /\.news/);
  assert.doesNotMatch(read("conf.py"), /landing_news/);
});

test("typeface comparison stays in the local review build, outside comment content", () => {
  const review = template.match(/\{% if review_enabled %\}([\s\S]*?)\{% endif %\}/)[1];
  assert.match(review, /landing-design\.css/);
  assert.match(review, /landing-design\.js/);
  assert.doesNotMatch(template.replace(review, ""), /landing-design/);
  const chooser = read("_review/landing-design.js");
  const ids = [...chooser.matchAll(/\{id: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 27);
  assert.equal(new Set(ids).size, 27);
  assert.match(chooser, /document\.body\.append\(control\)/);
  assert.match(chooser, /revision !== request/);
  assert.match(chooser, /document\.fonts\.load/);
  assert.doesNotMatch(chooser, /localStorage|sessionStorage/);
  const families = new Set([...chooser.matchAll(/(?:body|heading): "([^"]+)"/g)].map((match) => match[1]));
  const declared = new Set();
  for (const [cssPath, fontDir] of [
    ["_static/css/landing.css", "_static/fonts"],
    ["_review/landing-design.css", "_review/fonts"],
  ]) {
    const css = read(cssPath);
    assert.doesNotMatch(css, /https?:/);
    const sources = read(`${fontDir}/SOURCES.md`);
    for (const [, filename] of css.matchAll(/url\("(?:\.\.\/)?fonts\/([^"]+\.woff2)"\)/g)) {
      const bytes = readFileSync(new URL(`../${fontDir}/${filename}`, import.meta.url));
      assert.equal(bytes.subarray(0, 4).toString(), "wOF2");
      assert.ok(sources.includes(`\`${filename}\``), `Source missing for ${filename}`);
    }
    for (const [, family] of css.matchAll(/font-family: "([^"]+)"/g)) {
      declared.add(family);
      const slug = family.toLowerCase().replaceAll(" ", "");
      assert.match(read(`${fontDir}/${slug}-OFL.txt`), /SIL OPEN FONT LICENSE\s+Version 1\.1/i);
    }
  }
  assert.equal(families.size, 26);
  assert.deepEqual(declared, families);
});

test("all five serif previews retain Source Sans 3 body text", () => {
  const chooser = read("_review/landing-design.js");
  const pairs = [...chooser.matchAll(/body: "([^"]+)", heading: "([^"]+)"/g)];
  assert.deepEqual(pairs.map((match) => match[2]), [
    "Source Serif 4", "Newsreader", "Literata", "Noto Serif", "IBM Plex Serif",
  ]);
  assert.ok(pairs.every((match) => match[1] === "Source Sans 3"));
});

test("typeface layout refresh remeasures the gallery and keeps the active view", () => {
  const page = setup();
  page.selectWithKeyboard(3);
  page.stage.offsetHeight = 650;
  page.document.dispatchEvent(new Event("hf-landing-layout"));
  page.assertVisible(3);
  page.stage.offsetHeight = 800;
  page.document.dispatchEvent(new Event("hf-landing-layout"));
  page.assertVisible(3);
  assert.equal(page.classes.has("is-compact-gallery"), true);
});
