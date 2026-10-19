// ---------------------------------------------------------------------------------------------------------------------
// Settings. The URL and publishable key are public (same as the apps).
const SUPABASE_URL = "https://allxvwnohkibfjbpoxvu.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_CLX33VwJ8Ai6ZkEUT8utKA_NAzCW6Hl";
const EVENTS_URL = `${SUPABASE_URL}/functions/v1/machine-events`;
const QR_BASE = "https://klean.ph/m/";
const TICK_MS = 1000;          // simulated controllers poll for commands this often (1 s: Start feels instant)
const HEARTBEAT_EVERY = 30;    // ticks (30 s); the server marks a machine offline after 90 s without one

const db = supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Per-browser memory: device secrets, which machines are simulated, and each simulated controller's state.
const STORE_KEY = "klean-floor-v1"; // name from before Klean Floor became Klean HQ; kept so saved machine keys survive
function loadLocal() {
  try { return Object.assign({ secrets: {}, modes: {}, sim: {}, speed: 60, operatorId: null, branchId: null }, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); }
  catch { return { secrets: {}, modes: {}, sim: {}, speed: 60 }; }
}
const local = loadLocal();
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(local)); } catch {} };

const S = { isBeta: true, session: null, account: null, operators: [], branches: [], machines: {}, view: "loading", error: null, tick: 0, busy: false };

