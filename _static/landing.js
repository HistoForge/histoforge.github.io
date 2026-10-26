// Clicks, keyboard navigation and timed advancement share one selection path.
// The surrounding page stays in ordinary flow; manual gallery navigation stops autoplay.
const reloaded = performance.getEntriesByType("navigation")[0]?.type === "reload";
const scrollRestoration = history.scrollRestoration;
// Refresh starts at the introduction; ordinary links and Back/Forward keep their behavior.
if (reloaded) history.scrollRestoration = "manual";

const workflow = document.querySelector(".workflow");
const galleryViewport = workflow.querySelector(".workflow-viewport");
const stage = workflow.querySelector(".workflow-stage");
const views = workflow.querySelector(".workflow-views");
const panels = [...views.querySelectorAll(".workflow-panel")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const printView = window.matchMedia("print");
const AUTOPLAY_DELAY = 5000;
let selected = 0;
let carouselEnabled = false;
let compactGallery = false;
let autoplayEnabled = !reducedMotion.matches;
let inView = false;
let autoplayTimer = null;

// The original figures form the carousel. Two clear hit areas let readers select
// the visible neighbors without adding controls or duplicate images over them.
const neighbors = document.createElement("div");
neighbors.className = "gallery-neighbors";
views.append(neighbors);
const neighborButtons = [-1, 1].map((direction) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `gallery-neighbor gallery-neighbor-${direction < 0 ? "previous" : "next"}`;
  button.tabIndex = 0;
  button.addEventListener("click", () => {
    const index = (selected + direction + panels.length) % panels.length;
    const hadFocus = document.activeElement === button;
    navigateTo(index);
    if (hadFocus) panels[index].focus({preventScroll: true});
  });
  neighbors.append(button);
  return button;
});
const offsets = panels.map((_, index) => index <= panels.length / 2 ? index : index - panels.length);

const navigation = document.createElement("div");
navigation.className = "gallery-navigation";
const counter = document.createElement("span");
counter.setAttribute("role", "status");
counter.setAttribute("aria-live", "polite");
counter.setAttribute("aria-atomic", "true");
const navigationButtons = [-1, 1].map((direction) => {
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${direction < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}" /></svg>`;
  button.setAttribute("aria-label", direction < 0 ? "Previous image" : "Next image");
  button.addEventListener("click", () => navigateTo(adjacentIndex(direction)));
  return button;
});
navigation.append(navigationButtons[0], counter, navigationButtons[1]);
stage.append(navigation);

function adjacentIndex(direction) {
  return compactGallery ? Math.max(0, Math.min(panels.length - 1, selected + direction)) :
    (selected + direction + panels.length) % panels.length;
}

function canAutoAdvance() {
  const selection = document.getSelection();
  const reading = selection && !selection.isCollapsed &&
    (workflow.contains(selection.anchorNode) || workflow.contains(selection.focusNode));
  const focusedPanel = panels.some((panel) => panel.contains(document.activeElement));
  return carouselEnabled && !compactGallery && autoplayEnabled && inView && !document.hidden &&
    !printView.matches && !reading && !focusedPanel;
}

function restartAutoplay() {
  clearTimeout(autoplayTimer);
  autoplayTimer = null;
  if (!canAutoAdvance()) return;
  autoplayTimer = setTimeout(() => {
    autoplayTimer = null;
    if (canAutoAdvance()) goTo((selected + 1) % panels.length);
  }, AUTOPLAY_DELAY);
}

function stopAutoplay() {
  autoplayEnabled = false;
  restartAutoplay();
}

function select(index) {
  let distance = index - selected;
  if (distance > panels.length / 2) distance -= panels.length;
  if (distance < -panels.length / 2) distance += panels.length;
  const nextOffsets = offsets.map((offset) => {
    let next = offset - distance;
    if (next < -panels.length / 2) next += panels.length;
    if (next > panels.length / 2) next -= panels.length;
    return next;
  });
  // Move a card around the loop while it is outside the visible window. Its
  // ensuing motion then follows the same direction and distance as the row.
  const wrapped = panels.filter((panel, current) => {
    const start = nextOffsets[current] + distance;
    if (start === offsets[current]) return false;
    panel.dataset.repositioning = "true";
    panel.style.setProperty("--gallery-offset", start);
    return true;
  });
  if (wrapped.length) {
    views.getBoundingClientRect();
    wrapped.forEach((panel) => delete panel.dataset.repositioning);
  }
  selected = index;
  panels.forEach((panel, current) => {
    panel.dataset.state = current === index ? "active" : current < index ? "before" : "after";
    // Neighbors remain visible, but only the selected original figure exposes
    // its full-size link and credit to keyboard and screen-reader navigation.
    panel.inert = carouselEnabled && current !== index;
    if (panel.inert) panel.setAttribute("aria-hidden", "true");
    else panel.removeAttribute("aria-hidden");
    offsets[current] = nextOffsets[current];
    panel.style.setProperty("--gallery-offset", offsets[current]);
  });
  neighborButtons.forEach((button, side) => {
    const neighbor = (index + (side === 0 ? -1 : 1) + panels.length) % panels.length;
    button.setAttribute("aria-label", `Show ${panels[neighbor].querySelector("h3").textContent}`);
    button.setAttribute("aria-controls", panels[neighbor].id);
    button.inert = !carouselEnabled || compactGallery;
    button.setAttribute("aria-hidden", String(button.inert));
  });
  navigation.hidden = !carouselEnabled || !compactGallery;
  counter.textContent = `${index + 1} / ${panels.length}`;
  navigationButtons.forEach((button, side) => {
    const target = adjacentIndex(side === 0 ? -1 : 1);
    button.disabled = target === index;
    button.setAttribute("aria-controls", panels[target].id);
  });
}

