// klean.ph/beta.html (M62, 2026-10-19, like Geerho's): invited testers see their role cards and check off each task as
// Done, Problem, or Blocked (time-stamped, sent to Klean). The Platform Owner sees every tester and check-off, confirms
// or reopens each one, adds testers by member code, and assigns roles. Signed-in members only.
import { SUPABASE_URL, SUPABASE_KEY, el } from "./site.js";

const main = document.getElementById("beta");
const when = (iso) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const STATUS = { done: ["Done", "ok"], problem: ["Problem", "bad"], blocked: ["Blocked", "warn"] };
const PLATFORM = { iphone: "iPhone", android: "Android", web: "Web" };
const guessPlatform = () => (/iPhone|iPad/.test(navigator.userAgent) ? "iphone" : /Android/.test(navigator.userAgent) ? "android" : "web");
const state = { tab: "tasks", filter: "review" };
let db;

const tag = document.createElement("script");
tag.src = "/hq/vendor/supabase-js-2.117.2.js";
tag.onload = () => {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: "pkce", persistSession: true } });
  render();
};
tag.onerror = () => main.replaceChildren(el("p", { class: "meta", text: "Couldn't load Klean. Check your connection and reload." }));
document.head.append(tag);

const errorLine = (text) => el("p", { class: "acct-error", role: "alert", text });
const message = (error) => error?.message ?? "Something went wrong. Please try again.";

function paragraphs(text) {
  const box = el("div", { class: "beta-guide-body" });
  let list = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) { list = null; continue; }
    if (line.startsWith("|")) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      let table = box.lastElementChild?.tagName === "TABLE" ? box.lastElementChild : null;
      if (!table) { table = el("table", { class: "beta-table" }); box.append(table); }
      table.append(el("tr", {}, cells.map((c) => el(table.rows.length ? "td" : "th", {}, ...strong(c)))));
      continue;
    }
    const bullet = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (bullet) {
      if (!list) { list = el(/^\d/.test(line) ? "ol" : "ul"); box.append(list); }
      list.append(el("li", {}, ...strong(bullet[1])));
    } else if (raw.startsWith("  ") && list?.lastElementChild) {
      list.lastElementChild.append(" ", ...strong(line));
    } else {
      list = null;
      box.append(el("p", {}, ...strong(line)));
    }
  }
  return box;
}
function strong(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part) => (part.startsWith("**") ? el("strong", { text: part.slice(2, -2) }) : part));
}
function chip(latest) {
  if (!latest) return el("span", { class: "beta-chip", text: "Not started" });
  const [label, tone] = STATUS[latest.status];
  return el("span", { class: `beta-chip ${tone}`, text: `${label} · ${when(latest.submitted_at)}` });
}
function reviewLine(latest) {
  if (!latest) return null;
  if (!latest.review) return el("small", { class: "meta", text: "Waiting for Klean to confirm" });
  return el("small", { class: `beta-review ${latest.review === "confirmed" ? "ok" : "bad"}`,
    text: `${latest.review === "confirmed" ? "Confirmed" : "Reopened"} ${when(latest.reviewed_at)}${latest.review_note ? ` · “${latest.review_note}”` : ""}` });
}

// --- Check off a task ----------------------------------------------------------------------------------------------

function checkOff(task, status) {
  return new Promise((resolve) => {
    const platform = el("select", { "aria-label": "Platform" },
      Object.entries(PLATFORM).map(([v, n]) => el("option", { value: v, selected: v === guessPlatform(), text: n })));
    const build = el("input", { type: "text", maxlength: "40", placeholder: "Build (Account shows it)", "aria-label": "Build" });
    const note = el("textarea", { maxlength: "2000", rows: "4", placeholder: status === "done" ? "Anything to add? (optional)"
      : status === "problem" ? "What did you do, what did you expect, and what happened? Your phone model helps." : "What are you waiting for?" });
    const error = errorLine(""); error.hidden = true;
    const ok = el("button", { type: "button", class: "btn btn-brand", text: status === "done" ? "Mark Done" : status === "problem" ? "Report Problem" : "Mark Blocked" });
    const cancel = el("button", { type: "button", class: "btn btn-outline", text: "Cancel" });
    const dialog = el("dialog", { class: "beta-dialog" }, el("h2", { text: STATUS[status][0] }), el("p", { class: "meta", text: task.step }),
      el("label", { class: "acct-field" }, "Platform ", platform), el("label", { class: "acct-field" }, "Build ", build),
      el("label", { class: "acct-field" }, status === "done" ? "Note" : "What happened", note), error, el("div", { class: "btn-row" }, cancel, ok));
    document.body.append(dialog);
    const close = (value) => { dialog.close(); dialog.remove(); resolve(value); };
    cancel.addEventListener("click", () => close(false));
    ok.addEventListener("click", async () => {
      error.hidden = true; ok.disabled = true;
      const { error: e } = await db.rpc("beta_submit", { task: task.id, status, note: note.value.trim() || null,
        platform: platform.value, build: build.value.trim() || null });
      if (e) { ok.disabled = false; error.textContent = message(e); error.hidden = false; return; }
      close(true);
    });
    dialog.showModal();
  });
}

