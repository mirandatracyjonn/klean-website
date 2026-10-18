// GitHub Pages serves 404.html for any unknown path, so this handles Klean's share links:
//   /m/<token>  a machine's QR sticker. With the app installed, iOS opens the app directly (universal link) and this
//               page never shows; without it, people land here.
//   /b/<id>     a laundromat's page (e.g. a Klean card sent in iMessage).
import { branchCard, el, rpc } from "./site.js";

const main = document.getElementById("main");
const parts = location.pathname.split("/").filter(Boolean);
const icon = (path) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  for (const d of path) { const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); svg.append(p); }
  return svg;
};
const QR = ["M3 7V5a2 2 0 0 1 2-2h2", "M17 3h2a2 2 0 0 1 2 2v2", "M21 17v2a2 2 0 0 1-2 2h-2", "M7 21H5a2 2 0 0 1-2-2v-2", "M7 8h3v3H7z", "M14 8h3v3h-3z", "M7 14h3v3H7z", "M14 14h3v3h-3z"];

function page(...children) {
  main.replaceChildren(el("div", { class: "status-page" }, el("div", { class: "card" }, ...children)));
}

if (parts[0] === "m" && parts[1]) {
  document.title = "Klean machine";
  page(el("div", { class: "big-icon" }, icon(QR)),
    el("h1", { text: "This is a Klean machine" }),
    el("p", { text: "Pay with GCash, Maya or card in the Klean app, and the machine starts by itself. No coins needed. Lots of laundry? Pay for up to 5 loads at once." }),
    el("p", { class: "meta", text: "Already have Klean? Open the app, tap Scan, and point your camera at the sticker." }),
    el("div", { class: "actions" },
      el("a", { class: "btn btn-brand", href: "/#download", text: "Get the Klean app" }),
      el("a", { class: "btn btn-outline", href: "/find.html", text: "Find a laundromat" })));
} else if (parts[0] === "b" && parts[1]) {
  document.title = "Laundromat on Klean";
  main.replaceChildren(el("p", { class: "empty", text: "Loading laundromat…" }));
  rpc("public_branch", { branch: parts[1] }).then((b) => {
    if (!b) return page(el("h1", { text: "Laundromat not found" }), el("p", { text: "It may have closed or moved." }),
                        el("a", { class: "btn btn-brand", href: "/find.html", text: "Find a laundromat" }));
    document.title = `${b.operator_name} · ${b.name} | Klean`;
    main.replaceChildren(el("div", { class: "doc" },
      el("p", { class: "kicker", text: "Laundromat on Klean" }),
      el("h1", { text: b.name }),
      b.is_beta ? el("p", { class: "meta", text: "This laundromat is testing Klean (Beta): payments here use test money." }) : null,
      branchCard(b, { link: false }),
      el("p", { style: "margin-top:18px", text: `Points you earn here work at every ${b.operator_name} branch.` }),
      el("a", { class: "btn btn-brand", href: "/#download", text: "Get the Klean app" })));
  }).catch((error) => page(el("h1", { text: "Couldn't load this laundromat" }), el("p", { text: error.message })));
} else {
  document.title = "Page not found | Klean";
  page(el("h1", { text: "Page not found" }), el("p", { text: "Keep it simple: let's get you back home." }),
       el("div", { class: "actions" }, el("a", { class: "btn btn-brand", href: "/", text: "Go home" })));
}
