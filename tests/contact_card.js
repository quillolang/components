const grace = $("#contact-card-demo-grace");
if (grace.tagName !== "ADDRESS") return "a contact card is not an <address>";
if (grace.querySelector(".ui-contact-card-name").textContent !== "Grace Hopper") return "the name is missing";
if (grace.querySelector(".ui-contact-card-role").textContent !== "Rear admiral · US Navy") return `the role reads ${grace.querySelector(".ui-contact-card-role").textContent}`;
const links = [...grace.querySelectorAll(".ui-contact-card-row a")].map((a) => a.getAttribute("href"));
if (links[0] !== "mailto:grace@example.com") return `email link: ${links[0]}`;
if (links[1] !== "tel:+15550100100") return `tel link keeps only digits: ${links[1]}`;
if (links[2] !== "https://example.com" || grace.querySelectorAll(".ui-contact-card-row a")[2].textContent !== "example.com") return "the website link";
if (!links[3]?.startsWith("https://www.google.com/maps/search/?api=1&query=1%20Navy%20Way")) return `map link: ${links[3]}`;
const save = grace.querySelector("a[download]");
if (!save || save.getAttribute("download") !== "Grace Hopper.vcf") return "no vCard download";
const vcf = decodeURIComponent(save.getAttribute("href").replace(/^data:text\/vcard;charset=utf-8,/, ""));
const want = ["BEGIN:VCARD", "VERSION:3.0", "N:Hopper;Grace;;;", "FN:Grace Hopper", "ORG:US Navy", "TITLE:Rear admiral",
    "TEL;TYPE=WORK,VOICE:+1 (555) 010-0100", "EMAIL;TYPE=INTERNET:grace@example.com", "URL:https://example.com",
    "ADR;TYPE=WORK:;;1 Navy Way\\, Arlington\\, VA 22202;;;;", "END:VCARD"].join("\r\n");
if (vcf !== want) return `the vCard reads:\n${vcf}`;
const ada = $$(".ui-contact-card")[1];
if (ada.querySelector(".ui-avatar img")?.getAttribute("src") !== "https://i.pravatar.cc/112?img=32") return "src does not reach the avatar";
const addr = [...ada.querySelectorAll(".ui-contact-card-row")].at(-1);
if (addr.querySelector("a") || addr.textContent.trim() !== "Ockham Park, Surrey") return "map={false} still links the address";
if (!ada.querySelector(".ui-contact-card-acts .ui-btn")) return "children are not in the actions row";
const plato = $("#contact-card-demo-plain");
if (plato.querySelector("a[download]") || getComputedStyle(plato.querySelector(".ui-contact-card-acts")).display !== "none") return "vcard={false} still shows the link";
if (plato.querySelectorAll(".ui-contact-card-row").length !== 1) return "rows show for details left out";
