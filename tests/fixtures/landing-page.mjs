import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const template = readFileSync(new URL("../../_templates/landing.html", import.meta.url), "utf8");
const features = JSON.parse(template.match(/\{% set features = (\[[\s\S]*?\]) %\}/)[1]);
const script = readFileSync(new URL("../../_static/landing.js", import.meta.url), "utf8");

// Run the actual browser script against a small DOM geometry fixture. Layout and
// keyboard focus are verified in the browser; this covers selection and navigation.
export function setup({viewport = 800, width = 1280, stageHeight = 440, hash = "", reduced = false, visible = true, navigationType = "navigate"} = {}) {
  function element(selector) {
    const node = new EventTarget();
    const attributes = new Map();
    node.style = {
      setProperty(name, value) { this[name] = value; },
      removeProperty(name) { delete this[name]; },
    };
    node.children = [];
    node.append = (...children) => children.forEach((child) => { child.parentNode = node; node.children.push(child); });
    node.hidden = false;
    node.dataset = {};
    node.inert = false;
    node.setAttribute = (name, value) => attributes.set(name, value);
    node.getAttribute = (name) => attributes.get(name) ?? null;
    node.removeAttribute = (name) => attributes.delete(name);
    node.closest = (match) => match === selector ? node : null;
    node.contains = (other) => {
      for (let current = other; current; current = current.parentNode) {
        if (current === node) return true;
      }
      return false;
    };
    return node;
  }
  const workflow = element(".workflow");
  const galleryViewport = element(".workflow-viewport");
  const stage = element(".workflow-stage");
  const views = element(".workflow-views");
  views.getBoundingClientRect = () => ({width: 896});
  let reveals = 0;
  workflow.scrollIntoView = () => { reveals += 1; };
  stage.offsetHeight = stageHeight;
  stage.getBoundingClientRect = () => ({height: stage.offsetHeight});
  const classes = new Set();
  workflow.classList = {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
  };
  const panels = features.map((feature) => {
    const panel = element(".workflow-panel");
    panel.id = `view-${feature.id}`;
    panel.focus = () => { document.activeElement = panel; };
    const heading = Object.assign(element("h3"), {textContent: feature.title});
    heading.getBoundingClientRect = () => ({height: 62.4});
    panel.querySelector = () => heading;
    return panel;
  });
  galleryViewport.parentNode = workflow;
  stage.parentNode = galleryViewport;
  views.parentNode = stage;
  for (const panel of panels) panel.parentNode = views;
  workflow.querySelector = (selector) => ({".workflow-viewport": galleryViewport, ".workflow-stage": stage, ".workflow-views": views})[selector];
  views.querySelectorAll = () => panels;

  const window = new EventTarget();
  const motion = Object.assign(new EventTarget(), {matches: reduced});
  const printView = Object.assign(new EventTarget(), {matches: false});
  window.matchMedia = (query) => {
    if (query === "print") return printView;
    assert.equal(query, "(prefers-reduced-motion: reduce)");
    return motion;
  };
  const selection = {isCollapsed: true, anchorNode: null, focusNode: null};
  const pendingFrames = [];
  const location = {hash};
  const history = {
    scrollRestoration: "auto",
    pushState: (_, __, value) => { location.hash = value; },
  };
  window.innerHeight = viewport;
  window.innerWidth = width;
  window.scrollY = 0;
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    activeElement: null,
    getSelection: () => selection,
    createElement: (tag) => Object.assign(element(tag), {tagName: tag.toUpperCase()}),
    querySelector: (selector) => selector === ".workflow" ? workflow :
      panels.find((panel) => `#${panel.id}` === selector),
    documentElement: {
      get scrollHeight() { return 300 + stage.offsetHeight * (classes.has("is-carousel") ? 1 : features.length) + 150; },
    },
  });
  window.scrollTo = ({top}) => {
    window.scrollY = Math.max(0, top);
    window.dispatchEvent(new Event("scroll"));
  };
  let onVisibility;
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  const flush = () => { while (pendingFrames.length) pendingFrames.shift()(); };
  runInNewContext(script, {window, document, location, history,
    performance: {getEntriesByType: () => [{type: navigationType}]},
    requestAnimationFrame: (callback) => pendingFrames.push(callback),
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, {callback, at: now + delay});
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    IntersectionObserver: class {
      constructor(callback, options) {
        assert.equal(options.threshold, 0.25);
        onVisibility = callback;
      }
      observe(target) { assert.equal(target, stage); }
    },
  });
  function setVisible(ratio) {
    onVisibility([{isIntersecting: ratio > 0, intersectionRatio: ratio}]);
    flush();
  }
  function advance(milliseconds) {
    flush();
    const end = now + milliseconds;
    while (timers.size) {
      const [id, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (timer.at > end) break;
      now = timer.at;
      timers.delete(id);
      timer.callback();
      flush();
    }
    now = end;
  }
  setVisible(visible ? 1 : 0);
  const active = () => classes.has("is-carousel") ?
    panels.findIndex((panel) => panel.dataset.state === "active") : -1;
  const assertVisible = (index) => {
    assert.equal(active(), index);
    assert.deepEqual(panels.map((panel) => !panel.inert), features.map((_, i) => i === index));
    assert.deepEqual(panels.map((panel) => panel.getAttribute("aria-hidden") !== "true"), features.map((_, i) => i === index));
    assert.deepEqual(panels.map((panel) => panel.dataset.state),
      features.map((_, i) => i === index ? "active" : i < index ? "before" : "after"));
  };
  function pressKey(key, options = {}) {
    const event = new Event("keydown", {cancelable: true});
    Object.assign(event, {key}, options);
    galleryViewport.dispatchEvent(event);
    flush();
    return event;
  }
  function selectWithKeyboard(index) {
    let event = pressKey("Home");
    for (let i = 0; i < index; i++) event = pressKey("ArrowRight");
    return event;
  }
  const navigation = stage.children[0];
  return {workflow, galleryViewport, stage, views, panels, navigation, navigationButtons: [navigation.children[0], navigation.children[2]], counter: navigation.children[1], neighborButtons: views.children[0].children, motion, printView, selection, window, document, location, history, classes, flush, active, assertVisible, pressKey, selectWithKeyboard, advance, setVisible, timers, reveals: () => reveals};
}