// ---------------------------------------------------------------------------------------------------------------------
// Data
async function rpc(name, args = {}) {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

async function loadAccount() {
  S.account = await rpc("my_account");
  S.operators = (S.account?.memberships ?? []).filter((m) => m.role === "super_admin");
  if (!S.operators.some((o) => o.operator_id === local.operatorId)) local.operatorId = S.operators[0]?.operator_id ?? null;
  save();
}

async function loadOperator() {
  const { data } = await db.from("operators").select("is_beta").eq("id", local.operatorId).single();
  S.isBeta = data?.is_beta ?? true;
}

async function loadBranches() {
  await loadOperator();
  const all = await rpc("my_branches");
  S.branches = all.filter((b) => b.operator_id === local.operatorId);
  if (!S.branches.some((b) => b.id === local.branchId)) local.branchId = S.branches[0]?.id ?? null;
  save();
  await Promise.all(S.branches.map((b) => loadMachines(b.id)));
}

async function loadMachines(branchId) {
  S.machines[branchId] = await rpc("machine_setup", { branch: branchId });
}

const allMachines = () => Object.values(S.machines).flat();
const branchOf = (m) => Object.keys(S.machines).find((b) => S.machines[b].some((x) => x.id === m.id)) ?? local.branchId;
// The server knows which machines are simulated (M13); a live business can't take payments on them.
const modeOf = (m) => (m.is_simulated ? "sim" : "real");
const simOf = (m) => (local.sim[m.controller_id] ??= { state: "IDLE", plugged: true });

// ---------------------------------------------------------------------------------------------------------------------
// The simulated controllers. They speak exactly the protocol a real Klean controller speaks (machine-events).
async function sendEvents(events) {
  if (!events.length) return { results: [], commands: {} };
  // M47: your sign-in drives your Beta business's simulated machines on any device (no keys saved in this browser needed).
  const token = (await db.auth.getSession()).data.session?.access_token;
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const response = await fetch(EVENTS_URL, { method: "POST", headers, body: JSON.stringify(events) });
  if (!response.ok) throw new Error(`machine-events ${response.status}`);
  return response.json();
}

function simulated() {
  return allMachines().filter((m) => modeOf(m) === "sim" && m.is_enabled && S.isBeta);
}

function event(m, kind, extra = {}) {
  const secret = local.secrets[m.controller_id];
  return { controller_id: m.controller_id, ...(secret ? { secret } : {}), kind, ...extra };
}

async function tick() {
  S.tick++;
  const machines = simulated().filter((m) => simOf(m).plugged);
  const events = [];
  for (const m of machines) {
    const sim = simOf(m);
    if (sim.state === "RUNNING" && Date.now() >= sim.endsAt) {
      events.push(event(m, "completed", { activation_id: sim.activation }));
      Object.assign(sim, { state: "IDLE", activation: null, endsAt: null });
    }
    events.push(event(m, "poll"));
    if (S.tick % HEARTBEAT_EVERY === 1) events.push(event(m, "hb", { state: sim.state }));
  }
  try {
    const { commands } = await sendEvents(events);
    for (const [controllerId, list] of Object.entries(commands ?? {})) {
      const m = machines.find((x) => x.controller_id === controllerId);
      for (const c of list) {
        if (m && c.type === "CREDIT") await onCredit(m, c);
        // M37: the customer tapped Start wash / Start dry in Klean.
        if (m && c.type === "START" && simOf(m).activation === c.activation_id) await pressStart(m.controller_id);
      }
    }
    S.error = null;
  } catch (e) { S.error = `Simulator can't reach Klean: ${e.message}`; }
  save();
  // Refresh what the server says (the lights are the server's truth, the same as the app shows).
  try {
    if (local.branchId) await loadMachines(local.branchId);
    if (S.tick % 5 === 0) await Promise.all(S.branches.filter((b) => b.id !== local.branchId).map((b) => loadMachines(b.id)));
  } catch {}
  if (S.view === "floor") renderFloor();
}

async function onCredit(m, c) {
  const sim = simOf(m);
  Object.assign(sim, { state: "ARMED", activation: c.activation_id, cycleMinutes: c.cycle_minutes ?? m.cycle_minutes, endsAt: null });
  await sendEvents([event(m, "ack", { activation_id: c.activation_id })]);
  // Never start by itself (TJ, M37): the customer presses Start here or taps Start wash / Start dry in Klean.
}

async function pressStart(controllerId) {
  const m = allMachines().find((x) => x.controller_id === controllerId);
  if (!m) return;
  const sim = simOf(m);
  if (sim.state !== "ARMED") return;
  const minutes = sim.cycleMinutes ?? m.cycle_minutes;
  Object.assign(sim, { state: "RUNNING", endsAt: Date.now() + (minutes * 60000) / local.speed });
  save();
  await sendEvents([event(m, "started", { activation_id: sim.activation })]).catch((e) => (S.error = e.message));
  renderFloor();
}

async function act(controllerId, what) {
  const m = allMachines().find((x) => x.controller_id === controllerId);
  if (!m) return;
  const sim = simOf(m);
  try {
    if (what === "start") return pressStart(controllerId);
    if (what === "finish" && sim.state === "RUNNING") sim.endsAt = Date.now();
    if (what === "fault") {
      await sendEvents([event(m, "fault", { code: "SIMULATED_FAULT", ...(sim.state === "ARMED" ? { activation_id: sim.activation } : {}) })]);
      Object.assign(sim, { state: "FAULT", activation: null, endsAt: null });
    }
    if (what === "clear") {
      await rpc("clear_machine_error", { machine: m.id });
      Object.assign(sim, { state: "IDLE", activation: null, endsAt: null });
      if (sim.plugged) await sendEvents([event(m, "hb", { state: "IDLE" })]);
    }
    if (what === "unplug") sim.plugged = false;
    if (what === "plug") { sim.plugged = true; await sendEvents([event(m, "hb", { state: sim.state })]); }
    if (what === "takeover") {
      local.secrets[m.controller_id] = await rpc("rotate_device_secret", { machine: m.id });
      await rpc("set_machine_simulated", { machine: m.id, simulated: true });
      await sendEvents([event(m, "hb", { state: "IDLE" })]);
    }
    if (what === "real") {
      if (!confirm(`Switch ${m.label} to a real controller? This browser stops playing ${m.label}; its new key goes into the controller file (Hardware → Download controller file).`)) return;
      await rpc("set_machine_simulated", { machine: m.id, simulated: false });
      delete local.secrets[m.controller_id];
      delete local.sim[m.controller_id];
    }
    if (what === "sim") {
      if (!confirm(`Simulate ${m.label} in this browser? Its device key is replaced, so a real controller on it stops working until you download a new controller file.`)) return;
      return act(controllerId, "takeover");
    }
    save();
    await loadMachines(branchOf(m)).catch(() => {});
  } catch (e) { S.error = e.message; }
  renderFloor();
}

// ---------------------------------------------------------------------------------------------------------------------
// Machine artwork (SVG): a washer has a glass door with water; a dryer tumbles clothes. Both spin when in use.
function machineArt(m, status) {
  const running = status === "in_use";
  const isWasher = m.type === "washer";
  const body = status === "error" ? "#fff1f1" : "#ffffff";
  const door = isWasher ? (running ? "#60a5fa" : "#cfe9ff") : (running ? "#fcd9a8" : "#f1e6d6");
  const drum = isWasher
    ? `<path d="M40 106 q10 -8 20 0 t20 0 t20 0 t20 0 v40 h-80z" fill="${running ? "#2563eb" : "#93c5fd"}" opacity=".75"/>
       <g class="${running ? "spin fast" : ""}"><circle cx="70" cy="96" r="6" fill="#fff" opacity=".7"/><circle cx="92" cy="112" r="4" fill="#fff" opacity=".7"/>
         <circle cx="84" cy="88" r="3" fill="#fff" opacity=".8"/></g>`
    : `<g class="${running ? "spin" : ""}"><rect x="64" y="88" width="16" height="11" rx="3" fill="#f87171"/><rect x="82" y="104" width="15" height="11" rx="3" fill="#60a5fa"/>
         <rect x="66" y="108" width="12" height="9" rx="3" fill="#facc15"/></g>`;
  return `<svg viewBox="0 0 160 170" width="150" height="160" aria-label="${isWasher ? "Washer" : "Dryer"}">
    <rect x="18" y="6" width="124" height="158" rx="16" fill="${body}" stroke="#d6dfdc" stroke-width="2"/>
    <rect x="18" y="6" width="124" height="34" rx="16" fill="#f1f5f4"/><rect x="18" y="26" width="124" height="14" fill="#f1f5f4"/>
    <circle cx="38" cy="23" r="6" fill="#0E7C66"/><rect x="58" y="18" width="52" height="10" rx="5" fill="#0E7C66" opacity=".35"/>
    <text x="126" y="27" font-size="11" font-weight="700" text-anchor="end" fill="#5b6f69">${esc(m.label)}</text>
    <circle cx="80" cy="104" r="44" fill="#d6dfdc"/><circle cx="80" cy="104" r="37" fill="${door}"/>
    <clipPath id="c-${m.id}"><circle cx="80" cy="104" r="34"/></clipPath><g clip-path="url(#c-${m.id})">${drum}</g>
    <path d="M60 80 a30 30 0 0 1 22 -8" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>
  </svg>`;
}

// `margin` is the white "quiet zone" (in squares) cameras need around a code; without it, phones struggle to find the
// code, especially on a computer screen.
function qrSvg(token, cell = 3, margin = 0) {
  const q = qrcode(0, "M");
  q.addData(QR_BASE + token);
  q.make();
  return q.createSvgTag({ cellSize: cell, margin, scalable: true });
}

// Full-screen QR for scanning off the computer screen (click a machine's QR; click anywhere or Esc to close).
function zoomQr(token, label) {
  closeZoom();
  const el = document.createElement("div");
  el.className = "qr-zoom";
  el.dataset.close = "";
  el.innerHTML = `<div class="qr-zoom-box">${qrSvg(token, 10, 4)}</div>
    <b>${esc(label)}</b>
    <p>Scan with the Klean app. Tip: turn your screen brightness up and hold the phone about 30 cm away.</p>
    <p class="code">Or type this code in the app (Scan → Machine code):<br><code>${esc(token)}</code></p>
    <small>Click anywhere or press Esc to close</small>`;
  document.body.append(el);
}
function closeZoom() { document.querySelector(".qr-zoom")?.remove(); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeZoom(); });

