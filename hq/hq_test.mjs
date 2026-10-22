// Klean HQ simulator tests (TJ, 2026-10-21: Start wash needed several taps, three times). Runs the real hq.js in Node
// with a fake Klean server (machine-events + machine_setup), then replays what happened on TJ's phone.
//   node --test hq/hq_test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("./hq.js", import.meta.url), "utf8");

/** A fake Klean: machines with a server-side status, commands waiting for a poll, and every event the simulator sent. */
function fakeKlean() {
  const server = {
    machines: [{ id: "m1", label: "W1", controller_id: "ctrl-W1", type: "washer", is_simulated: true, is_enabled: true, cycle_minutes: 35, status: "available" }],
    queue: {},          // controller_id → commands waiting for the next poll
    sent: [],           // every event the simulator sent
    refuseStarted: 0,   // answer the next N "started" events with an error result
    calls: [],          // database functions the page called
    send(controller, command) { (this.queue[controller] ??= []).push(command); },
    status(label) { return this.machines.find((m) => m.label === label).status; },
  };
  const handle = (events) => {
    const results = [], commands = {};
    for (const e of events) {
      server.sent.push(e);
      const m = server.machines.find((x) => x.controller_id === e.controller_id);
      if (e.kind === "poll") { commands[e.controller_id] = server.queue[e.controller_id] ?? []; server.queue[e.controller_id] = []; results.push("ok"); continue; }
      if (e.kind === "ack") { m.status = "paid_awaiting_start"; m.activation = e.activation_id; results.push("ok"); continue; }
      if (e.kind === "started") {
        if (server.refuseStarted > 0) { server.refuseStarted--; results.push("unknown_activation"); continue; }
        if (m.status === "paid_awaiting_start" && m.activation === e.activation_id) { m.status = "in_use"; results.push("ok"); }
        else results.push(m.status === "in_use" ? "duplicate" : "unknown_activation");
        continue;
      }
      if (e.kind === "completed") { m.status = "available"; results.push("ok"); continue; }
      results.push("ok");
    }
    return { results, commands };
  };
  return { server, handle };
}

/** Loads hq.js with browser stand-ins; returns its functions and the fake server. */
function loadHQ(savedSim = {}) {
  const { server, handle } = fakeKlean();
  const element = () => ({ innerHTML: "", value: "", style: {}, addEventListener() {}, set onclick(_) {}, set onchange(_) {} });
  const storage = new Map([["klean-floor-v1", JSON.stringify({ branchId: "b1", operatorId: "op1", sim: savedSim, speed: 60 })]]);
  const context = {
    console, Date, JSON, Math, Promise, Object, Array, String, Number, Set, Map, Error, URLSearchParams, setTimeout, clearTimeout,
    setInterval: () => 0, clearInterval: () => {},
    document: { getElementById: element, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], activeElement: null },
    location: { origin: "http://localhost:8787", pathname: "/", reload() {} },
    window: {},
    localStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) },
    supabase: { createClient: () => ({
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange() {}, signOut: async () => {} },
      rpc: async (name) => { server.calls.push(name); return name === "machine_setup" ? { data: server.machines.map((m) => ({ ...m })), error: null } : { data: "reset", error: null }; },
    }) },
    fetch: async (_url, { body }) => ({ ok: true, status: 200, json: async () => handle(JSON.parse(body)) }),
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(SOURCE, context);
  // Drawing the page isn't under test.
  for (const name of ["render", "renderFloor", "renderLoading"]) context[name] = () => {};
  const tick = () => vm.runInContext("tickOnce()", context);
  const state = () => vm.runInContext("({ sim: local.sim, error: S.error })", context);
  const act = (cid, what) => vm.runInContext(`act(${JSON.stringify(cid)}, ${JSON.stringify(what)})`, context);
  return { server, tick, state, act };
}

test("Start on the first tap after a payment", async () => {
  const hq = loadHQ();
  await hq.tick();                                   // loads the machines
  hq.server.send("ctrl-W1", { type: "CREDIT", activation_id: "a1", cycle_minutes: 35 });
  await hq.tick();                                   // armed and acknowledged
  assert.equal(hq.server.status("W1"), "paid_awaiting_start");
  hq.server.send("ctrl-W1", { type: "START", activation_id: "a1" });
  await hq.tick();
  assert.equal(hq.server.status("W1"), "in_use");
});

