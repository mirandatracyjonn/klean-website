// klean.ph/receipt.html?order=<id>: a printable receipt for a paid order (M76, TJ 2026-10-19). The customer, the
// laundromat's staff and Super Admins can open it while signed in. Not a BIR official receipt (it says so).
import { SUPABASE_URL, SUPABASE_KEY, el, money } from "./site.js";

const box = document.getElementById("receipt");
const order = new URLSearchParams(location.search).get("order") ?? "";
const SERVICES = { wash_dry: "Wash + dry", wash_only: "Wash only", dry_only: "Dry only" };
const METHODS = { cash: "Cash", gcash: "GCash", paymaya: "Maya", qrph: "QR Ph", card: "Card", reward: "Free load (points)" };

function line(label, value) { return el("p", { class: "receipt-line" }, el("span", { text: label }), el("strong", { text: value })); }

function render(r) {
  const c = r.currency;
  const when = new Date(r.paid_at).toLocaleString("en-US", { timeZone: r.time_zone, dateStyle: "medium", timeStyle: "short" });
  const print = el("button", { class: "btn btn-brand no-print", type: "button", text: "Print or save as PDF" });
  print.addEventListener("click", () => window.print());
  box.replaceChildren(
    el("h1", { text: r.business }), el("p", { text: r.branch }),
    ...[r.address, r.phone, r.email].filter(Boolean).map((t) => el("p", { class: "meta", text: t })),
    el("hr"),
    el("h2", { text: `Receipt #${r.number}${r.is_test ? " (Beta test)" : ""}` }),
    el("p", { text: when }),
    el("p", { text: `Customer: ${r.customer}${r.member_code ? ` (${r.member_code})` : ""}` }),
    r.served_by ? el("p", { text: `Served by: ${r.served_by}` }) : "",
    el("hr"),
    line(`${SERVICES[r.service] ?? "Laundry"} × ${r.loads}`, `${money(r.price_per_load_minor, c)} each`),
    r.weight_grams ? el("p", { class: "meta", text: `${(r.weight_grams / 1000).toFixed(1)} kg` }) : "",
    line("Total", money(r.total_minor, c)),
    line("Paid by", METHODS[r.method] ?? r.method ?? "—"),
    r.cash_tendered_minor != null ? line("Cash received", money(r.cash_tendered_minor, c)) : "",
    r.cash_tendered_minor != null ? line("Change", money(r.change_minor ?? 0, c)) : "",
    r.points > 0 ? line("Points earned", String(r.points)) : "",
    ...r.refunds.map((f) => el("p", { class: "acct-error", text: `Refunded ${money(f.amount_minor, c)} (${f.loads} load${f.loads === 1 ? "" : "s"})${f.cash ? " in cash" : ""}${f.status === "pending" ? ", processing" : ""}` })),
    el("hr"),
    el("p", { class: "meta", text: r.notice }),
    el("div", { class: "btn-row no-print" }, print, el("a", { class: "btn btn-outline", href: "/account.html", text: "Back to your account" })));
  document.title = `Receipt #${r.number} | Klean`;
}

const tag = document.createElement("script");
tag.src = "/hq/vendor/supabase-js-2.117.2.js";
tag.onload = async () => {
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: "pkce", persistSession: true } });
  const { data: { session } } = await db.auth.getSession();
  if (!session) { box.replaceChildren(el("p", { text: "Sign in on your account page first." }), el("a", { class: "btn btn-brand", href: "/account.html", text: "Sign in" })); return; }
  if (!/^[0-9a-f-]{36}$/i.test(order)) { box.replaceChildren(el("p", { text: "That receipt link isn't complete." })); return; }
  const { data, error } = await db.rpc("order_receipt", { order_id: order });
  if (error) { box.replaceChildren(el("p", { class: "acct-error", text: error.message })); return; }
  render(data);
};
tag.onerror = () => { box.replaceChildren(el("p", { text: "Couldn't load Klean. Check your connection and reload." })); };
document.head.append(tag);
