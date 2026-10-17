// Find a laundromat: live laundromats on Klean, with machines free right now.
import { branchCard, el, rpc } from "./site.js";

const list = document.getElementById("results");
const form = document.getElementById("search-form");
const input = document.getElementById("search");

async function load(search = "") {
  list.replaceChildren(el("p", { class: "empty", text: "Looking for laundromats…" }));
  try {
    const rows = await rpc("public_branches", { search: search || null, max_rows: 40 });
    if (!rows.length) {
      list.replaceChildren(el("div", { class: "card empty" },
        el("h3", { text: search ? "No laundromats match that" : "Klean is launching soon" }),
        el("p", { text: search ? "Try a city, street or laundromat name." : "The first Klean laundromats open in Metro Manila. Own a laundromat? Try Klean free in Beta." }),
        search ? null : el("a", { class: "btn btn-brand", href: "/owners.html", text: "Bring Klean to your laundromat" })));
      return;
    }
    list.replaceChildren(el("div", { class: "grid" }, rows.map((b) => branchCard(b))));
  } catch (error) {
    list.replaceChildren(el("p", { class: "empty", text: error.message }));
  }
}

form.addEventListener("submit", (e) => { e.preventDefault(); load(input.value.trim()); });
load();
