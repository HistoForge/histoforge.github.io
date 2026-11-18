// Native dialog supplies modal focus containment and Escape-to-close.
const viewer = document.querySelector(".gallery-viewer");
const image = viewer.querySelector(".gallery-viewer-image");
const title = viewer.querySelector("h2");
const error = viewer.querySelector(".gallery-viewer-error");
let opener = null;

document.querySelectorAll(".capture-image").forEach((link) => {
  link.addEventListener("click", (event) => {
    // Keep explicit browser actions and the no-dialog fallback as ordinary links.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        typeof viewer.showModal !== "function") return;
    event.preventDefault();
    opener = link;
    link.dispatchEvent(new Event("hf-gallery-open", {bubbles: true}));
    const preview = link.querySelector("img");
    title.textContent = link.closest("figure").querySelector("h3").textContent;
    error.hidden = true;
    image.hidden = false;
    image.alt = preview.alt;
    image.src = preview.currentSrc || preview.src;
    viewer.style.setProperty("--image-ratio", preview.naturalWidth / preview.naturalHeight || 1);
    viewer.showModal();
    document.documentElement.classList.add("gallery-viewer-open");
  });
});

viewer.querySelector("button").addEventListener("click", () => viewer.close());
// Only a click that starts and ends outside the content dismisses the viewer.
let pressedBackdrop = false;
viewer.addEventListener("pointerdown", (event) => {
  pressedBackdrop = event.target === viewer;
});
viewer.addEventListener("click", (event) => {
  if (pressedBackdrop && event.target === viewer) viewer.close();
  pressedBackdrop = false;
});
viewer.addEventListener("close", () => {
  document.documentElement.classList.remove("gallery-viewer-open");
  image.removeAttribute("src");
  opener?.focus({preventScroll: true});
  opener = null;
});
image.addEventListener("error", () => {
  if (!viewer.open) return;
  image.hidden = true;
  error.hidden = false;
});
