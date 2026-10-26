import test from "node:test";
import assert from "node:assert/strict";
import {anchorFor, locateAnchor, pageKey, parseNotes, readNotes, saveNote} from "../_review/review-core.mjs";

test("home page has one stable identity", () => {
  assert.equal(pageKey("/"), "/index.html");
  assert.equal(pageKey("/docs/a.html"), "/docs/a.html");
});
test("anchors survive text inserted before a passage", () => {
  const text = "Read this precise passage before proceeding.";
  const anchor = anchorFor(text, 10, 25);
  assert.equal(locateAnchor("New introduction. " + text, anchor), 28);
});
test("repeated quotes use context; ambiguity and removed quotes stay detached", () => {
  const text = "First note. Second note.";
  const anchor = anchorFor(text, 19, 23);
  assert.equal(locateAnchor(text, anchor), 19);
  assert.equal(locateAnchor("note note", {...anchor, prefix: "", suffix: ""}), null);
  assert.equal(locateAnchor("Removed.", anchor), null);
});
test("unique quote survives changed surrounding prose", () => {
  assert.equal(locateAnchor("new phrase ending", {quote: "phrase", prefix: "old ", suffix: ".", start: 4}), 4);
});
test("notes persist, edit, resolve, reopen, and preserve other pages", () => {
  let raw = null;
  const storage = {getItem: () => raw, setItem: (_, value) => {raw = value;}};
  const note = {id:"a", page:"/index.html", title:"Home", anchor:anchorFor("hello",0,5), body:"Clarify this.", resolved:false, createdAt:"now", updatedAt:"now"};
  saveNote(storage, note);
  saveNote(storage, {...note, id:"b", page:"/docs/a.html"});
  saveNote(storage, {...note, body:"Revised.", resolved:true});
  assert.equal(readNotes(storage).length, 2);
  assert.equal(readNotes(storage)[0].body, "Revised.");
  assert.equal(readNotes(storage)[0].resolved, true);
  saveNote(storage, {...note, resolved:false});
  assert.equal(readNotes(storage)[0].resolved, false);
});
test("invalid storage is never overwritten", () => {
  for (const raw of ['bad json', '{"version":2,"notes":[]}', '{"version":1,"notes":[{}]}']) {
    assert.throws(() => parseNotes(raw));
    assert.throws(() => saveNote({getItem:()=>raw,setItem:()=>assert.fail("must not write")}, {}));
  }
});
test("storage failures surface without reporting a save", () => {
  assert.throws(() => saveNote({getItem:()=>null,setItem:()=>{throw new Error("Quota");}},
    {id:"a",page:"/",title:"Home",anchor:anchorFor("text",0,4),body:"note",resolved:false,createdAt:"now",updatedAt:"now"}), /Quota/);
});
