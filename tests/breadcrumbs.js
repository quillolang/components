const [nav, long] = $$("nav.ui-breadcrumbs");
if (nav.getAttribute("aria-label") !== "Breadcrumb") return "the nav is not labelled Breadcrumb";
const items = [...nav.querySelectorAll("li")];
if (items.length !== 4) return `expected 4 items, found ${items.length}`;
const links = items.slice(0, 3).map((li) => li.querySelector("a")?.getAttribute("href"));
if (links.join(" ") !== "/ /docs/ /components/") return `the first three are not links to their hrefs: ${links}`;
const here = items[3].firstElementChild;
if (here.tagName === "A" || here.getAttribute("aria-current") !== "page") return "the last item is not plain text with aria-current=page";
if (nav.querySelectorAll("[aria-current]").length !== 1) return "more than one item is aria-current";
if (getComputedStyle(items[1], "::before").content === "none" || getComputedStyle(items[0], "::before").content !== "none")
    return "separators are not drawn between items only";
const mid = long.querySelectorAll("li")[2].firstElementChild;
if (mid.scrollWidth <= mid.clientWidth) return "a long middle label is not cut short";
if (mid.title !== mid.textContent) return "a cut label has no tooltip with its whole text";
