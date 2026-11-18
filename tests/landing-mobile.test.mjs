import test from "node:test";
import assert from "node:assert/strict";
import {setup} from "./fixtures/landing-page.mjs";

function pointer(page, type, x, y, options = {}) {
  const event = Object.assign(new Event(type, {cancelable: true}), {
    pointerType: "touch", isPrimary: true, pointerId: 1, clientX: x, clientY: y,
  }, options);
  page.views.dispatchEvent(event);
  page.flush();
  return event;
}

function swipe(page, dx, dy = 0, options) {
  const start = pointer(page, "pointerdown", 200, 200, options);
  const end = pointer(page, "pointerup", 200 + dx, 200 + dy, options);
  assert.equal(start.defaultPrevented, false);
  assert.equal(end.defaultPrevented, false);
}

test("mobile arrows and counter cover every image and stop at both ends", () => {
  const page = setup({width: 390});
  assert.equal(page.navigation.hidden, false);
  assert.equal(page.counter.textContent, "1 / 9");
  assert.equal(page.navigationButtons[0].disabled, true);
  assert.equal(page.navigationButtons[1].disabled, false);
  page.pressKey("ArrowLeft");
  page.assertVisible(0);
  for (let index = 1; index < page.panels.length; index++) {
    page.navigationButtons[1].dispatchEvent(new Event("click"));
    page.assertVisible(index);
    assert.equal(page.counter.textContent, `${index + 1} / 9`);
    assert.equal(page.location.hash, `#${page.panels[index].id}`);
  }
  assert.equal(page.navigationButtons[1].disabled, true);
  assert.equal(page.navigationButtons[0].disabled, false);
  page.pressKey("ArrowRight");
  page.assertVisible(8);
  page.navigationButtons[0].dispatchEvent(new Event("click"));
  page.assertVisible(7);
  assert.equal(page.window.scrollY, 0);
  assert.equal(page.timers.size, 0);
});

test("horizontal touch swipes select one image without opening its viewer", () => {
  const page = setup({width: 390});
  swipe(page, -100, 10);
  page.assertVisible(1);
  const click = Object.assign(new Event("click", {cancelable: true}), {detail: 1});
  page.views.dispatchEvent(click);
  assert.equal(click.defaultPrevented, true);
  swipe(page, 100, -10);
  page.assertVisible(0);
  swipe(page, 100);
  page.assertVisible(0);
  page.pressKey("End");
  swipe(page, -100);
  page.assertVisible(8);
});

test("vertical gestures, taps, mouse drags and cancelled touches do not change images", () => {
  const page = setup({width: 390});
  for (const [dx, dy] of [[10, 100], [100, 100], [0, -100], [25, 0], [0, 0]]) {
    swipe(page, dx, dy);
    page.assertVisible(0);
    const click = Object.assign(new Event("click", {cancelable: true}), {detail: 1});
    page.views.dispatchEvent(click);
    assert.equal(click.defaultPrevented, false);
  }
  swipe(page, -100, 0, {pointerType: "mouse"});
  page.assertVisible(0);
  pointer(page, "pointerdown", 200, 200);
  pointer(page, "pointercancel", 150, 210);
  pointer(page, "pointerup", 100, 210);
  page.assertVisible(0);
});

test("pinch gestures and orientation changes discard an unfinished swipe", () => {
  const page = setup({width: 390});
  pointer(page, "pointerdown", 200, 200);
  pointer(page, "pointerdown", 240, 200, {pointerId: 2, isPrimary: false});
  pointer(page, "pointerup", 100, 200);
  page.assertVisible(0);
  pointer(page, "pointerdown", 200, 200);
  page.window.dispatchEvent(new Event("resize"));
  pointer(page, "pointerup", 100, 200);
  page.assertVisible(0);
});

test("a new tap and keyboard activation remain usable after a swipe", () => {
  const page = setup({width: 390});
  swipe(page, -100);
  const keyboardClick = Object.assign(new Event("click", {cancelable: true}), {detail: 0});
  page.views.dispatchEvent(keyboardClick);
  assert.equal(keyboardClick.defaultPrevented, false);
  swipe(page, 0);
  const tap = Object.assign(new Event("click", {cancelable: true}), {detail: 1});
  page.views.dispatchEvent(tap);
  assert.equal(tap.defaultPrevented, false);
  page.assertVisible(1);
});

test("desktop touch keeps its existing behavior and responsive changes retain selection", () => {
  const page = setup({hash: "#view-whole-slide"});
  assert.equal(page.navigation.hidden, true);
  swipe(page, -100);
  page.assertVisible(4);
  page.window.innerWidth = 390;
  page.window.dispatchEvent(new Event("resize"));
  page.assertVisible(4);
  assert.equal(page.counter.textContent, "5 / 9");
  assert.equal(page.navigation.hidden, false);
  page.advance(30000);
  page.assertVisible(4);
  swipe(page, -100);
  page.assertVisible(5);
  page.window.innerWidth = 1280;
  page.window.dispatchEvent(new Event("resize"));
  assert.equal(page.navigation.hidden, true);
  page.assertVisible(5);
  page.advance(30000);
  page.assertVisible(5);
});