const STATUS_TEXT = { available: "Available", paid_awaiting_start: "Paid: press Start", in_use: "In use", error: "Error" };

function minutesLeft(iso) {
  if (!iso) return "";
  const ms = new Date(iso) - Date.now();
  return ms > 0 ? `${Math.ceil(ms / 60000)} min left (real time)` : "finishing…";
}

// ---------------------------------------------------------------------------------------------------------------------
// Views
function render() {
  $("signOutBtn").hidden = !S.session;
  $("hardwareBtn").hidden = !S.session || !local.operatorId;
  $("who").innerHTML = (S.account?.display_name ? `· ${esc(S.account.display_name)}` : "")
    + (S.session && local.operatorId && S.view === "floor" ? ` <span class="mode ${S.isBeta ? "real" : ""}" style="margin-left:6px">${S.isBeta ? "Beta" : "Live"}</span>` : "");
  const pick = $("operatorPick");
  pick.hidden = S.operators.length < 2;
  pick.innerHTML = S.operators.map((o) => `<option value="${o.operator_id}" ${o.operator_id === local.operatorId ? "selected" : ""}>${esc(o.operator_name)}</option>`).join("");
  ({ loading: renderLoading, signin: renderSignIn, notready: renderNotReady, wizard: renderWizard, floor: renderFloor, hardware: renderHardware })[S.view]();
}

function renderLoading() { $("app").innerHTML = `<div class="card narrow"><p>Loading…</p></div>`; }

