// klean.ph/account.html: sign in and verify your identity on the web (TJ, 2026-10-18).
// People on a phone or computer browser pay the verification fee here with PayMongo (GCash, Maya, QR Ph) or Stripe
// (card); the iPhone and Android apps use Apple / Google in-app purchase instead and never link here. Didit's check
// runs on Didit's page and returns to this page (start-verification's web callback).
import { SUPABASE_URL, SUPABASE_KEY, el, money } from "./site.js";

const box = document.getElementById("acct");
const heading = document.getElementById("acct-title");
const here = location.origin + location.pathname;
let db;

// supabase-js (the same vendored build Klean HQ uses) as a classic script, then start.
const tag = document.createElement("script");
tag.src = "/hq/vendor/supabase-js-2.117.2.js";
tag.onload = () => {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
  db.auth.onAuthStateChange((event) => { if (event === "SIGNED_IN" || event === "SIGNED_OUT") render(); });
  render();
};
tag.onerror = () => show("Couldn't load Klean. Check your connection and reload.");
document.head.append(tag);

function show(message) { box.replaceChildren(el("p", { class: "meta", text: message })); }
function errorLine(text) { return el("p", { class: "acct-error", role: "alert", text }); }

async function call(fn, body) {
  const { data, error } = await db.functions.invoke(fn, { body });
  if (error) {
    let code = "";
    try { code = (await error.context.json()).error ?? ""; } catch { /* not JSON */ }
    throw new Error(MESSAGES[code] ?? "Something went wrong. Please try again.");
  }
  return data;
}
const MESSAGES = {
  fee_required: "Pay the verification fee first.", already_verified: "You're already verified.",
  duplicate_account: "You already have a Klean account.", in_review: "Your verification is under review.",
  under_18: "Klean is for adults 18 and over.", provider_error: "The payment or verification service is busy. Please try again.",
};

async function render() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return signedOut();
  const [account, v] = await Promise.all([db.rpc("my_account"), db.rpc("my_verification")]);
  if (account.error || v.error) return show("Couldn't load your account. Please reload.");
  signedIn(account.data, v.data);
}

function signedOut() {
  heading.textContent = "Sign in";
  const status = el("p", { class: "meta" });
  const signIn = (provider) => async () => {
    const { error } = await db.auth.signInWithOAuth({ provider, options: { redirectTo: here } });
    if (error) status.textContent = error.message;
  };
  const google = el("button", { class: "btn btn-brand", type: "button", text: "Continue with Google" });
  const github = el("button", { class: "btn btn-outline", type: "button", text: "Continue with GitHub" });
  google.addEventListener("click", signIn("google"));
  github.addEventListener("click", signIn("github"));
  box.replaceChildren(
    el("p", { text: "One person, one Klean account. If you already use Klean, sign in the same way you did in the app." }),
    el("div", { class: "btn-row" }, google, github),
    el("p", { class: "meta", text: "Signed up with Apple? Use the Klean app on your iPhone." }),
    status,
    el("p", { class: "meta", text: "By continuing you agree to the Terms of Service and Privacy Policy." }));
}

function signedIn(a, v) {
  heading.textContent = a.first_name ? `Hi, ${a.first_name}` : "Your account";
  const parts = [el("div", { class: "card acct-card" },
    el("p", { class: "meta", text: "Member code" }), el("p", { class: "acct-code", text: a.member_code ?? "" }), walletButton())];
  parts.push(machinesCard());
  if (v.status === "verified") parts.push(phoneCard(a));
  parts.push(verificationCard(v));
  if (v.status === "verified") parts.push(businessCard());
  for (const m of (a.memberships ?? []).filter((x) => x.role === "super_admin")) parts.push(closeBusinessCard(m));
  const out = el("button", { class: "btn btn-outline", type: "button", text: "Sign out" });
  out.addEventListener("click", async () => { await db.auth.signOut(); });
  parts.push(el("div", { class: "btn-row" }, out), deleteCard(a));
  box.replaceChildren(...parts);
  if (v.status === "in_progress" || new URLSearchParams(location.search).has("verification")) watch(v.status);
}

