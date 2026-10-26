import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const script = read("_static/modules.js");
const template = read("_templates/landing.html");
const pageSize = Number(template.match(/set module_page_size = (\d+)/)[1]);

function setup(count, planned = []) {
  function element() {
    const node = new EventTarget();
    const attributes = new Map();
    node.hidden = false;
    node.disabled = false;
    node.setAttribute = (name, value) => attributes.set(name, value);
    node.removeAttribute = (name) => attributes.delete(name);
    node.getAttribute = (name) => attributes.get(name) ?? null;
    node.click = () => { if (!node.disabled) node.dispatchEvent(new Event("click")); };
    return node;
  }
  let focused = null;
  let reveals = 0;
  const cards = Array.from({length: count}, (_, index) => {
    const card = element();
    card.closest = (selector) => selector === ".module-card" ? card : null;
    card.focus = (options) => { assert.equal(options.preventScroll, true); focused = card; };
    card.querySelector = (selector) => {
      assert.equal(selector, "a");
      return planned.includes(index) ? null : {focus: card.focus};
    };
    return card;
  });
  const pages = Array.from({length: Math.ceil(count / pageSize)}, element);
  const contentPages = pages.map(element);
  const list = {classList: new Set()};
  const previous = element();
  const next = element();
  const status = element();
  const pagination = element();
  pagination.hidden = true;
  pagination.querySelectorAll = (selector) => {
    assert.equal(selector, "[data-module-page]");
    return pages;
  };
  pagination.querySelector = (selector) => ({
    "[data-page-previous]": previous,
    "[data-page-next]": next,
    '[role="status"]': status,
  })[selector];
  const catalog = element();
  catalog.dataset = {pageSize: String(pageSize)};
  catalog.querySelector = (selector) => ({
    ".module-pagination": pages.length > 1 ? pagination : null,
    ".module-list": list,
  })[selector];
  catalog.querySelectorAll = (selector) => ({
    ".module-card": cards,
    ".module-page": contentPages,
  })[selector];
  catalog.scrollIntoView = (options) => {
    assert.equal(options.block, "start");
    assert.equal(options.behavior, "instant");
    reveals += 1;
  };
  const document = {querySelector(selector) {
    assert.equal(selector, ".module-catalog");
    return count ? catalog : null;
  }};
  runInNewContext(script, {document});
  return {
    cards, pages, contentPages, list, previous, next, status, pagination, catalog,
    focused: () => focused,
    reveals: () => reveals,
    visible: () => cards.flatMap((card, index) => contentPages[Math.floor(index / pageSize)].hidden ? [] : [index]),
  };
}

test("empty and single-page catalogs need no pagination or hidden cards", () => {
  for (const count of [0, 1, pageSize]) {
    const view = setup(count);
    assert.equal(view.pagination.hidden, true);
    assert.equal(view.list.classList.has("is-paginated"), false);
    assert.equal(view.visible().length, count);
    assert.equal(view.focused(), null);
    assert.equal(view.reveals(), 0);
  }
});

test("numbered pages partition every module in source order, with no duplicates or omissions", () => {
  for (const count of [7, 10, 12, 13]) {
    const view = setup(count);
    assert.equal(view.pagination.hidden, false);
    assert.equal(view.list.classList.has("is-paginated"), true);
    assert.equal(view.pages[0].getAttribute("aria-current"), "page");
    assert.equal(view.focused(), null);
    const visited = [];
    view.pages.forEach((button, page) => {
      button.click();
      const expected = Array.from({length: Math.min(pageSize, count - page * pageSize)},
        (_, index) => page * pageSize + index);
      assert.deepEqual(view.visible(), expected);
      visited.push(...view.visible());
      assert.deepEqual(view.pages.map((item) => item.getAttribute("aria-current")),
        view.pages.map((_, index) => index === page ? "page" : null));
      assert.equal(view.previous.disabled, page === 0);
      assert.equal(view.next.disabled, page === view.pages.length - 1);
      assert.equal(view.focused(), view.cards[expected[0]]);
      assert.equal(view.status.textContent,
        `Page ${page + 1} of ${view.pages.length}. Modules ${expected[0] + 1}–${expected.at(-1) + 1} of ${count}.`);
    });
    assert.deepEqual(visited, Array.from({length: count}, (_, index) => index));
  }
});

test("Previous and Next move through pages and stop at their boundaries", () => {
  const view = setup(13);
  view.previous.click();
  assert.equal(view.reveals(), 0);
  view.next.click();
  assert.deepEqual(view.visible(), [6, 7, 8, 9, 10, 11]);
  view.next.click();
  assert.deepEqual(view.visible(), [12]);
  view.next.click();
  assert.equal(view.reveals(), 2);
  view.previous.click();
  assert.deepEqual(view.visible(), [6, 7, 8, 9, 10, 11]);
  view.previous.click();
  assert.deepEqual(view.visible(), [0, 1, 2, 3, 4, 5]);
});

test("a page starting with a planned card receives focus without needing a link", () => {
  const view = setup(13, [6, 12]);
  view.next.click();
  assert.equal(view.focused(), view.cards[6]);
  assert.deepEqual(view.visible(), [6, 7, 8, 9, 10, 11]);
  view.next.click();
  assert.equal(view.focused(), view.cards[12]);
  assert.equal(view.next.disabled, true);
});

test("review comments reveal another page without overriding review focus or scrolling", () => {
  const view = setup(13);
  const event = new Event("hf-review-reveal", {cancelable: true});
  Object.defineProperty(event, "target", {value: view.cards[12]});
  view.catalog.dispatchEvent(event);
  assert.deepEqual(view.visible(), [12]);
  assert.equal(event.defaultPrevented, false);
  assert.equal(view.focused(), null);
  assert.equal(view.reveals(), 0);
});

test("pagination gives every page equal card rows, including partial and narrow pages", () => {
  const css = read("_static/css/landing.css");
  assert.match(css, /\.module-page \{[^}]*grid-auto-rows: 1fr;/);
  assert.match(css, /\.is-paginated \.module-page \{ grid-area: 1 \/ 1; grid-template-rows: repeat\(var\(--module-rows\), 1fr\); \}/);
  const narrow = css.split("@media (max-width: 720px)")[1].split("@media")[0];
  assert.match(narrow, /\.is-paginated \.module-page \{ grid-template-rows: repeat\(var\(--module-rows-narrow\), 1fr\); \}/);
  assert.match(css, /\.module-card \{ display: flex; flex-direction: column;/);
  assert.match(css, /\.module-tags \{[^}]*margin: auto 0 0;/);
});

test("pagination reserves all pages for layout and print reveals them without controls", () => {
  assert.match(template, /_static\/modules.js[^\n]*landing_asset_version/);
  assert.match(read("conf.py"), /_landing_assets = \([\s\S]*?"_static\/modules.js"/);
  const css = read("_static/css/landing.css");
  assert.match(css, /\.is-paginated \.module-page\[hidden\] \{ display: grid !important; visibility: hidden; \}/);
  const print = css.split("@media print")[1];
  assert.match(print, /\.module-page\[hidden\] \{ display: block !important; visibility: visible; \}/);
  assert.match(print, /\.module-pagination \{ display: none; \}/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage/);
});
