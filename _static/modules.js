// Progressive enhancement: without JavaScript, every module stays readable.
const catalog = document.querySelector(".module-catalog");
const pagination = catalog?.querySelector(".module-pagination");

if (pagination) {
  const cards = [...catalog.querySelectorAll(".module-card")];
  const list = catalog.querySelector(".module-list");
  const contentPages = [...catalog.querySelectorAll(".module-page")];
  const pages = [...pagination.querySelectorAll("[data-module-page]")];
  const previous = pagination.querySelector("[data-page-previous]");
  const next = pagination.querySelector("[data-page-next]");
  const status = pagination.querySelector('[role="status"]');
  const pageSize = Number(catalog.dataset.pageSize);
  let current = 0;

  function showPage(page, reveal = false) {
    if (page < 0 || page >= pages.length) return;
    current = page;
    contentPages.forEach((content, index) => {
      content.hidden = index !== current;
    });
    pages.forEach((button, index) => {
      if (index === current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    previous.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    status.textContent = `Page ${current + 1} of ${pages.length}. ` +
      `Modules ${current * pageSize + 1}–${Math.min((current + 1) * pageSize, cards.length)} of ${cards.length}.`;
    if (reveal) {
      const first = cards[current * pageSize];
      (first.querySelector("a") ?? first).focus({preventScroll: true});
      catalog.scrollIntoView({block: "start", behavior: "instant"});
    }
  }

  pages.forEach((button, index) => {
    button.addEventListener("click", () => showPage(index, true));
  });
  previous.addEventListener("click", () => showPage(current - 1, true));
  next.addEventListener("click", () => showPage(current + 1, true));

  // Let a saved review note reveal its card before the review tool scrolls to it.
  catalog.addEventListener("hf-review-reveal", (event) => {
    const index = cards.indexOf(event.target.closest(".module-card"));
    if (index !== -1) showPage(Math.floor(index / pageSize));
  });

  list.classList.add("is-paginated");
  showPage(0);
  pagination.hidden = false;
}