function roleCard(role) {
  const done = role.tasks.filter((t) => t.latest?.status === "done").length;
  return el("details", { class: "beta-role card", open: role.mine || undefined },
    el("summary", {}, el("strong", { text: `Role ${role.code} · ${role.title}` }), " ",
      el("span", { class: "meta", text: `${[role.platforms, role.days ? `Days ${role.days}` : null].filter(Boolean).join(" · ")} · ${done}/${role.tasks.length} done` })),
    el("div", { class: "beta-bar" }, el("div", { style: `width:${Math.round((done / role.tasks.length) * 100)}%` })),
    el("ol", { class: "beta-tasks" }, role.tasks.map((t) => {
      const buttons = ["done", "problem", "blocked"].map((s) => {
        const b = el("button", { type: "button", class: s === "done" ? "btn btn-brand" : "btn btn-outline", text: STATUS[s][0] });
        b.addEventListener("click", async () => { if (await checkOff(t, s)) render(); });
        return b;
      });
      return el("li", { class: "beta-task" },
        el("strong", { text: t.step }), t.expected ? el("small", { class: "meta", text: `Should happen: ${t.expected}` }) : null,
        el("div", {}, chip(t.latest), " ", reviewLine(t.latest)),
        t.latest?.note ? el("small", { class: "meta", text: `Your note: ${t.latest.note}` }) : null,
        el("div", { class: "btn-row" }, buttons));
    })));
}

// --- Platform Owner view -------------------------------------------------------------------------------------------

async function adminView(container, page) {
  const { data: o, error } = await db.rpc("beta_admin_overview");
  if (error) { container.replaceChildren(errorLine(message(error))); return; }
  const code = el("input", { type: "text", placeholder: "Member code, e.g. KLN-7H3K-Q9MP", "aria-label": "Member code" });
  const add = el("button", { type: "button", class: "btn btn-brand", text: "Add Tester" });
  const addError = errorLine(""); addError.hidden = true;
  add.addEventListener("click", async () => {
    addError.hidden = true;
    const { error: e } = await db.rpc("beta_add_tester", { member_code: code.value.trim() });
    if (e) { addError.textContent = message(e); addError.hidden = false; return; }
    render();
  });
  const testers = (o.testers ?? []).map((t) => {
    const roles = el("div", { class: "beta-roles-pick" }, page.roles.map((r) => {
      const box = el("input", { type: "checkbox", checked: t.roles.includes(r.code) || undefined });
      box.addEventListener("change", async () => {
        const { error: e } = await db.rpc("beta_assign", { member: t.user_id, role: r.code, assigned: box.checked });
        if (e) { box.checked = !box.checked; window.alert(message(e)); }
      });
      return el("label", { title: r.title }, box, ` ${r.code}`);
    }));
    const remove = el("button", { type: "button", class: "btn btn-outline", text: "Remove" });
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Remove ${t.display_name || t.member_code} from Beta Testing? Their check-offs stay.`)) return;
      await db.rpc("beta_remove_tester", { member: t.user_id });
      render();
    });
    return el("div", { class: "card beta-tester" },
      el("strong", { text: t.display_name || t.member_code }),
      el("p", { class: "meta", text: `${t.member_code}${t.verified ? " · Verified" : " · Not verified yet"} · ${t.done}/${t.tasks} done`
        + `${t.open_problems ? ` · ${t.open_problems} open problems` : ""}${t.last_activity ? ` · last ${when(t.last_activity)}` : ""}` }),
      el("small", { class: "meta", text: "Roles:" }), roles, el("div", { class: "btn-row" }, remove));
  });
  const filters = el("div", { class: "btn-row" }, [["review", "Needs Review"], ["problems", "Problems"], ["all", "All"]].map(([v, label]) => {
    const b = el("button", { type: "button", class: state.filter === v ? "btn btn-brand" : "btn btn-outline", text: label });
    b.addEventListener("click", () => { state.filter = v; render(); });
    return b;
  }));
  const shown = (o.results ?? []).filter((r) => (state.filter === "review" ? !r.review : state.filter === "problems" ? r.status !== "done" : true));
  const results = shown.length ? shown.map((r) => {
    const [label, tone] = STATUS[r.status];
    const decide = async (decision) => {
      const note = window.prompt(decision === "confirmed" ? "Note for the tester (optional)" : "Tell the tester what to do again", "");
      if (note === null) return;
      const { error: e } = await db.rpc("beta_review", { result: r.id, decision, note: note.trim() || null });
      if (e) { window.alert(message(e)); return; }
      render();
    };
    const confirm = el("button", { type: "button", class: "btn btn-brand", text: "Confirm" });
    const reopen = el("button", { type: "button", class: "btn btn-outline", text: "Reopen" });
    confirm.addEventListener("click", () => decide("confirmed"));
    reopen.addEventListener("click", () => decide("reopened"));
    return el("div", { class: "card beta-result" },
      el("div", {}, el("span", { class: `beta-chip ${tone}`, text: label }), " ", el("strong", { text: r.tester }),
        ` · Role ${r.role_code} · ${when(r.submitted_at)}${r.platform ? ` · ${PLATFORM[r.platform]}` : ""}${r.build ? ` · build ${r.build}` : ""}`),
      el("p", { text: r.step }), r.note ? el("p", { class: "meta", text: `“${r.note}”` }) : null,
      r.review ? el("small", { class: `beta-review ${r.review === "confirmed" ? "ok" : "bad"}`,
        text: `${r.review === "confirmed" ? "Confirmed" : "Reopened"} by ${r.reviewer ?? "Klean"} ${when(r.reviewed_at)}${r.review_note ? ` · “${r.review_note}”` : ""}` })
        : el("div", { class: "btn-row" }, confirm, reopen));
  }) : [el("p", { class: "meta", text: "Nothing here." })];
  const csv = el("button", { type: "button", class: "btn btn-outline", text: "Download as CSV" });
  csv.addEventListener("click", () => {
    const rows = [["submitted_at", "tester", "role", "task", "status", "platform", "build", "note", "review", "reviewed_at", "reviewer", "review_note"]]
      .concat((o.results ?? []).map((r) => [r.submitted_at, r.tester, r.role_code, r.step, r.status, r.platform, r.build, r.note, r.review, r.reviewed_at, r.reviewer, r.review_note]));
    const text = rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type: "text/csv" })), download: `klean-beta-results-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
  });
  container.replaceChildren(el("h2", { text: "Check-offs" }), filters, ...results, el("div", { class: "btn-row" }, csv),
    el("h2", { text: `Testers (${(o.testers ?? []).length})` }),
    el("div", { class: "card" }, el("div", { class: "btn-row" }, code, add), addError,
      el("small", { class: "meta", text: "Testers must verify their identity before checking off tasks." })),
    ...testers);
}