// M37 (TJ): machines never start by themselves. Paid machines wait here for Start wash / Start dry (or the
// machine's own Start button). The card stays hidden when nothing is waiting.
let machinesTimer;
function machinesCard() {
  const card = el("div", { class: "card acct-card", hidden: true });
  const draw = async () => {
    clearTimeout(machinesTimer);
    if (!card.isConnected && card.dataset.drawn) return;
    const { data, error } = await db.rpc("my_ready_machines");
    card.dataset.drawn = "1";
    const list = error ? [] : data ?? [];
    card.hidden = list.length === 0;
    card.replaceChildren(el("h2", { text: "Ready to start" }), ...list.map(machineRow));
    if (list.length) machinesTimer = setTimeout(draw, 3000);
  };
  const machineRow = (m) => {
    const title = m.machine_type === "dryer" ? "Start dry" : "Start wash";
    const msg = el("p", { class: "meta" });
    const b = el("button", { class: "btn btn-brand", type: "button", text: title, disabled: !m.ready });
    b.addEventListener("click", async () => {
      if (!window.confirm(`Start ${m.label} now?\n\nMake sure your laundry is inside and the door is closed.`)) return;
      b.disabled = true; b.textContent = "Starting…";
      const { error } = await db.rpc("start_machine", { activation: m.activation_id });
      if (error) { msg.replaceChildren(errorLine(error.message)); b.disabled = false; b.textContent = title; return; }
      msg.textContent = `Starting ${m.label}… If it hasn't started in a few seconds, press Start on the machine.`;
    });
    return el("div", { class: "acct-machine" },
      el("p", { text: m.ready ? `${m.label} at ${m.branch_name} is ready` : `${m.label} at ${m.branch_name} is getting ready…` }),
      el("p", { class: "meta", text: m.ready ? `Load your laundry and close the door, then tap ${title}, or press Start on the machine.`
                                              : "Its light turns white in a few seconds." }),
      b, msg);
  };
  draw();
  return card;
}

// M40: an optional mobile number, so payment pages are filled in (GCash / Maya number).
function phoneCard(a) {
  const input = el("input", { type: "tel", autocomplete: "tel", placeholder: "0917 123 4567", value: a.phone ?? "" });
  const msg = el("p", { class: "meta" });
  const save = el("button", { class: "btn btn-brand", type: "button", text: "Save" });
  save.addEventListener("click", async () => {
    save.disabled = true;
    const { data, error } = await db.rpc("set_my_phone", { phone: input.value });
    save.disabled = false;
    if (error) { msg.replaceChildren(errorLine(error.message)); return; }
    input.value = data ?? "";
    msg.textContent = data ? "Mobile number saved." : "Mobile number removed.";
  });
  return el("div", { class: "card acct-card" }, el("h2", { text: "Mobile number" }),
    el("p", { class: "meta", text: "Optional. Saved so you don't type it when you pay (use your GCash or Maya number). Only you and the payment page see it." }),
    el("div", { class: "btn-row" }, input, save), msg);
}

