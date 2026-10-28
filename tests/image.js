const imgs = $$(".ui-image");
if (imgs.length !== 6) return `expected 6 images, found ${imgs.length}`;
const [good, broken] = imgs;
const note = () => $("#image-demo-note").textContent;
good.scrollIntoView({ block: "center" }); await wait(300);   // lazy images load only near the viewport
for (let i = 0; i < 60 && (good.dataset.state === "loading" || broken.dataset.state === "loading"); i++) await wait(150);
if (good.dataset.state !== "loaded") return `the good image is ${good.dataset.state}`;
await wait(400);   // the fade-in
if (broken.dataset.state !== "error") return `the broken image is ${broken.dataset.state}`;
if (getComputedStyle(good.querySelector("img")).opacity !== "1") return "the loaded image is not shown";
if (getComputedStyle(broken.querySelector("img")).display !== "none") return "the broken image is still shown";
const fb = broken.querySelector(".ui-image-fallback");
if (!fb || fb.getAttribute("role") !== "img" || fb.getAttribute("aria-label") !== "A missing photo" || !fb.textContent.includes("Image unavailable")) return "the fallback does not keep the alt and say the image is unavailable";
if (note() !== "1 loaded, 1 failed.") return `on_load / on_error: ${note()}`;
if (Math.round(good.getBoundingClientRect().width) !== 300) return `width is ${good.getBoundingClientRect().width}`;
const r = good.getBoundingClientRect();
if (Math.abs(r.width / r.height - 16 / 9) > 0.02) return `the default ratio is ${r.width / r.height}`;
if (getComputedStyle(good).backgroundColor !== "rgb(207, 217, 230)") return `the placeholder colour is ${getComputedStyle(good).backgroundColor}`;
const [sq, sharp, contain, natural] = $$("#image-demo-shapes .ui-image");
const sr = sq.getBoundingClientRect();
if (Math.abs(sr.width - sr.height) > 1) return "ratio 1 is not square";
if (getComputedStyle(sharp).borderRadius !== "0px") return "radius false keeps rounded corners";
if (getComputedStyle(contain.querySelector("img")).objectFit !== "contain") return "fit contain is not applied";
if (natural.classList.contains("ui-image-ratio")) return "ratio null still fixes a ratio";
