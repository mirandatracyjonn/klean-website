// Find a laundromat: live laundromats on Klean, with machines free right now, on a map (M45).
import { branchCard, el, money, rpc } from "./site.js";

const list = document.getElementById("results");
const form = document.getElementById("search-form");
const input = document.getElementById("search");
const nearMe = document.getElementById("near-me");
const mapBox = document.getElementById("map");
let map, layer;

// Leaflet (self-hosted, vendor/leaflet-1.9.4) is a classic script, so it's added here rather than as a module.
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/vendor/leaflet-1.9.4/leaflet.css";
  document.head.append(css);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/vendor/leaflet-1.9.4/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.append(s);
  });
}

async function draw(rows, here) {
  const L = await loadLeaflet().catch(() => null);
  if (!L) { mapBox.hidden = true; return; }
  if (!map) {
    map = L.map(mapBox, { scrollWheelZoom: false }).setView([14.5995, 120.9842], 11); // Metro Manila
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "" }).addTo(map);
  }
  if (layer) layer.remove();
  layer = L.layerGroup().addTo(map);
  const points = [];
  for (const b of rows.filter((r) => r.latitude != null && r.longitude != null)) {
    const icon = L.divIcon({ className: "find-pin" + (b.washers_free > 0 ? "" : " none"), html: "", iconSize: [18, 18] });
    const popup = el("div", {},
      el("strong", { text: b.operator_name }), el("br"), b.name, el("br"),
      `${b.washers_free}/${b.washers} washers · ${b.dryers_free}/${b.dryers} dryers free`, el("br"),
      `${money(b.price_per_load_minor, b.currency)} per load`, el("br"),
      el("a", { href: `/b/${b.id}`, text: "Details" }));
    L.marker([b.latitude, b.longitude], { icon, title: b.operator_name }).bindPopup(popup).addTo(layer);
    points.push([b.latitude, b.longitude]);
  }
  if (here) {
    L.circleMarker([here.latitude, here.longitude], { radius: 7, color: "#1d4ed8", fillOpacity: 0.8 }).bindTooltip("You").addTo(layer);
    points.push([here.latitude, here.longitude]);
  }
  if (points.length === 1) map.setView(points[0], 14);
  else if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
}

function show(rows, search) {
  if (!rows.length) {
    list.replaceChildren(el("div", { class: "card empty" },
      el("h3", { text: search ? "No laundromats match that" : "Klean is launching soon" }),
      el("p", { text: search ? "Try a city, street or laundromat name." : "The first Klean laundromats open in Metro Manila. Own a laundromat? Try Klean free in Beta." }),
      search ? null : el("a", { class: "btn btn-brand", href: "/owners.html", text: "Bring Klean to your laundromat" })));
    return;
  }
  list.replaceChildren(el("div", { class: "grid" }, rows.map((b) => {
    const card = branchCard(b);
    if (b.distance_km != null) {
      const km = b.distance_km < 1 ? `${Math.round(b.distance_km * 1000)} m away` : `${b.distance_km.toFixed(1)} km away`;
      card.querySelector("h3")?.after(el("div", { class: "meta find-distance", text: km }));
    }
    return card;
  })));
}

async function load(search = "", here = null) {
  list.replaceChildren(el("p", { class: "empty", text: "Looking for laundromats…" }));
  try {
    const rows = search
      ? await rpc("public_branches", { search, max_rows: 40 })
      : await rpc("nearby_branches", here ? { latitude: here.latitude, longitude: here.longitude, max_rows: 40 } : { max_rows: 40 });
    show(rows, search);
    draw(rows, here);
  } catch (error) {
    list.replaceChildren(el("p", { class: "empty", text: error.message }));
  }
}

form.addEventListener("submit", (e) => { e.preventDefault(); load(input.value.trim()); });
nearMe.addEventListener("click", () => {
  if (!navigator.geolocation) return load();
  nearMe.disabled = true;
  nearMe.textContent = "Locating…";
  // Your position only sorts the list; Klean doesn't store it.
  navigator.geolocation.getCurrentPosition(
    (p) => { nearMe.disabled = false; nearMe.textContent = "📍 Near me"; input.value = ""; load("", p.coords); },
    () => { nearMe.disabled = false; nearMe.textContent = "📍 Near me"; load(); },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
});
load();