// Roadmap 5: the member card in Apple Wallet (Safari on iPhone and Mac). The server signs it (wallet-pass).
function walletButton() {
  if (!/iPhone|iPad|Macintosh/.test(navigator.userAgent)) return googleWalletButton();
  const msg = el("p", { class: "meta" });
  const b = el("button", { class: "btn btn-outline", type: "button", text: "Add to Apple Wallet" });
  b.addEventListener("click", async () => {
    b.disabled = true; msg.textContent = "Making your card…";
    try {
      const { data: { session } } = await db.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/wallet-pass`, { method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, apikey: SUPABASE_KEY } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `error ${r.status}`);
      const url = URL.createObjectURL(new Blob([await r.arrayBuffer()], { type: "application/vnd.apple.pkpass" }));
      location.href = url;   // Safari opens it in Wallet
      msg.textContent = "";
    } catch (e) { msg.replaceChildren(errorLine(`Couldn't make your card: ${e.message}`)); }
    b.disabled = false;
  });
  return el("div", { class: "btn-row" }, b, msg);
}

// Roadmap 5: the member card in Google Wallet (Android and other browsers).
function googleWalletButton() {
  const msg = el("p", { class: "meta" });
  const b = el("button", { class: "btn btn-outline", type: "button", text: "Save to Google Wallet" });
  b.addEventListener("click", async () => {
    b.disabled = true; msg.textContent = "Making your card…";
    try {
      const { data: { session } } = await db.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/wallet-pass`, { method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "google" }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.url) throw new Error(body.error ?? `error ${r.status}`);
      location.href = body.url;
    } catch (e) { msg.replaceChildren(errorLine(`Couldn't make your card: ${e.message}`)); }
    b.disabled = false;
  });
  return el("div", { class: "btn-row" }, b, msg);
}

function verificationCard(v) {
  const card = el("div", { class: "card acct-card" });
  const fee = v.fee ?? { PHP: 19900, USD: 299 };
  const err = el("div");
  const busy = (button, work) => async () => {
    button.disabled = true; err.replaceChildren();
    try { await work(); } catch (e) { err.replaceChildren(errorLine(e.message)); button.disabled = false; }
  };
  const startButton = (label) => {
    const b = el("button", { class: "btn btn-brand", type: "button", text: label });
    b.addEventListener("click", busy(b, async () => {
      const s = await call("start-verification", { platform: "web" });
      if (s.url) location.href = s.url;
    }));
    return b;
  };

  if (v.status === "verified") {
    card.append(el("h2", { text: "You're verified ✓" }),
      el("p", { text: "You're all set. Open the Klean app and scan a washer to start." }));
  } else if (v.decline_reason === "duplicate_account") {
    card.append(el("h2", { text: "You already have a Klean account" }),
      el("p", { text: `Sign out and sign in the way you did before${(v.original_sign_in ?? []).length ? ` (${v.original_sign_in.join(", ")})` : ""}.` }));
  } else if (v.decline_reason === "under_18") {
    card.append(el("h2", { text: "Klean is for adults 18 and over." }));
  } else if (v.status === "in_review") {
    card.append(el("h2", { text: "Under review" }), el("p", { text: "We're double-checking your verification. This usually takes less than a day. We'll notify you." }));
  } else if (v.status === "in_progress") {
    card.append(el("h2", { text: "Checking your verification…" }),
      el("p", { text: "If you finished Didit's steps, your result usually arrives within a minute. This page updates by itself." }),
      el("p", { class: "meta", text: "Closed Didit before finishing? Continue at no extra cost:" }), startButton("Continue verification"));
  } else if (v.has_paid_fee) {
    const consent = el("input", { type: "checkbox", id: "consent" });
    const go = startButton("Start verification");
    go.disabled = true;
    consent.addEventListener("change", () => { go.disabled = !consent.checked; });
    card.append(el("h2", { text: v.status === "declined" ? "Try again" : "Ready to verify" }),
      v.status === "declined" ? el("p", { text: "Your last attempt wasn't approved. Use a valid, unexpired ID in good light." }) : "",
      v.free_verification ? el("p", { class: "acct-free", text: "Verification is free. Once you're verified, you stay verified." }) : "",
      el("p", { text: "About two minutes: a photo of your ID, then a quick selfie, on our partner Didit's secure page. Use good light, lay your ID flat, and remove glasses and hats." }),
      el("label", { class: "acct-consent" }, consent, " I agree that Didit may process images of my ID and my face to verify my identity, as described in the Privacy Policy."),
      go);
  } else {
    const gcash = el("button", { class: "btn btn-brand", type: "button", text: `Pay ${money(fee.PHP, "PHP")} · GCash, Maya, QR Ph` });
    const cardPay = el("button", { class: "btn btn-outline", type: "button", text: `Pay ${money(fee.USD, "USD")} · Card` });
    const pay = (provider, button) => busy(button, async () => {
      const r = await call("payments", { action: "kyc_fee", provider });
      if (r.checkout_url) location.href = r.checkout_url; else render();
    });
    gcash.addEventListener("click", pay("paymongo", gcash));
    cardPay.addEventListener("click", pay("stripe", cardPay));
    card.append(el("h2", { text: "Verify your identity" }),
      el("p", { text: "Everyone on Klean verifies once: one person, one account. It keeps points fair and stops fraud. Klean never sees or keeps your ID images; our partner Didit handles them." }),
      el("p", { text: `The fee covers the identity check: ${money(fee.PHP, "PHP")} or ${money(fee.USD, "USD")}, charged per attempt and non-refundable.` }),
      el("p", { class: "meta", text: "Already use Klean in the app? Check this member code matches the one in the app (Account) before paying. If it doesn't, this is a new account: sign out and sign in the way you did in the app, or link this sign-in in the app first (Account → Sign-in methods)." }),
      el("div", { class: "btn-row" }, gcash, cardPay));
  }
  card.append(err);
  return card;
}

function deleteCard(a) {
  const card = el("div", { class: "card acct-card" }, el("h2", { text: "Delete account" }));
  if ((a.sign_in_methods ?? []).includes("apple")) {
    card.append(el("p", { text: "Your account uses Sign in with Apple. Delete it in the Klean app (Account → Delete account) so Apple's link is removed too." }));
    return card;
  }
  const b = el("button", { class: "btn btn-outline acct-danger", type: "button", text: "Delete my account…" });
  const err = el("div");
  b.addEventListener("click", async () => {
    if (!window.confirm("Delete your Klean account? This removes your personal data and can't be undone.")) return;
    const { error } = await db.rpc("delete_account");
    if (error) { err.replaceChildren(errorLine(error.message)); return; }
    await db.auth.signOut();
  });
  card.append(el("p", { text: "Removes your personal data and signs you out everywhere. Unused points and credits are forfeited." }), b, err);
  return card;
}

let watching = false;
function watch(initial) {
  if (watching) return;
  watching = true;
  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;
    const { data } = await db.rpc("my_verification");
    if ((data && data.status !== initial) || tries >= 36) { clearInterval(timer); watching = false; history.replaceState(null, "", here); render(); }
  }, 5000);
}