function renderSignIn() {
  $("app").innerHTML = `<div class="card narrow">
    <p style="margin:0 0 4px;color:var(--brand);font-weight:700">Keep it simple. Keep it Klean.</p>
    <h2>Your laundromat, live</h2>
    <p>Klean HQ shows every washer and dryer at your branches with its QR code and status light. Use it with real machines,
       or let it <b>simulate</b> them so you can try Klean end to end before any hardware is installed.</p>
    <div class="note warn"><b>Before you sign in:</b> Klean is one person, one account. In the Klean app, open
      <b>Account → Sign-in methods</b> and link GitHub or Google first. Signing in here with a method that isn't linked
      creates a second, unverified account.</div>
    <p class="row" style="margin-top:16px"><button class="primary" data-signin="github">Sign in with GitHub</button>
      <button class="ghost" data-signin="google">Sign in with Google</button></p>
    ${S.error ? `<p class="err">${esc(S.error)}</p>` : ""}
  </div>`;
}

function renderNotReady() {
  const verified = S.account?.verified;
  $("app").innerHTML = `<div class="card narrow">
    <h2>${verified ? "Create your business first" : "This account isn't verified"}</h2>
    <p>${verified
      ? "Klean HQ is for Super Admins. In the Klean app: <b>Account → Start a laundromat business</b>, then come back and reload."
      : "You may have signed in with a method that isn't linked to your verified Klean account, which created a new one. Sign out, link this method in the Klean app (Account → Sign-in methods), then sign in again. You can delete the extra account from Account in the app."}</p>
    <button class="ghost" data-do="reload">Reload</button>
  </div>`;
}

let wizardFor = null; // null = new location, or a branch id to add machines to
function renderWizard() {
  const branch = S.branches.find((b) => b.id === wizardFor);
  $("app").innerHTML = `<div class="card narrow">
    <h2>${branch ? `Add machines to ${esc(branch.name)}` : S.branches.length ? "Add a location" : "Set up your laundromat"}</h2>
    <p>${branch ? "How many more washers and dryers?" : "Tell us about this location. Each washer and dryer gets its own QR code and status light."}</p>
    ${branch ? "" : `<label class="field">Location name<input id="wName" placeholder="e.g. Makati Ave" maxlength="60"></label>
                     <label class="field">Address (optional)<input id="wAddr" placeholder="Street, city"></label>`}
    <div class="row">
      <label class="field">Washers<input id="wWash" type="number" min="0" max="40" value="${branch ? 0 : 4}"></label>
      <label class="field">Dryers<input id="wDry" type="number" min="0" max="40" value="${branch ? 0 : 4}"></label>
    </div>
    <div class="row">
      <label class="field">Wash cycle (minutes)<input id="wWashMin" type="number" min="5" max="180" value="35"></label>
      <label class="field">Dry cycle (minutes)<input id="wDryMin" type="number" min="5" max="180" value="40"></label>
    </div>
    <label class="field">These machines are
      <select id="wMode">
        <option value="sim">Simulated: no hardware yet, play them in this browser</option>
        <option value="real">Real: I have (or will install) Klean controllers</option>
      </select></label>
    <p class="row"><button class="primary" id="wGo" data-do="wizard-run">${branch ? "Add machines" : "Create location"}</button>
      ${S.branches.length ? `<button class="ghost" data-go="floor">Cancel</button>` : ""}</p>
    <p id="wMsg" class="err"></p>
  </div>`;
}