test("W1 on 2026-10-21: this copy still thinks the washer is running, Klean says it's paid and waiting", async () => {
  // Another copy took the payment (CREDIT); this one remembers an old cycle as still running.
  const hq = loadHQ({ "ctrl-W1": { state: "RUNNING", activation: "old", endsAt: Date.now() + 3600_000, plugged: true } });
  Object.assign(hq.server.machines[0], { status: "paid_awaiting_start", activation: "a2" });
  await hq.tick();                                   // loads the machines (W1 paid and waiting)
  hq.server.send("ctrl-W1", { type: "START", activation_id: "a2" });
  await hq.tick();
  assert.equal(hq.server.status("W1"), "in_use", "starts on the first tap");
});

test("If Klean refuses the start report, the machine stays armed and the next tap starts it", async () => {
  const hq = loadHQ();
  await hq.tick();
  hq.server.send("ctrl-W1", { type: "CREDIT", activation_id: "a3", cycle_minutes: 35 });
  await hq.tick();
  hq.server.refuseStarted = 1;
  hq.server.send("ctrl-W1", { type: "START", activation_id: "a3" });
  await hq.tick();
  assert.equal(hq.server.status("W1"), "paid_awaiting_start");
  assert.match(hq.state().error ?? "", /didn't start/, "the page says why");
  assert.equal(hq.state().sim["ctrl-W1"].state, "ARMED", "still armed, not stuck as running");
  hq.server.send("ctrl-W1", { type: "START", activation_id: "a3" });
  await hq.tick();
  assert.equal(hq.server.status("W1"), "in_use");
});

test("Reset puts a stuck simulated machine back to idle (M86)", async () => {
  const hq = loadHQ({ "ctrl-W1": { state: "RUNNING", activation: "old", endsAt: Date.now() + 3600_000, plugged: true } });
  await hq.tick();
  await hq.act("ctrl-W1", "reset");
  assert.equal(hq.state().sim["ctrl-W1"].state, "IDLE");
  assert.equal(hq.state().sim["ctrl-W1"].activation, null);
  assert.ok(hq.server.calls.includes("reset_simulated_machine"), "asked Klean to reset W1");
});

test("Add time: EXTEND adds the paid minutes to a running bay (M88)", async () => {
  const hq = loadHQ();
  hq.server.machines[0] = { ...hq.server.machines[0], label: "B1", type: "car_bay", cycle_minutes: 5 };
  await hq.tick();
  hq.server.send("ctrl-W1", { type: "CREDIT", activation_id: "b1", cycle_minutes: 10 });
  await hq.tick();
  hq.server.send("ctrl-W1", { type: "START", activation_id: "b1" });
  await hq.tick();
  assert.equal(hq.server.status("B1"), "in_use");
  const before = hq.state().sim["ctrl-W1"].endsAt;
  hq.server.send("ctrl-W1", { type: "EXTEND", activation_id: "b1", minutes: 5 });
  await hq.tick();
  const after = hq.state().sim["ctrl-W1"].endsAt;
  assert.ok(after - before >= (5 * 60000) / 60 - 50, `5 minutes added at 60x speed (got ${after - before} ms)`);
});

test("Bay artwork (TJ, 2026-10-22): the car and motorcycle bays, and only a running bay animates", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./bay-art.js", import.meta.url), "utf8"), context);
  const art = context.KleanBayArt;
  const carOff = art.svg("car_bay"), carOn = art.svg("car_bay", { running: true }), moto = art.svg("moto_bay", { running: true });
  assert.match(carOff, /^<svg class="kb-art" /);
  assert.match(carOn, /class="kb-art kb-on"/);
  assert.match(carOn, /kb-fill/, "car foam changes colour");
  assert.match(moto, /Motorcycle wash bay, running/);
  assert.match(moto, /#ff5fae/, "the pink scooter");
  assert.doesNotMatch(art.svg("car_bay", { layer: "suds" }), /url\(#/, "the suds layer is plain shapes the apps can tint");
  const ids = [...(art.svg("car_bay") + art.svg("car_bay")).matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "two bays on one page don't share gradient ids");
});
