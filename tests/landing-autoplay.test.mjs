import test from "node:test";
import assert from "node:assert/strict";
import {setup} from "./fixtures/landing-page.mjs";

test("autoplay waits five seconds, advances in order and wraps without moving the page or URL", () => {
  const page = setup();
  assert.equal(page.timers.size, 1);
  for (let step = 1; step <= page.panels.length + 1; step++) {
    const index = step % page.panels.length;
    const before = page.active();
    page.advance(4999);
    page.assertVisible(before);
    page.advance(1);
    page.assertVisible(index);
    assert.equal(page.timers.size, 1);
    assert.equal(page.window.scrollY, 0);
    assert.equal(page.location.hash, "");
    assert.equal(page.reveals(), 0);
  }
});

test("manual topic selection stops autoplay until a fresh page load", () => {
  const page = setup();
  page.advance(4900);
  page.selectWithKeyboard(6);
  assert.equal(page.timers.size, 0);
  page.advance(30000);
  page.assertVisible(6);
  assert.equal(page.location.hash, "#view-training");
  page.document.dispatchEvent(new Event("hf-landing-layout"));
  page.setVisible(0);
  page.setVisible(1);
  page.window.dispatchEvent(Object.assign(new Event("pageshow"), {persisted: true}));
  page.advance(30000);
  page.assertVisible(6);
  assert.equal(page.timers.size, 0);

  const freshPage = setup({hash: "#view-training"});
  freshPage.advance(5000);
  freshPage.assertVisible(7);
});

test("scrolling over the gallery neither selects an image nor resets autoplay", () => {
  for (const input of [
    () => new Event("wheel", {cancelable: true}),
    () => new Event("touchmove", {cancelable: true}),
    () => Object.assign(new Event("keydown", {cancelable: true}), {key: "PageDown"}),
    () => new Event("scroll"),
  ]) {
    const page = setup();
    page.advance(4000);
    const event = input();
    page.galleryViewport.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    page.flush();
    page.assertVisible(0);
    assert.equal(page.timers.size, 1);
    page.advance(1000);
    page.assertVisible(1);
  }
});

test("ordinary page scrolling does not stop gallery autoplay", () => {
  const page = setup();
  page.window.scrollTo({top: 200});
  page.advance(5000);
  page.assertVisible(1);
});

test("keyboard focus on gallery navigation stops autoplay", () => {
  for (const targetName of ["galleryViewport", "neighbors"]) {
    const page = setup();
    const target = targetName === "neighbors" ? page.neighborButtons[0] : page.galleryViewport;
    const event = new Event("focusin");
    Object.defineProperty(event, "target", {value: target});
    page.workflow.dispatchEvent(event);
    page.advance(30000);
    page.assertVisible(0);
    assert.equal(page.timers.size, 0);
  }
});

test("off-screen and hidden-tab time never accumulates into a skipped slide", () => {
  const page = setup({visible: false});
  page.advance(30000);
  page.assertVisible(0);
  page.setVisible(0.1);
  assert.equal(page.timers.size, 0);
  page.setVisible(0.25);
  page.advance(5000);
  page.assertVisible(1);
  page.document.hidden = true;
  page.document.dispatchEvent(new Event("visibilitychange"));
  page.advance(30000);
  page.assertVisible(1);
  page.document.hidden = false;
  page.document.dispatchEvent(new Event("visibilitychange"));
  page.advance(4999);
  page.assertVisible(1);
  page.advance(1);
  page.assertVisible(2);
  page.setVisible(0);
  page.advance(30000);
  page.assertVisible(2);
});

test("reduced motion disables autoplay without a playback control", () => {
  const page = setup({reduced: true});
  assert.equal(page.timers.size, 0);
  page.advance(30000);
  page.assertVisible(0);
  page.motion.matches = false;
  page.motion.dispatchEvent(new Event("change"));
  page.advance(30000);
  page.assertVisible(0);

  const activePage = setup();
  activePage.motion.matches = true;
  activePage.motion.dispatchEvent(new Event("change"));
  activePage.advance(30000);
  activePage.assertVisible(0);
});

test("compact galleries have no autoplay", () => {
  for (const options of [{width: 390}, {viewport: 400}]) {
    const page = setup(options);
    assert.equal(page.timers.size, 0);
    page.advance(30000);
    page.assertVisible(0);
    assert.equal(page.navigation.hidden, false);
  }
  const page = setup();
  page.window.innerWidth = 390;
  page.window.dispatchEvent(new Event("resize"));
  page.advance(30000);
  assert.equal(page.timers.size, 0);
  page.window.innerWidth = 1280;
  page.window.dispatchEvent(new Event("resize"));
  page.advance(5000);
  page.assertVisible(1);
});

test("selecting gallery text or focusing a panel pauses advancement while reading or commenting", () => {
  const page = setup();
  Object.assign(page.selection, {isCollapsed: false, anchorNode: page.panels[0], focusNode: page.panels[0]});
  page.document.dispatchEvent(new Event("selectionchange"));
  page.advance(30000);
  page.assertVisible(0);
  page.selection.isCollapsed = true;
  page.document.dispatchEvent(new Event("selectionchange"));
  page.advance(5000);
  page.assertVisible(1);
  page.document.activeElement = page.panels[1];
  page.workflow.dispatchEvent(new Event("focusin"));
  page.advance(30000);
  page.assertVisible(1);
  page.document.activeElement = null;
  page.workflow.dispatchEvent(new Event("focusout"));
  page.advance(5000);
  page.assertVisible(2);
});

test("page suspension cancels the timer and restoration starts just one new timer", () => {
  const page = setup();
  page.window.dispatchEvent(new Event("pagehide"));
  page.advance(30000);
  page.assertVisible(0);
  const event = Object.assign(new Event("pageshow"), {persisted: true});
  page.window.dispatchEvent(event);
  page.advance(4999);
  page.assertVisible(0);
  assert.equal(page.timers.size, 1);
  page.advance(1);
  page.assertVisible(1);
});

test("printing stops autoplay and leaving print starts a fresh wait", () => {
  const page = setup();
  page.printView.matches = true;
  page.printView.dispatchEvent(new Event("change"));
  page.advance(30000);
  assert.equal(page.active(), -1);
  assert.ok(page.panels.every((panel) => !panel.inert));
  assert.equal(page.navigation.hidden, true);
  page.printView.matches = false;
  page.printView.dispatchEvent(new Event("change"));
  page.advance(5000);
  page.assertVisible(1);
});
