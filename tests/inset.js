const pad = (sel) => { const s = getComputedStyle($(sel)); return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(" "); };
if (pad(".inset-demo-md") !== "16px 16px 16px 16px") return `md pads ${pad(".inset-demo-md")}`;
if (pad(".inset-demo-xl") !== "40px 40px 40px 40px") return `xl pads ${pad(".inset-demo-xl")}`;
if (pad(".inset-demo-x") !== "0px 24px 0px 24px") return `lg axis="x" pads ${pad(".inset-demo-x")}`;
if (pad(".inset-demo-map") !== "8px 0px 40px 0px") return `{ top: "sm", bottom: "xl" } pads ${pad(".inset-demo-map")}`;
const box = $(".inset-demo-md"), inner = box.firstElementChild;
if (Math.round(inner.getBoundingClientRect().left - box.getBoundingClientRect().left) !== 16) return "the content is not inset";
