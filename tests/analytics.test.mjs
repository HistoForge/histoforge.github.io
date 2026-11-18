import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source = readFileSync(new URL("../_static/analytics.js", import.meta.url), "utf8");
const consentKey = "histoforge-analytics-consent";
const measurementId = "G-TEST123";

function setup({choice = null, local = false, storageBlocked = false} = {}) {
  const buttons = ["denied", "granted"].map((value) => {
    const button = new EventTarget();
    button.dataset = {analyticsChoice: value};
    return button;
  });
  const settings = new EventTarget();
  settings.hidden = true;
  const download = new EventTarget();
  download.href = "https://github.com/HistoForge/histoforge-qupath-extension/releases/download/v1.0/histoforge.jar?private=value#selection";
  const notice = {
    hidden: true,
    dataset: {measurementId, origin: "https://histoforge.github.io"},
    querySelectorAll: () => buttons,
  };
  const tags = [];
  const expiredCookies = [];
  const document = {
    referrer: "https://example.com/private/path?token=private",
    head: {append: (element) => tags.push(element)},
    createElement: () => ({}),
    querySelector: () => notice,
    querySelectorAll: (selector) => selector === "[data-analytics-download]" ? [download] : [settings],
    set cookie(value) { expiredCookies.push(value); },
  };
  const localStorage = {
    getItem() {
      if (storageBlocked) throw new Error("Storage blocked");
      return choice;
    },
    setItem(key, value) {
      assert.equal(key, consentKey);
      if (storageBlocked) throw new Error("Storage blocked");
      choice = value;
    },
  };
  const window = new EventTarget();
  const location = new URL(local ? "http://127.0.0.1:8000/" :
    "https://histoforge.github.io/docs/?private=value#gallery");
  runInNewContext(source, {window, document, localStorage, location, URL});
  return {
    window, notice, settings, download, tags, expiredCookies,
    storedChoice: () => choice,
    choose: (value) => buttons[value === "granted" ? 1 : 0].dispatchEvent(new Event("click")),
  };
}

test("Google's tag stays unloaded until the visitor grants consent", () => {
  for (const choice of [null, "denied", "invalid"]) {
    const page = setup({choice});
    assert.equal(page.tags.length, 0);
    assert.equal(page.window.dataLayer, undefined);
    assert.equal(page.notice.hidden, choice === "denied");
    assert.equal(page.settings.hidden, false);
  }
});

test("consent loads one tag, disables advertising and limits the reported addresses", () => {
  const page = setup();
  page.choose("granted");
  assert.equal(page.storedChoice(), "granted");
  assert.equal(page.notice.hidden, true);
  assert.equal(page.tags.length, 1);
  assert.equal(page.tags[0].src,
    `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  const commands = page.window.dataLayer.map((entry) => Array.from(entry));
  assert.equal(commands[0][0], "consent");
  assert.equal(commands[0][2].ad_storage, "denied");
  assert.equal(commands[0][2].ad_user_data, "denied");
  assert.equal(commands[0][2].ad_personalization, "denied");
  const config = commands.find(([command]) => command === "config")[2];
  assert.equal(config.page_location, "https://histoforge.github.io/docs/");
  assert.equal(config.page_referrer, "https://example.com");
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  page.choose("granted");
  assert.equal(page.tags.length, 1);
  assert.equal(page.window.dataLayer.filter((entry) => entry[0] === "config").length, 1);
});

test("a saved permission applies on the next page and can be revoked", () => {
  const page = setup({choice: "granted"});
  assert.equal(page.tags.length, 1);
  assert.equal(page.notice.hidden, true);
  page.settings.dispatchEvent(new Event("click"));
  assert.equal(page.notice.hidden, false);
  page.choose("denied");
  assert.equal(page.storedChoice(), "denied");
  assert.equal(page.window[`ga-disable-${measurementId}`], true);
  assert.equal(page.window.dataLayer.at(-1)[2].analytics_storage, "denied");
  assert.ok(page.expiredCookies.some((value) => value.startsWith("_ga_TEST123=; Max-Age=0")));
  assert.equal(page.notice.hidden, true);
});

test("local previews never send analytics and blocked storage still permits a page-level choice", () => {
  const local = setup({local: true});
  local.choose("granted");
  local.download.dispatchEvent(new Event("click"));
  assert.equal(local.tags.length, 0);
  assert.equal(local.window.dataLayer, undefined);
  const blocked = setup({storageBlocked: true});
  assert.equal(blocked.tags.length, 0);
  blocked.choose("granted");
  assert.equal(blocked.tags.length, 1);
  assert.equal(blocked.notice.hidden, true);
  blocked.download.dispatchEvent(new Event("click"));
  assert.equal(blocked.window.dataLayer.at(-1)[1], "download_click");
});

test("download clicks require current consent and omit query strings and fragments", () => {
  const page = setup();
  page.download.dispatchEvent(new Event("click"));
  assert.equal(page.window.dataLayer, undefined);
  page.choose("granted");
  const click = new Event("click", {cancelable: true});
  page.download.dispatchEvent(click);
  assert.equal(click.defaultPrevented, false);
  const event = page.window.dataLayer.at(-1);
  assert.equal(event[0], "event");
  assert.equal(event[1], "download_click");
  assert.equal(event[2].file_name, "histoforge.jar");
  assert.equal(event[2].link_url,
    "https://github.com/HistoForge/histoforge-qupath-extension/releases/download/v1.0/histoforge.jar");
  page.choose("denied");
  const previousLength = page.window.dataLayer.length;
  page.download.dispatchEvent(new Event("click"));
  assert.equal(page.window.dataLayer.length, previousLength);
  page.choose("granted");
  page.download.dispatchEvent(new Event("click"));
  assert.equal(page.window.dataLayer.filter((entry) => entry[1] === "download_click").length, 2);
});
