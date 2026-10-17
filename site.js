// Shared by every page. Only the publishable key is here: it's public by design, and what it can read is decided by the
// database (public_branches / public_branch return public facts about live laundromats only).
export const SUPABASE_URL = "https://allxvwnohkibfjbpoxvu.supabase.co";
export const SUPABASE_KEY = "sb_publishable_CLX33VwJ8Ai6ZkEUT8utKA_NAzCW6Hl";
export const TAGLINE = "Keep it simple. Keep it Klean.";

/** Calls a public database function. */
export async function rpc(name, args = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`Klean is busy (${response.status}). Please try again.`);
  return response.json();
}

/** Builds an element; text is always set with textContent (never parsed as HTML). */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "style") node.style.cssText = value; // CSSOM, allowed by the Content Security Policy (inline attributes aren't)
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) node.append(child);
  return node;
}

export function money(minor, currency) {
  return new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

export function mapsURL(b) {
  const q = b.latitude != null && b.longitude != null ? `${b.latitude},${b.longitude}` : `${b.operator_name} ${b.name} ${b.address ?? ""}`;
  return `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
}

/** A laundromat card used by Find and branch pages. */
export function branchCard(b, { link = true } = {}) {
  const title = el("h3", {}, link ? el("a", { href: `/b/${b.id}`, text: b.operator_name }) : b.operator_name);
  if (b.is_beta) title.append(el("span", { class: "beta-tag", text: "BETA", title: "Testing Klean: payments use test money" }));
  const free = (n, total, word) => el("span", { class: n > 0 ? "" : "none" }, el("i"), `${n}/${total} ${word} free`);
  return el("article", { class: "card branch-card" },
    title,
    el("div", { class: "meta", text: [b.name, b.address].filter(Boolean).join(" · ") }),
    el("div", { class: "meta", text: `${money(b.price_per_load_minor, b.currency)} per load · wash + dry · up to ${b.max_kg_per_load} kg` }),
    el("div", { class: "avail" }, free(b.washers_free, b.washers, "washers"), free(b.dryers_free, b.dryers, "dryers")),
    el("div", { class: "actions", style: null }, el("a", { class: "btn btn-outline", href: mapsURL(b), target: "_blank", rel: "noopener", text: "Directions" })));
}

// Mobile menu
document.querySelector(".menu-toggle")?.addEventListener("click", (e) => {
  const nav = document.querySelector(".nav");
  const open = nav.classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", String(open));
});
