const form = $(".center-demo-form"), btn = $(".center-demo-button"), text = $(".center-demo-text");
if (!form || !btn || !text) return "the three centres are missing";
const centred = (el, inside) => { const r = el.getBoundingClientRect(), p = inside.getBoundingClientRect(); return Math.abs((r.left - p.left) - (p.right - r.right)) <= 1; };
if (form.getBoundingClientRect().width > 421) return `limit={420} is ${form.getBoundingClientRect().width}px wide`;
if (!centred(form, form.parentElement)) return "the capped column is not centred";
const b = btn.querySelector(".ui-btn");
if (b.getBoundingClientRect().width > 200 || !centred(b, btn)) return "intrinsic={true} does not centre the button by its own width";
if (getComputedStyle(text).textAlign !== "center" || getComputedStyle(text.querySelector("p")).textAlign !== "center") return "text={true} does not centre the text";
if (text.getBoundingClientRect().width > 521) return "the text column is not capped at 520px";
