// Local design review only. No comment storage or public-site preference is changed.
const typefaces = [
  {id: "source-sans", label: "Source Sans 3", body: "Source Sans 3",
    description: "The landing page's default typeface. Open, readable letterforms."},
  {id: "system", label: "System font", body: null,
    description: "Your operating system's default interface typeface, for comparison."},
  {id: "plex", label: "IBM Plex Sans", body: "IBM Plex Sans",
    description: "More technical character, with distinctive letter shapes."},
  {id: "public-sans", label: "Public Sans", body: "Public Sans",
    description: "Neutral and direct. A quieter institutional direction."},
  {id: "franklin", label: "Libre Franklin", body: "Libre Franklin",
    description: "A firmer editorial voice, without using a serif."},
  {id: "work-sans", label: "Work Sans", body: "Work Sans",
    description: "Wider, softer forms. A more contemporary alternative."},
  {id: "source-serif", label: "Source Serif 4 + Source Sans 3", body: "Source Sans 3", heading: "Source Serif 4",
    description: "Serif headings with sans-serif body text. A journal-like direction."},
  {id: "hanken", label: "Hanken Grotesk", body: "Hanken Grotesk",
    description: "Open shapes with a neutral, understated character."},
  {id: "instrument", label: "Instrument Sans", body: "Instrument Sans",
    description: "Compact, clear forms with slightly sharper details."},
  {id: "lato", label: "Lato", body: "Lato",
    description: "Familiar proportions with rounded details. Regular and bold weights."},
  {id: "commissioner", label: "Commissioner", body: "Commissioner",
    description: "Upright, compact forms with a little more character."},
  {id: "schibsted", label: "Schibsted Grotesk", body: "Schibsted Grotesk",
    description: "Firm, compact lettering with an editorial feel."},
  {id: "figtree", label: "Figtree", body: "Figtree",
    description: "Softer curves and broad, open letterforms."},
  {id: "albert", label: "Albert Sans", body: "Albert Sans",
    description: "Geometric forms with relatively light, even strokes."},
  {id: "noto-sans", label: "Noto Sans", body: "Noto Sans",
    description: "Even proportions and familiar, clearly separated shapes."},
  {id: "open-sans", label: "Open Sans", body: "Open Sans",
    description: "Open, spacious letterforms with a familiar web-text feel."},
  {id: "barlow", label: "Barlow", body: "Barlow",
    description: "Narrower proportions and softer corners."},
  {id: "archivo", label: "Archivo", body: "Archivo",
    description: "Compact, sturdy lettering with a denser appearance."},
  {id: "karla", label: "Karla", body: "Karla",
    description: "Wide spacing and distinctive shapes, particularly at larger sizes."},
  {id: "roboto", label: "Roboto", body: "Roboto",
    description: "A familiar interface typeface with compact proportions."},
  {id: "martel", label: "Martel Sans", body: "Martel Sans",
    description: "Broad letterforms with generous spacing."},
  {id: "hind", label: "Hind", body: "Hind",
    description: "Relatively narrow forms with open, rounded details."},
  {id: "atkinson", label: "Atkinson Hyperlegible Next", body: "Atkinson Hyperlegible Next",
    description: "Distinct letter and numeral shapes, designed for legibility."},
  {id: "newsreader", label: "Newsreader + Source Sans 3", body: "Source Sans 3", heading: "Newsreader",
    description: "Fine, flowing serif headings; Source Sans 3 body text."},
  {id: "literata", label: "Literata + Source Sans 3", body: "Source Sans 3", heading: "Literata",
    description: "Sturdier, book-like serif headings; Source Sans 3 body text."},
  {id: "noto-serif", label: "Noto Serif + Source Sans 3", body: "Source Sans 3", heading: "Noto Serif",
    description: "Even, traditional serif headings; Source Sans 3 body text."},
  {id: "plex-serif", label: "IBM Plex Serif + Source Sans 3", body: "Source Sans 3", heading: "IBM Plex Serif",
    description: "More angular serif headings; Source Sans 3 body text."},
];

const control = document.createElement("details");
control.className = "font-review";
control.innerHTML = `
  <summary>Typeface <span class="font-review-current">Source Sans 3</span></summary>
  <div class="font-review-panel">
    <label for="landing-typeface">Compare typefaces</label>
    <select id="landing-typeface" aria-describedby="font-review-description"></select>
    <p id="font-review-description" role="status"></p>
    <small>Local review only. The URL keeps your selection.</small>
  </div>`;
document.body.append(control);
const select = control.querySelector("select");
const current = control.querySelector(".font-review-current");
const description = control.querySelector("#font-review-description");
for (const typeface of typefaces) {
  const option = document.createElement("option");
  option.value = typeface.id;
  option.textContent = typeface.label;
  select.append(option);
}

let applied = typefaces[0].id;
let request = 0;
async function applyTypeface(id, updateUrl = false) {
  const typeface = typefaces.find((item) => item.id === id) || typefaces[0];
  const revision = ++request;
  select.value = typeface.id;
  description.textContent = "Loading typeface…";
  try {
    const families = [...new Set([typeface.body, typeface.heading].filter(Boolean))];
    await Promise.all(families.map((family) => document.fonts.load(`500 1em "${family}"`)));
    if (revision !== request) return;
    const style = document.documentElement.style;
    if (typeface.body) style.setProperty("--font", `"${typeface.body}", var(--system-font)`);
    else style.setProperty("--font", "var(--system-font)");
    if (typeface.heading) style.setProperty("--heading-font", `"${typeface.heading}", Georgia, serif`);
    else style.removeProperty("--heading-font");
    applied = typeface.id;
    current.textContent = typeface.label;
    description.textContent = typeface.description;
    if (updateUrl) {
      const url = new URL(location.href);
      if (typeface.id === typefaces[0].id) url.searchParams.delete("typeface");
      else url.searchParams.set("typeface", typeface.id);
      history.replaceState(history.state, "", url);
    }
    document.dispatchEvent(new Event("hf-landing-layout"));
  } catch {
    if (revision !== request) return;
    select.value = applied;
    description.textContent = "Could not load that typeface. The previous choice is unchanged.";
  }
}

select.addEventListener("change", () => applyTypeface(select.value, true));
control.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    control.open = false;
    control.querySelector("summary").focus();
  }
});
applyTypeface(new URL(location.href).searchParams.get("typeface"));