// --- Start a laundromat business (same as the apps' Operator mode; TJ 2026-10-18: time zone menu + Locate me) ---------

/** "Asia/Manila (GMT+8)". */
function zoneLabel(zone) {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? "";
    return `${zone.replace(/_/g, " ")} (${part.replace("GMT", "GMT") || "GMT"})`;
  } catch { return zone; }
}

function businessCard() {
  const card = el("div", { class: "card acct-card" }, el("h2", { text: "Start a laundromat business" }),
    el("p", { text: "Run a laundromat on Klean with this same account. You become its Super Admin: set prices, add branches and machines, hire verified staff, and see sales and customers. Free to start, in Beta with test money until you go live." }));
  const name = el("input", { type: "text", maxlength: "80", placeholder: "Business name", "aria-label": "Business name" });
  const country = el("input", { type: "text", maxlength: "2", value: "PH", "aria-label": "Country code, e.g. PH" });
  const currency = el("input", { type: "text", maxlength: "3", value: "PHP", "aria-label": "Currency", disabled: true });
  country.addEventListener("input", () => {
    country.value = country.value.toUpperCase();
    currency.disabled = country.value === "PH";
    if (country.value === "PH") currency.value = "PHP";
  });
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [here]).filter((z) => z.includes("/"));
  if (!zones.includes(here)) zones.push(here);
  const zone = el("select", { "aria-label": "Time zone" }, ...zones.sort().map((z) => el("option", { value: z, selected: z === here }, zoneLabel(z))));
  const locate = el("button", { type: "button", class: "btn btn-outline", text: "📍 Locate me" });
  locate.addEventListener("click", () => { zone.value = Intl.DateTimeFormat().resolvedOptions().timeZone; });
  const create = el("button", { type: "button", class: "btn btn-brand", text: "Create business" });
  const out = el("div");
  create.addEventListener("click", async () => {
    out.replaceChildren();
    if (name.value.trim().length < 2) { out.append(errorLine("Enter your business name.")); return; }
    create.disabled = true;
    const { error } = await db.rpc("create_operator", { name: name.value.trim(), country: country.value.trim() || "PH",
      currency: (currency.value.trim() || "PHP").toUpperCase(), time_zone: zone.value });
    if (error) { out.append(errorLine(error.message)); create.disabled = false; return; }
    card.replaceChildren(el("h2", { text: "Business created ✓" }),
      el("p", { text: "Next: open the Klean app → Business → Setup to add your branch, machines and payments, or use Klean HQ on this computer." }),
      el("a", { class: "btn btn-brand", href: "/hq/", text: "Open Klean HQ" }));
  });
  card.append(
    el("label", { class: "acct-field" }, "Business name", name),
    el("div", { class: "acct-row" }, el("label", { class: "acct-field" }, "Country", country), el("label", { class: "acct-field" }, "Currency", currency)),
    el("label", { class: "acct-field" }, "Time zone", zone),
    el("div", { class: "btn-row" }, locate),
    el("p", { class: "meta", text: "Reports and daily payouts follow this time zone. Philippine businesses take payments through PayMongo; everywhere else through Stripe." }),
    out, el("div", { class: "btn-row" }, create));
  return card;
}

