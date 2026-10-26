import {STORAGE_KEY, pageKey, anchorFor, locateAnchor, readNotes, saveNote} from "./review-core.mjs";

const article = document.querySelector('[itemprop="articleBody"]');
if (article) initReview(article);

function initReview(article) {
  const page = pageKey(location.pathname);
  let selected = null;
  let draft = null;
  let notes = [];
  let returnFocus = null;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action) {
    const node = element("button", text);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }
  const root = element("div", "", "hf-review");
  const toolbar = element("div", "", "hf-review-toolbar");
  const toggle = button("Comments", () => openPanel());
  toggle.setAttribute("aria-controls", "hf-review-panel");
  toggle.setAttribute("aria-expanded", "false");
  toolbar.append(toggle);
  const add = button("Add comment", () => startComment());
  add.className = "hf-review-add";
  add.hidden = true;
  add.addEventListener("pointerdown", (event) => event.preventDefault());
  const panel = element("aside", "", "hf-review-panel");
  panel.id = "hf-review-panel";
  panel.setAttribute("aria-label", "Document comments");
  panel.hidden = true;
  const heading = element("div", "", "hf-review-heading");
  const close = button("Close", closePanel);
  heading.append(element("h2", "Comments"), close);
  const hint = element("p", "Select text in the page, then choose Add comment. Notes stay in this browser; export a copy to keep or share.", "hf-review-hint");
  const exportButton = button("Export all notes", exportNotes);
  const status = element("p", "", "hf-review-status");
  status.setAttribute("role", "status");
  const form = element("form", "", "hf-review-form");
  form.hidden = true;
  const quote = element("blockquote");
  const label = element("label", "Your comment");
  label.htmlFor = "hf-review-note";
  const input = element("textarea");
  input.id = label.htmlFor;
  input.rows = 4;
  input.required = true;
  input.maxLength = 10000;
  const save = element("button", "Save comment");
  save.type = "submit";
  const cancel = button("Cancel", () => {
    if (input.value && !confirm("Discard this unsaved comment?")) return;
    clearDraft();
  });
  const formActions = element("div", "", "hf-review-actions");
  formActions.append(save, cancel);
  form.append(quote, label, input, formActions);
  const list = element("div", "", "hf-review-list");
  panel.append(heading, hint, exportButton, status, form, list);
  root.append(toolbar, add, panel);
  document.body.append(root);

  function textIndex() {
    const nodes = [];
    let text = "";
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.parentElement.closest("script, style, .headerlink")
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      nodes.push({node, start: text.length, end: text.length + node.length});
      text += node.data;
    }
    return {nodes, text};
  }
  function rangeFor(index, start, length) {
    const first = index.nodes.find((item) => item.end > start);
    const last = index.nodes.find((item) => item.end >= start + length);
    if (!first || !last) return null;
    const range = document.createRange();
    range.setStart(first.node, start - first.start);
    range.setEnd(last.node, start + length - last.start);
    return range;
  }
  function captureSelection() {
    if (!form.hidden) return;
    const selection = window.getSelection();
    add.hidden = true;
    selected = null;
    if (!selection.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!article.contains(range.startContainer) || !article.contains(range.endContainer)) return;
    const index = textIndex();
    const parts = index.nodes.filter((item) => range.intersectsNode(item.node));
    if (!parts.length) return;
    const first = parts[0], last = parts[parts.length - 1];
    const start = first.start + (range.startContainer === first.node ? range.startOffset : 0);
    const end = last.start + (range.endContainer === last.node ? range.endOffset : last.node.length);
    const anchor = anchorFor(index.text, start, end);
    if (!anchor.quote.trim()) return;
    selected = anchor;
    const rect = range.getBoundingClientRect();
    add.hidden = false;
    add.style.left = Math.max(8, Math.min(rect.left, innerWidth - add.offsetWidth - 8)) + "px";
    add.style.top = Math.max(8, Math.min(rect.bottom + 8, innerHeight - add.offsetHeight - 8)) + "px";
  }
  function openPanel() {
    returnFocus = document.activeElement;
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    load();
    close.focus();
  }
  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    (returnFocus?.isConnected && !returnFocus.hidden ? returnFocus : toggle).focus();
  }
  function startComment(note = null) {
    if (!note && !selected) return;
    if (draft && input.value && !confirm("Discard this unsaved comment?")) return;
    const anchor = note?.anchor || selected;
    openPanel();
    draft = note || {anchor};
    quote.textContent = anchor.quote;
    input.value = note?.body || "";
    form.hidden = false;
    add.hidden = true;
    input.focus();
  }
  function clearDraft() {
    draft = null;
    input.value = "";
    form.hidden = true;
    selected = null;
    add.hidden = true;
  }
  function load() {
    try {
      notes = readNotes(localStorage);
      render();
    } catch (error) {
      status.textContent = "Could not read saved comments. " + error.message;
    }
  }
  function persist(note) {
    try {
      notes = saveNote(localStorage, note);
      render();
      status.textContent = "Saved in this browser.";
      return true;
    } catch (error) {
      status.textContent = "Not saved. Export a backup if possible. " + error.message;
      return false;
    }
  }
  function showPassage(note) {
    const index = textIndex();
    const start = locateAnchor(index.text, note.anchor);
    if (start === null) {
      status.textContent = "This passage changed or is ambiguous. The original quote is preserved.";
      return;
    }
    const range = rangeFor(index, start, note.anchor.quote.length);
    if (!range) return;
    // A page can reveal and position its own scroll-linked content. Ordinary
    // articles keep the default passage navigation.
    const target = range.startContainer.parentElement;
    const defaultScroll = target.dispatchEvent(new Event("hf-review-reveal", {bubbles: true, cancelable: true}));
    if (defaultScroll) target.scrollIntoView({behavior: "smooth", block: "center"});
    if (globalThis.CSS?.highlights && globalThis.Highlight) {
      CSS.highlights.set("hf-review-active", new Highlight(range));
    }
    closePanel();
  }
  function render() {
    const current = notes.filter((note) => note.page === page);
    toggle.textContent = "Comments (" + current.filter((note) => !note.resolved).length + ")";
    list.replaceChildren();
    const index = textIndex();
    const ranges = [];
    if (!current.length) list.append(element("p", "No comments on this page yet.", "hf-review-hint"));
    for (const note of current) {
      const start = locateAnchor(index.text, note.anchor);
      if (start !== null && !note.resolved) {
        const range = rangeFor(index, start, note.anchor.quote.length);
        if (range) ranges.push(range);
      }
      const card = element("section", "", "hf-review-note");
      const passage = button(note.anchor.quote, () => showPassage(note));
      passage.className = "hf-review-quote";
      passage.setAttribute("aria-label", "Show passage: " + note.anchor.quote);
      const state = note.resolved ? "Resolved" : "Open";
      card.append(element("p", state, "hf-review-hint"), passage, element("p", note.body, "hf-review-body"));
      if (start === null) card.append(element("p", "Passage changed or ambiguous; original quote retained.", "hf-review-hint"));
      const actions = element("div", "", "hf-review-actions");
      actions.append(button("Edit", () => startComment(note)), button(note.resolved ? "Reopen" : "Resolve", () => {
        persist({...note, resolved: !note.resolved, updatedAt: new Date().toISOString()});
      }));
      card.append(actions);
      list.append(card);
    }
    if (globalThis.CSS?.highlights && globalThis.Highlight) {
      CSS.highlights.delete("hf-review-active");
      CSS.highlights.set("hf-review-notes", new Highlight(...ranges));
    }
  }
  function exportNotes() {
    try {
      const data = {version: 1, exportedAt: new Date().toISOString(), notes: readNotes(localStorage)};
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}));
      const link = element("a");
      link.href = url;
      link.download = "histoforge-review-notes.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = "Exported saved notes from all pages. Unsaved drafts are not included.";
    } catch (error) {
      status.textContent = "Could not export notes. " + error.message;
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!draft || !input.value.trim()) return;
    const now = new Date().toISOString();
    const note = {
      id: draft.id || crypto.randomUUID(), page,
      title: article.querySelector("h1")?.textContent.replace("", "").trim() || document.title,
      anchor: draft.anchor, body: input.value.trim(),
      resolved: draft.resolved || false, createdAt: draft.createdAt || now, updatedAt: now,
    };
    if (persist(note)) clearDraft();
  });
  document.addEventListener("pointerup", (event) => {
    if (!root.contains(event.target)) captureSelection();
  });
  document.addEventListener("keyup", (event) => {
    if (!root.contains(event.target)) captureSelection();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
    if ((event.ctrlKey || event.metaKey) && event.altKey && event.code === "KeyM") {
      captureSelection();
      if (selected) { event.preventDefault(); startComment(); }
    }
  });
  window.addEventListener("scroll", () => { add.hidden = true; }, {passive: true});
  window.addEventListener("resize", () => { add.hidden = true; });
  window.addEventListener("storage", (event) => { if (event.key === STORAGE_KEY) load(); });
  window.addEventListener("beforeunload", (event) => {
    if (draft && input.value.trim()) { event.preventDefault(); event.returnValue = ""; }
  });
  load();
}