async function runWizard() {
  const n = (id) => Math.max(0, Math.min(40, parseInt($(id).value || "0", 10)));
  const washers = n("wWash"), dryers = n("wDry");
  const washMin = Math.max(5, Math.min(180, parseInt($("wWashMin").value, 10) || 35));
  const dryMin = Math.max(5, Math.min(180, parseInt($("wDryMin").value, 10) || 40));
  const mode = $("wMode").value;
  if (washers + dryers === 0) return ($("wMsg").textContent = "Add at least one machine.");
  $("wGo").disabled = true;
  try {
    let branchId = wizardFor;
    if (!branchId) {
      const name = $("wName").value.trim();
      if (name.length < 2) { $("wGo").disabled = false; return ($("wMsg").textContent = "Give the location a name."); }
      branchId = await rpc("create_branch", { operator: local.operatorId, name, address: $("wAddr").value.trim() || null });
    }
    const existing = S.machines[branchId] ?? [];
    const next = (prefix) => Math.max(0, ...existing.filter((m) => m.label.startsWith(prefix)).map((m) => parseInt(m.label.slice(1), 10) || 0)) + 1;
    const plan = [];
    for (let i = 0, s = next("W"); i < washers; i++) plan.push(["washer", `W${s + i}`, washMin]);
    for (let i = 0, s = next("D"); i < dryers; i++) plan.push(["dryer", `D${s + i}`, dryMin]);
    for (const [type, label, minutes] of plan) {
      $("wMsg").textContent = `Creating ${label}…`;
      const controllerId = `kln-${branchId.slice(0, 8)}-${label.toLowerCase()}`;
      const r = await rpc("register_machine", { branch: branchId, type, label, controller_id: controllerId, cycle_minutes: minutes });
      local.secrets[controllerId] = r.device_secret; // real machines: kept until the controller file is downloaded
      await rpc("set_machine_simulated", { machine: r.machine_id, simulated: mode === "sim" });
      save();
    }
    local.branchId = branchId;
    save();
    await loadBranches();
    S.view = "floor";
    render();
  } catch (e) { $("wMsg").textContent = e.message; $("wGo").disabled = false; }
}