// --- Delete (Beta) or close (real money) a business you run (M30; TJ 2026-10-18) -----------------------------------

function closeBusinessCard(m) {
  const card = el("div", { class: "card acct-card" }, el("h2", { text: m.operator_name }), el("p", { class: "meta", text: "Loading…" }));
  db.from("operators").select("id, name, is_beta, status").eq("id", m.operator_id).maybeSingle().then(({ data: op }) => {
    if (!op) { card.remove(); return; }
    const beta = op.is_beta;
    const name = el("input", { type: "text", placeholder: `Type ${op.name} to confirm`, "aria-label": "Business name to confirm", autocomplete: "off" });
    const go = el("button", { type: "button", class: "btn btn-outline acct-danger", disabled: true, text: beta ? "Delete business" : "Close business" });
    const out = el("div");
    name.addEventListener("input", () => { go.disabled = name.value.trim().toLowerCase() !== op.name.trim().toLowerCase(); });
    go.addEventListener("click", async () => {
      if (!window.confirm(`${beta ? "Delete" : "Close"} ${op.name}? This can't be undone.`)) return;
      go.disabled = true; out.replaceChildren();
      const { data, error } = await db.rpc("delete_business", { operator: op.id, confirm_name: name.value.trim() });
      if (error) { out.append(errorLine(error.message)); go.disabled = false; return; }
      card.replaceChildren(el("h2", { text: data?.result === "closed" ? `${op.name} is closed` : `${op.name} was deleted` }),
        el("p", { text: data?.result === "closed" ? "Its machines are off and staff no longer have access. Payment records are kept as the law requires." : "Its branches, machines, staff and test data are gone. Your Klean account stays." }));
    });
    card.replaceChildren(el("h2", { text: `${beta ? "Delete" : "Close"} ${op.name}` }),
      el("p", { class: "meta", text: beta
        ? "Deletes this business completely: branches, machines, staff, test orders and customers' points here. Everyone's Klean account stays."
        : "Closes this business: machines stop taking payments, staff lose access, and it disappears from Klean. Payment records are kept as the law requires. You can close once no customer has unused paid loads here, your last payout has arrived, and no payment is in progress." }),
      el("label", { class: "acct-field" }, "Confirm", name), out, el("div", { class: "btn-row" }, go));
  });
  return card;
}
