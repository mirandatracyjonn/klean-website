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
    el("p", { class: "meta", text: "Member code" }), el("p", { class: "acct-code", text: a.member_code ?? "" }))];
  parts.push(verificationCard(v));
  const out = el("button", { class: "btn btn-outline", type: "button", text: "Sign out" });
  out.addEventListener("click", async () => { await db.auth.signOut(); });
  parts.push(el("div", { class: "btn-row" }, out), deleteCard(a));
  box.replaceChildren(...parts);
  if (v.status === "in_progress" || new URLSearchParams(location.search).has("verification")) watch(v.status);
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
      v.free_verification ? el("p", { class: "acct-free", text: "Free while Klean is in testing. Once you're verified, you stay verified." }) : "",
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