function renderFloor() {
  if (S.view !== "floor") return;
  const branch = S.branches.find((b) => b.id === local.branchId);
  const machines = S.machines[local.branchId] ?? [];
  const sims = machines.filter((m) => modeOf(m) === "sim");
  // Washers on top, dryers below (TJ, 2026-10-17), each in label order (W2 before W10).
  const byLabel = (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true });
  const section = (type, title) => {
    const list = machines.filter((m) => m.type === type).sort(byLabel);
    return list.length ? `<h3 class="section">${title} <span>${list.length}</span></h3><div class="floor">${list.map(machineCard).join("")}</div>` : "";
  };
  const cards = section("washer", "Washers") + section("dryer", "Dryers");
  $("app").innerHTML = `
    <div class="tabs">${S.branches.map((b) => `<button class="${b.id === local.branchId ? "on" : ""}" data-branch="${b.id}">${esc(b.name)}</button>`).join("")}
      <button data-wizard="">+ Add location</button></div>
    <div class="toolbar">
      <div class="legend"><span><i class="dot" style="background:var(--green)"></i>Available</span><span><i class="dot" style="background:#fff"></i>Paid, waiting for Start</span>
        <span><i class="dot" style="background:var(--blue)"></i>In use</span><span><i class="dot" style="background:var(--red)"></i>Error</span></div>
      <span class="sp"></span>
      ${sims.length ? `<label>Simulation speed <select data-set="speed">${[1, 10, 60, 300].map((v) => `<option value="${v}" ${local.speed === v ? "selected" : ""}>${v}×</option>`).join("")}</select></label>
        <small style="max-width:360px;opacity:.75">Machines never start by themselves. After paying, the customer taps <b>Start wash</b> / <b>Start dry</b> in Klean, or you press <b>Press Start</b> here (the machine's own button).</small>` : ""}
      <button class="ghost" data-wizard="${local.branchId}">+ Add machines</button>
      <button class="ghost" data-do="print">Print QR stickers</button>
    </div>
    ${S.isBeta
      ? `<div class="note warn" style="margin-bottom:14px"><b>Beta testing is on.</b> Payments use test money (no real money moves) and this data can be deleted
         in the Klean app (Business → Setup → Beta testing). Going live needs real machines with Klean controllers.</div>`
      : `<div class="note" style="margin-bottom:14px"><b>Live.</b> Customers pay real money. Simulated machines are switched off.</div>`}
    ${S.error ? `<p class="err">${esc(S.error)}</p>` : ""}
    ${sims.length && S.isBeta ? `<div class="note" style="margin-bottom:14px">Simulated machines run while this page is open. Scan a QR code with the Klean app on your phone and pay with
       PayMongo test money: the machine's light turns white, then blue when it starts, then green when the cycle ends.</div>` : ""}
    ${cards || `<p>No machines here yet.</p>`}
    <div class="stickers">${[...machines].sort((a, b) => (a.type === b.type ? byLabel(a, b) : a.type === "washer" ? -1 : 1)).map((m) => `<div class="sticker"><b>${esc(m.label)}</b>${qrSvg(m.qr_token, 4, 4)}<span>Scan with the Klean app · ${esc(branch?.name ?? "")}</span></div>`).join("")}</div>`;
}

function machineCard(m) {
  const mode = modeOf(m);
  const sim = simOf(m);
  const seen = m.last_heartbeat_at ? Math.round((Date.now() - new Date(m.last_heartbeat_at)) / 1000) : null;
  let detail = m.status === "in_use" ? minutesLeft(m.cycle_ends_at) : m.status === "error" ? esc(m.error_reason ?? "") : "";
  if (mode === "sim" && sim.state === "RUNNING" && sim.endsAt) detail = `Simulated: ${Math.max(0, Math.ceil((sim.endsAt - Date.now()) / 1000))} s left at ${local.speed}×`;
  let actions = "";
  if (mode === "sim" && !S.isBeta) {
    actions = `<button class="ghost" data-act="real" data-cid="${m.controller_id}">Use real machine</button>`;
    detail = "Switched off: this business is live, and simulated machines can't take real payments.";
  } else if (mode === "sim") {   // M47: any device you're signed in on can play it; no key needed in this browser
    actions = [
      sim.state === "ARMED" ? `<button class="primary" data-act="start" data-cid="${m.controller_id}">Press Start</button>` : "",
      sim.state === "RUNNING" ? `<button class="ghost" data-act="finish" data-cid="${m.controller_id}">Finish now</button>` : "",
      m.status === "error" ? `<button class="ghost" data-act="clear" data-cid="${m.controller_id}">Clear error</button>`
                           : `<button class="ghost" data-act="fault" data-cid="${m.controller_id}">Fault</button>`,
      sim.plugged ? `<button class="ghost" data-act="unplug" data-cid="${m.controller_id}">Unplug</button>`
                  : `<button class="ghost" data-act="plug" data-cid="${m.controller_id}">Plug in</button>`,
      `<button class="ghost" data-act="real" data-cid="${m.controller_id}">Use real machine</button>`,
    ].join("");
    if (!sim.plugged) detail = "Unplugged: turns red within 90 s (no heartbeat).";
  } else {
    actions = [
      m.status === "error" ? `<button class="ghost" data-act="clear" data-cid="${m.controller_id}">Clear error</button>` : "",
      `<button class="ghost" data-go="hardware">Controller setup</button>`,
      `<button class="ghost" data-act="sim" data-cid="${m.controller_id}">Simulate instead</button>`,
    ].join("");
    if (!detail) detail = seen === null ? "Waiting for its controller to come online." : `Controller last seen ${seen < 120 ? seen + " s" : Math.round(seen / 60) + " min"} ago.`;
  }
  return `<div class="machine">
    <div class="mhead" style="${m.is_enabled ? "" : "opacity:.55"}"><b>${esc(m.label)}</b><span class="mode ${mode === "real" ? "real" : ""}">${mode === "real" ? "Real" : "Simulated"}</span>
      <span class="light ${m.status}" title="${STATUS_TEXT[m.status]}"></span></div>
    <div class="art">${machineArt(m, m.status)}</div>
    <div class="status">${STATUS_TEXT[m.status] ?? m.status}<small>${m.type === "washer" ? "Washer" : "Dryer"} · ${m.cycle_minutes} min cycle${detail ? " · " + detail : ""}</small></div>
    <div class="qr"><button class="qr-btn" data-zoom="${esc(m.qr_token)}" data-label="${esc(m.label)}" title="Show large to scan">${qrSvg(m.qr_token, 3, 2)}</button><small>Scan with the Klean app to pay and start ${esc(m.label)}. <b>Click the code to make it big.</b></small></div>
    <div class="actions">${actions}</div>
  </div>`;
}

function pickBranch(id) { local.branchId = id; save(); renderFloor(); }

// ---------------------------------------------------------------------------------------------------------------------
// Hardware: what to buy or build, how it connects, and the controller file for this location's real machines.
function renderHardware() {
  const branch = S.branches.find((b) => b.id === local.branchId);
  const real = (S.machines[local.branchId] ?? []).filter((m) => modeOf(m) === "real");
  const boxes = Math.max(1, Math.ceil(real.length / 4));
  $("app").innerHTML = `<div class="card">
    <p><button class="ghost" data-go="floor">← Back to the floor</button></p>
    <h2>Hardware for ${esc(branch?.name ?? "this location")}</h2>
    <p>A Klean controller sits next to each group of machines. It adds a credit by imitating coins on the machine's coin input,
      and watches the machine's power to tell Klean when a cycle starts and ends. Your machines keep working with coins too.</p>
    <div class="note warn"><b>Safety:</b> the controller only connects to the machine's <b>low-voltage coin signal</b>. Anything involving the
      220 V supply (the current sensors at the breaker panel) must be installed by a licensed electrician. Check your machine's warranty first.</div>

    <h3>This location needs</h3>
    <p>${real.length} real machine${real.length === 1 ? "" : "s"} → <b>${boxes} controller box${boxes === 1 ? "" : "es"}</b> (each box runs up to 4 machines)
      and <b>${real.length} current sensor${real.length === 1 ? "" : "s"}</b> (one per machine).</p>

    <h3>Option A: buy ready-made boards (easiest)</h3>
    <table><tr><th>Part</th><th>Per</th><th>Approx. price</th><th>Notes</th></tr>
      <tr><td>ESP32 4-channel relay board, 7–30 V DC input (e.g. LILYGO T-Relay or "ESP32-WROOM 4CH relay module")</td><td>4 machines</td><td>₱700–1,500</td><td>Wi-Fi built in; relays are isolated dry contacts</td></tr>
      <tr><td>12 V DC power adapter, 1 A</td><td>box</td><td>₱200–350</td><td>Or a 12/24 V DIN-rail supply in the panel</td></tr>
      <tr><td>AC current switch, split-core, adjustable (0.2–30 A, dry-contact output)</td><td>machine</td><td>₱500–1,200</td><td>Clamps around the machine's live wire; tells Klean "running"</td></tr>
      <tr><td>IP54 junction box, cable glands, 2-core 0.5 mm² signal cable</td><td>box</td><td>₱400–800</td><td>Keep away from water and heat</td></tr>
    </table>

    <h3>Option B: build it yourself (DIY)</h3>
    <table><tr><th>Part</th><th>Per</th><th>Approx. price</th><th>Notes</th></tr>
      <tr><td>ESP32 DevKit V1 (ESP32-WROOM-32)</td><td>box</td><td>₱250–450</td><td></td></tr>
      <tr><td>4-channel 5 V relay module, optocoupler-isolated</td><td>4 machines</td><td>₱150–300</td><td>Wire the relay's COM/NO across the coin signal</td></tr>
      <tr><td>DC-DC buck converter (12 V → 5 V, 2 A), or a 5 V 2 A USB supply</td><td>box</td><td>₱80–200</td><td></td></tr>
      <tr><td>AC current switch (as above) or SCT-013-030 clamp + comparator module</td><td>machine</td><td>₱300–1,200</td><td>The switch type is simpler: no calibration</td></tr>
      <tr><td>Enclosure, terminal blocks, jumper wires, 10 kΩ resistors</td><td>box</td><td>₱300–600</td><td></td></tr>
    </table>

    <h3>How it connects (per machine)</h3>
    <pre>
  Coin acceptor ──┬── COIN signal ──► machine control board
                  │
  Relay  NO ──────┘        (relay contact in parallel with the coin acceptor's output)
  Relay  COM ───────────── GND of the coin circuit
  Relay  IN  ◄──────────── ESP32 GPIO (one per machine)

  Current switch (clamped on the machine's LIVE wire at its breaker, by an electrician)
    output contact ──────── ESP32 GPIO input (internal pull-up) and GND
    </pre>
    <ol>
      <li>Find the coin acceptor's signal wire (often white, labelled COIN) and its ground. Set the acceptor to <b>pulse</b> mode.</li>
      <li>Count the coins the machine needs for one cycle (e.g. ₱10 coins × 6). That's the <b>pulses</b> setting below.</li>
      <li>Wire each relay across COIN and GND as shown. Pulsing the relay is exactly like dropping coins in.</li>
      <li>Have an electrician clamp a current switch around each machine's live wire and set it to trip when the motor runs.</li>
      <li>Download the controller file below, flash the Klean firmware (<code>firmware/klean-hub</code>) with the Arduino IDE, and power it up.</li>
      <li>Within a minute the machine's light on this page turns green. Test it: scan the machine's QR code in the Klean app and pay.
          The relay clicks once per coin, the light turns white, and blue once you press Start on the machine or tap Start wash in the app.
          Klean never starts a machine by itself.</li>
    </ol>

    <h3>Controller file</h3>
    ${real.length ? `<p>The file holds each machine's controller ID and a <b>fresh secret key</b>. Downloading it replaces the old keys, so any controller already
       installed for these machines must be re-flashed. Keep the file private and delete it after flashing.</p>
       <label class="field">Coins (pulses) per cycle<input id="hwPulses" type="number" min="1" max="50" value="1"></label>
       <label><input type="checkbox" id="hwCoinsStart"> These machines start as soon as coins go in (no Start button). Klean then holds the coins until the customer taps Start in the app, so they never start by themselves.</label>
       <button class="primary" data-do="config">Download controller file (klean_config.h)</button>`
     : `<p>No machine at this location is set to <b>Real</b> yet. On the floor, choose <b>Use real machine</b> on the machines that have controllers.</p>`}
    <p id="hwMsg" class="err"></p>
  </div>`;
}

async function downloadConfig() {
  const real = (S.machines[local.branchId] ?? []).filter((m) => modeOf(m) === "real");
  const pulses = Math.max(1, Math.min(50, parseInt($("hwPulses").value, 10) || 1));
  const coinsStartIt = $("hwCoinsStart").checked;
  const branch = S.branches.find((b) => b.id === local.branchId);
  try {
    const lines = [];
    for (const [i, m] of real.entries()) {
      const secret = await rpc("rotate_device_secret", { machine: m.id });
      const box = Math.floor(i / 4) + 1, channel = (i % 4) + 1;
      lines.push(`  // ${m.label} (${m.type}), box ${box} channel ${channel}\n  { "${m.label}", "${m.controller_id}", "${secret}", ${box}, ${channel}, ${pulses}, ${coinsStartIt} },`);
    }
    for (const m of real) delete local.secrets[m.controller_id]; // the controller holds them now
    save();
    const file = `// Klean controller file for ${branch?.name ?? "a location"}. Generated ${new Date().toISOString()} by Klean HQ.
// PRIVATE: these secret keys let a device act as your machines. Flash, then delete this file.
// Each box only runs the channels whose box number matches KLEAN_BOX_NUMBER in klean-hub.ino.
#pragma once
#define KLEAN_EVENTS_URL "${EVENTS_URL}"
#define KLEAN_WIFI_SSID "your-wifi-name"
#define KLEAN_WIFI_PASSWORD "your-wifi-password"

struct KleanMachine { const char* label; const char* controllerId; const char* secret; uint8_t box; uint8_t channel; uint8_t pulses; bool coinsStartIt; };
static const KleanMachine KLEAN_MACHINES[] = {
${lines.join("\n")}
};
`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/plain" }));
    a.download = "klean_config.h";
    a.click();
    $("hwMsg").textContent = "";
  } catch (e) { $("hwMsg").textContent = e.message; }
}

