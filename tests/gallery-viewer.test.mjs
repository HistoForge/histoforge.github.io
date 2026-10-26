import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {setup as landing} from "./fixtures/landing-page.mjs";

const script = readFileSync(new URL("../_static/gallery-viewer.js", import.meta.url), "utf8");
function setup() {
  const viewer = new EventTarget();
  viewer.style = {setProperty() {}};
  const image = new EventTarget();
  image.removeAttribute = () => { delete image.src; };
  const title = {}, error = {}, button = new EventTarget(), link = new EventTarget();
  const classes = new Set();
  const document = {
    querySelector: () => viewer,
    querySelectorAll: () => [link],
    documentElement: {classList: {add: (name) => classes.add(name), remove: (name) => classes.delete(name)}},
  };
  viewer.querySelector = (selector) => ({".gallery-viewer-image": image, h2: title, ".gallery-viewer-error": error, button})[selector];
  viewer.showModal = () => { viewer.open = true; };
  viewer.close = () => { viewer.open = false; viewer.dispatchEvent(new Event("close")); };
  link.querySelector = () => ({currentSrc: "http://localhost/image.png?v=123", alt: "Real tissue overlay"});
  link.closest = () => ({querySelector: () => ({textContent: "Segment cells"})});
  link.focus = (options) => { link.focusOptions = options; };
  let opened = 0;
  link.addEventListener("hf-gallery-open", () => { opened++; });
  runInNewContext(script, {document, Event});
  function click(options = {}) {
    const event = new Event("click", {cancelable: true});
    Object.assign(event, {button: 0}, options);
    link.dispatchEvent(event);
    return event;
  }
  return {viewer, image, title, error, button, link, classes, click, opened: () => opened};
}

test("normal activation opens the actual image in a modal without navigating", () => {
  const page = setup();
  assert.equal(page.click().defaultPrevented, true);
  assert.equal(page.viewer.open, true);
  assert.equal(page.title.textContent, "Segment cells");
  assert.equal(page.image.src, "http://localhost/image.png?v=123");
  assert.equal(page.image.alt, "Real tissue overlay");
  assert.equal(page.opened(), 1);
  assert.equal(page.classes.has("gallery-viewer-open"), true);
});

test("Close and native Escape close restore focus without scrolling", () => {
  const page = setup();
  for (const close of [() => page.button.dispatchEvent(new Event("click")), () => page.viewer.close()]) {
    page.click();
    close();
    assert.equal(page.viewer.open, false);
    assert.equal(page.classes.size, 0);
    assert.equal(page.link.focusOptions.preventScroll, true);
    assert.equal(page.image.src, undefined);
  }
});

test("backdrop clicks dismiss, but image clicks and drags out of the content do not", () => {
  const page = setup();
  page.click();
  page.viewer.dispatchEvent(new Event("click"));
  assert.equal(page.viewer.open, true);
  page.viewer.dispatchEvent(new Event("pointerdown"));
  const contentClick = new Event("click");
  Object.defineProperty(contentClick, "target", {value: page.image});
  page.viewer.dispatchEvent(contentClick);
  assert.equal(page.viewer.open, true);
  page.viewer.dispatchEvent(new Event("click"));
  assert.equal(page.viewer.open, true);
  page.viewer.dispatchEvent(new Event("pointerdown"));
  page.viewer.dispatchEvent(new Event("click"));
  assert.equal(page.viewer.open, false);
});

test("modified clicks and unsupported dialogs preserve browser link behavior", () => {
  const page = setup();
  for (const options of [{ctrlKey: true}, {metaKey: true}, {shiftKey: true}, {altKey: true}, {button: 1}]) {
    assert.equal(page.click(options).defaultPrevented, false);
  }
  page.viewer.showModal = undefined;
  assert.equal(page.click().defaultPrevented, false);
  assert.equal(page.opened(), 0);
});

test("failed images leave a closable viewer and can be reopened", () => {
  const page = setup();
  page.click();
  page.image.dispatchEvent(new Event("error"));
  assert.equal(page.error.hidden, false);
  assert.equal(page.image.hidden, true);
  page.viewer.close();
  page.click();
  assert.equal(page.error.hidden, true);
  assert.equal(page.image.hidden, false);
});

test("opening an image stops gallery autoplay until reload", () => {
  const page = landing();
  page.workflow.dispatchEvent(new Event("hf-gallery-open"));
  page.advance(20000);
  page.assertVisible(0);
});