function measure() {
  // Keep the selected image when fonts or viewport dimensions change.
  swipe = null;
  workflow.classList.remove("is-compact-gallery");
  workflow.style.removeProperty("--gallery-heading-height");
  workflow.classList.add("is-measuring", "is-carousel");
  navigation.hidden = true;
  const height = stage.offsetHeight;
  compactGallery = window.innerWidth <= 720 || height > window.innerHeight - 32;
  carouselEnabled = !printView.matches;
  workflow.classList.toggle("is-carousel", carouselEnabled);
  workflow.classList.toggle("is-compact-gallery", carouselEnabled && compactGallery);
  if (carouselEnabled && compactGallery) {
    // Reserve the tallest title at this width so images and controls stay still.
    const headingHeight = Math.max(...panels.map((panel) => panel.querySelector("h3").getBoundingClientRect().height));
    workflow.style.setProperty("--gallery-heading-height", `${Math.ceil(headingHeight)}px`);
  }
  if (carouselEnabled) {
    galleryViewport.setAttribute("tabindex", "0");
    galleryViewport.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight Home End");
  } else {
    galleryViewport.removeAttribute("tabindex");
    galleryViewport.removeAttribute("aria-keyshortcuts");
  }
  select(selected);
  // Commit the measured state without animating first load or a layout change.
  stage.getBoundingClientRect();
  workflow.classList.remove("is-measuring");
  restartAutoplay();
}

function goTo(index, reveal = false) {
  if (!carouselEnabled) return;
  select(index);
  if (reveal) workflow.scrollIntoView({block: "nearest", behavior: "instant"});
  restartAutoplay();
}

function followHash(reveal = true) {
  const index = panels.findIndex((panel) => `#${panel.id}` === location.hash);
  if (index !== -1) goTo(index, reveal);
}

function navigateTo(index) {
  stopAutoplay();
  const hash = `#${panels[index].id}`;
  if (location.hash !== hash) history.pushState(null, "", hash);
  goTo(index);
}

workflow.addEventListener("hf-gallery-open", stopAutoplay);

// Let the browser handle vertical scrolling and pinch zoom. A horizontal swipe
// selects one image; suppress its follow-up click so it does not open the viewer.
let swipe = null;
let suppressClick = false;
views.addEventListener("pointerdown", (event) => {
  swipe = null;
  suppressClick = false;
  if (!carouselEnabled || !compactGallery || !event.isPrimary ||
      !["touch", "pen"].includes(event.pointerType)) return;
  swipe = {id: event.pointerId, x: event.clientX, y: event.clientY};
});
views.addEventListener("pointercancel", () => { swipe = null; });
views.addEventListener("pointerup", (event) => {
  if (!swipe || event.pointerId !== swipe.id) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
  suppressClick = true;
  navigateTo(adjacentIndex(dx < 0 ? 1 : -1));
});
views.addEventListener("click", (event) => {
  if (!suppressClick || event.detail === 0) return;
  suppressClick = false;
  event.preventDefault();
  event.stopPropagation();
}, true);

galleryViewport.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const index = {
    ArrowLeft: adjacentIndex(-1),
    ArrowRight: adjacentIndex(1),
    Home: 0,
    End: panels.length - 1,
  }[event.key];
  if (carouselEnabled && index !== undefined) {
    event.preventDefault();
    const focusedPanel = panels.some((panel) => panel.contains(document.activeElement));
    navigateTo(index);
    if (focusedPanel) panels[index].focus({preventScroll: true});
  }
});
const visibility = new IntersectionObserver(([entry]) => {
  inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
  restartAutoplay();
}, {threshold: 0.25});
visibility.observe(stage);
document.addEventListener("visibilitychange", restartAutoplay);
printView.addEventListener("change", measure);
document.addEventListener("selectionchange", restartAutoplay);
workflow.addEventListener("focusin", (event) => {
  // A keyboard reader entering the gallery needs time to choose a topic.
  if (event.target === galleryViewport || neighborButtons.includes(event.target)) stopAutoplay();
  else restartAutoplay();
});
workflow.addEventListener("focusout", () => requestAnimationFrame(restartAutoplay));
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) autoplayEnabled = false;
  restartAutoplay();
});
window.addEventListener("pagehide", () => clearTimeout(autoplayTimer));
window.addEventListener("resize", measure);
// The review-only typeface selector can change line breaks after fonts load.
document.addEventListener("hf-landing-layout", measure);
document.fonts?.ready.then(measure);
window.addEventListener("hashchange", () => followHash());
window.addEventListener("pageshow", (event) => {
  measure();
  // Follow the requested image after native fragment positioning has finished.
  if (!event.persisted) requestAnimationFrame(() => {
    followHash(!reloaded);
    if (reloaded) {
      window.scrollTo({top: 0, behavior: "instant"});
      // Restore normal history scrolling for the rest of this visit.
      history.scrollRestoration = scrollRestoration;
    }
  });
});

// Reveal the gallery and select the passage before the review tool focuses it.
workflow.addEventListener("hf-review-reveal", (event) => {
  const panel = event.target.closest(".workflow-panel");
  const index = panels.indexOf(panel);
  if (carouselEnabled && index !== -1) {
    event.preventDefault();
    stopAutoplay();
    goTo(index, true);
  }
});

measure();
followHash(!reloaded);
