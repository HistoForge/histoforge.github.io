import test from "node:test";
import assert from "node:assert/strict";
import {setup} from "./fixtures/landing-page.mjs";

test("refresh opens at the top with or without a gallery fragment at every layout", () => {
  for (const layout of [{}, {width: 390}, {viewport: 400}]) {
    for (const hash of ["", "#view-training"]) {
      const page = setup({...layout, hash, navigationType: "reload"});
      assert.equal(page.history.scrollRestoration, "manual");
      // A browser may have already restored its page position or followed a fragment.
      page.window.scrollTo({top: 900});
      page.window.dispatchEvent(new Event("pageshow"));
      page.flush();
      assert.equal(page.window.scrollY, 0);
      assert.equal(page.reveals(), 0);
      assert.equal(page.history.scrollRestoration, "auto");
      assert.equal(page.location.hash, hash);
      if (page.active() !== -1) page.assertVisible(hash ? 6 : 0);
    }
  }
});

test("opening a gallery link still reveals its image", () => {
  const page = setup({hash: "#view-training"});
  page.assertVisible(6);
  assert.equal(page.reveals(), 1);
  assert.equal(page.history.scrollRestoration, "auto");
  page.window.dispatchEvent(new Event("pageshow"));
  page.flush();
  page.assertVisible(6);
  assert.equal(page.reveals(), 2);
});

test("fragment navigation still works after a refresh", () => {
  const page = setup({navigationType: "reload"});
  page.window.dispatchEvent(new Event("pageshow"));
  page.flush();
  page.location.hash = "#view-metrics";
  page.window.dispatchEvent(new Event("hashchange"));
  page.flush();
  page.assertVisible(5);
  assert.equal(page.reveals(), 1);
});

test("returning to a cached page does not repeat its earlier refresh reset", () => {
  const page = setup({navigationType: "reload"});
  page.window.dispatchEvent(new Event("pageshow"));
  page.flush();
  page.selectWithKeyboard(3);
  page.window.scrollTo({top: 480});
  page.window.dispatchEvent(new Event("pagehide"));
  page.window.dispatchEvent(Object.assign(new Event("pageshow"), {persisted: true}));
  page.flush();
  assert.equal(page.window.scrollY, 480);
  page.assertVisible(3);
  assert.equal(page.history.scrollRestoration, "auto");
  assert.equal(page.reveals(), 0);
});

test("Back/Forward navigation without a cached document retains native scrolling", () => {
  const page = setup({navigationType: "back_forward"});
  page.window.scrollTo({top: 480});
  page.window.dispatchEvent(new Event("pageshow"));
  page.flush();
  assert.equal(page.window.scrollY, 480);
  assert.equal(page.history.scrollRestoration, "auto");
});