// --- Page ----------------------------------------------------------------------------------------------------------

async function render() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    main.replaceChildren(el("p", { text: "For invited Klean beta testers. Sign in with the account you test with." }),
      el("a", { class: "btn btn-brand", href: "/account.html", text: "Sign in" }));
    return;
  }
  const { data: page, error } = await db.rpc("beta_my_page");
  if (error) { main.replaceChildren(errorLine(message(error))); return; }
  const body = el("div", {});
  const tabs = page.is_admin ? el("div", { class: "btn-row" }, [["tasks", "Role Cards"], ["admin", "Testers & Check-offs"]].map(([v, label]) => {
    const b = el("button", { type: "button", class: state.tab === v ? "btn btn-brand" : "btn btn-outline", text: label });
    b.addEventListener("click", () => { state.tab = v; render(); });
    return b;
  })) : null;
  main.replaceChildren(...[
    page.verified ? null : el("div", { class: "card acct-beta" }, el("strong", { text: "Verify your identity first" }),
      el("p", { text: "Beta testers are verified members. " }, el("a", { href: "/account.html", text: "Verify on your account page" }), ".")),
    tabs, body].filter(Boolean));
  if (page.is_admin && state.tab === "admin") { body.replaceChildren(el("p", { class: "meta", text: "Loading…" })); await adminView(body, page); return; }
  const mine = page.roles.filter((r) => r.mine), others = page.roles.filter((r) => !r.mine);
  body.replaceChildren(...[
    el("h2", { text: "How it works" }),
    ...page.guide.map((g, i) => el("details", { class: "beta-guide", open: i === 0 || undefined }, el("summary", { text: g.title }), paragraphs(g.body))),
    el("h2", { text: mine.length ? "Your roles" : "No roles yet" }),
    mine.length ? null : el("p", { class: "meta", text: page.is_admin ? "Give yourself a role under Testers & Check-offs, or use any card below." : "Klean will assign your roles soon." }),
    ...mine.map(roleCard),
    others.length ? el("h2", { text: "All other roles" }) : null,
    ...others.map(roleCard),
  ].filter(Boolean));
}
