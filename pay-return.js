// Where PayMongo and Stripe send people after paying (RETURN_BASE in the app's Edge Functions):
//   /pay-return.html?flow=laundry|kyc_fee&status=paid|cancelled[&order=<id>]
// The app opened checkout in an in-app browser; this page tells them what happened and how to get back.
import { el } from "./site.js";

const q = new URLSearchParams(location.search);
const paid = q.get("status") === "paid";
const flow = q.get("flow") === "kyc_fee" ? "kyc_fee" : "laundry";
const card = document.getElementById("result");

const title = paid
  ? (flow === "kyc_fee" ? "Payment received" : "Paid! Your machine is getting ready")
  : "Payment cancelled";
const body = paid
  ? (flow === "kyc_fee" ? "Go back to Klean to start your identity check." : "Go back to Klean. When the machine's light turns white, tap Start wash (or Start dry) on Home, or press Start on the machine. Machines never start by themselves.")
  : "Nothing was charged. Go back to Klean to try again.";

card.replaceChildren(
  el("div", { class: "big-icon", style: paid ? null : "background:#94a3b8" }, paid ? "✓" : "×"),
  el("h1", { text: title }),
  el("p", { text: body }),
  el("div", { class: "actions" },
    el("a", { class: "btn btn-brand", href: "klean://home", text: "Back to Klean" }),
    flow === "kyc_fee" ? el("a", { class: "btn btn-outline", href: "/account.html", text: "Continue on klean.ph" }) : null),
  el("p", { class: "meta", style: "margin-top:14px", text: "In the app? Tap Done (top left) to close this page." }));
document.title = `${title} | Klean`;