// ---------------------------------------------------------------------------------------------------------------------
// Sign-in and start-up
async function signIn(provider) {
  const { error } = await db.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
  if (error) { S.error = error.message; render(); }
}
$("signOutBtn").onclick = async () => { await db.auth.signOut(); location.reload(); };
$("hardwareBtn").onclick = () => { S.view = S.view === "hardware" ? "floor" : "hardware"; render(); };
$("operatorPick").onchange = async (e) => { local.operatorId = e.target.value; local.branchId = null; save(); await start(); };

let ticking = null;
async function start() {
  const { data } = await db.auth.getSession();
  S.session = data.session;
  if (!S.session) { S.view = "signin"; return render(); }
  try {
    await loadAccount();
    if (!S.account?.verified || !local.operatorId) { S.view = "notready"; return render(); }
    await loadBranches();
    S.view = S.branches.length ? "floor" : "wizard";
    render();
    if (!ticking) { ticking = setInterval(tick, TICK_MS); tick(); }
  } catch (e) { S.error = e.message; S.view = "signin"; render(); }
}
db.auth.onAuthStateChange((event) => { if (event === "SIGNED_IN" && !S.session) start(); });

// One listener for every button (no inline handlers, so the page can run under a strict Content Security Policy).
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act],[data-go],[data-wizard],[data-do],[data-signin],[data-branch],[data-zoom],[data-close]");
  if (!t) return;
  const d = t.dataset;
  if (d.close !== undefined) return closeZoom();
  if (d.zoom) return zoomQr(d.zoom, d.label ?? "");
  if (d.act) return act(d.cid, d.act);
  if (d.go) { S.view = d.go; return render(); }
  if (d.wizard !== undefined) { wizardFor = d.wizard || null; S.view = "wizard"; return render(); }
  if (d.signin) return signIn(d.signin);
  if (d.branch) return pickBranch(d.branch);
  ({ print: () => window.print(), "wizard-run": runWizard, reload: () => location.reload(), config: downloadConfig })[d.do]?.();
});
document.addEventListener("change", (e) => {
  const d = e.target.dataset ?? {};
  if (d.set === "speed") { local.speed = +e.target.value; save(); }
});
render();
start();
