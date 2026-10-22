// Car and motorcycle wash bay artwork (TJ approved, 2026-10-22). One source for Klean HQ, klean.ph (copied with HQ)
// and the apps (scripts/render_art.sh renders the layers to PNG). While a bay runs, the foam, bubbles and cloud roll
// through blue, green and white: give the <svg> the class "kb-on" (the keyframes are in hq.css and the site's style.css).
//
// KleanBayArt.svg(type, { running, size, layer }) → an <svg> string. type: "car_bay" | "moto_bay".
// layer (for the apps): "all" (default), "base" (the vehicle, which never changes colour), "edge" (the foam's outline),
// "suds" (car foam), "bubbles" (car bubbles; for motorcycles the cloud and bubbles), "sparkles" (motorcycle).
(function () {
  let n = 0;
  const OFF = { suds: "#eef6f5", edge: "#b7d3d1", carBubble: "#8fc3d3", cloud: "#6fd6f2", sparkle: "#ffffff" };

  // Foam circles [cx, cy, r, delay]: the back row first so the front suds cover it.
  const SUDS = [[50, 168, 11, 5], [75, 172, 11, 1], [101, 174, 11, 2], [127, 172, 11, 3], [152, 168, 11, 4],
    [22, 140, 10, 3], [178, 139, 11, 4], [38, 152, 16, 1], [62, 158, 17, 2], [88, 162, 16, 3], [114, 162, 17, 4],
    [140, 158, 16, 5], [163, 152, 16, 1], [68, 99, 9, 2], [81, 97, 7, 3], [136, 98, 8, 5]];
  const CAR_BUBBLES = [[52, 44, 10, 2], [80, 24, 6, 0], [150, 40, 12, 4], [124, 18, 5, 1], [28, 76, 5, 3]];

  function car(id, layer) {
    const want = (l) => layer === "all" || layer.split(",").includes(l);
    let s = "";
    if (want("bubbles")) {
      s += CAR_BUBBLES.map(([x, y, r, d]) => `<circle class="kb-line kb-d${d}" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${OFF.carBubble}" stroke-width="3"/>`).join("");
    }
    if (want("base")) {
      s += `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fc29f"/><stop offset="1" stop-color="#0d7a63"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f6ff"/><stop offset="1" stop-color="#8fd3ea"/></linearGradient></defs>
        <path d="M46 40 A7 7 0 0 1 52 37 M143 35 A8 8 0 0 1 150 31" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="33" y="96" width="16" height="10" rx="5" fill="#0b5c4b"/><rect x="151" y="96" width="16" height="10" rx="5" fill="#0b5c4b"/>
        <path d="M54 102 L66 70 Q70 60 81 60 H119 Q130 60 134 70 L146 102 Z" fill="url(#${id}b)"/>
        <path d="M64 100 L73 74 Q76 67 83 67 H117 Q124 67 127 74 L136 100 Z" fill="url(#${id}g)"/>
        <path d="M86 71 L77 96 M97 71 L90 90" stroke="#fff" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>
        <rect x="40" y="98" width="120" height="50" rx="16" fill="url(#${id}b)"/>
        <rect x="48" y="101" width="104" height="5" rx="2.5" fill="#fff" fill-opacity=".22"/>
        <ellipse cx="62" cy="117" rx="12" ry="8" fill="#fff6d1" stroke="#0b5c4b" stroke-width="3"/>
        <ellipse cx="138" cy="117" rx="12" ry="8" fill="#fff6d1" stroke="#0b5c4b" stroke-width="3"/>
        <rect x="82" y="110" width="36" height="16" rx="6" fill="#0b5c4b"/>
        <path d="M89 115 H111 M89 121 H111" stroke="#2fc29f" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="86" y="132" width="28" height="9" rx="3" fill="#fff"/>`;
    }
    // The outline is a slightly bigger copy of the suds underneath them, so only the outer edge shows.
    if (want("edge")) s += SUDS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="${OFF.edge}"/>`).join("");
    if (want("suds")) s += SUDS.map(([x, y, r, d]) => `<circle class="kb-fill kb-d${d}" cx="${x}" cy="${y}" r="${r}" fill="${OFF.suds}"/>`).join("");
    return s;
  }

  function moto(id, layer) {
    const want = (l) => layer === "all" || layer.split(",").includes(l);
    let s = `<defs><filter id="${id}f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="${id}n" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#1b2b52"/><stop offset="1" stop-color="#0c1430"/></radialGradient></defs>`;
    if (want("base")) {
      s += `<rect width="200" height="200" rx="36" fill="url(#${id}n)"/>
        <g fill="none" stroke="#ff5fae" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}f)">
          <circle cx="66" cy="150" r="15"/><circle cx="66" cy="150" r="3.5" fill="#ff5fae"/>
          <circle cx="140" cy="150" r="15"/><circle cx="140" cy="150" r="3.5" fill="#ff5fae"/>
          <path d="M46 142 C44 116 58 106 80 106 H104 C112 106 114 112 112 118 L108 130 H86 C80 130 78 134 78 138"/>
          <path d="M86 134 H120 L132 86"/><path d="M122 142 Q140 120 158 142"/>
          <path d="M120 84 H146"/><path d="M128 84 L124 70"/><path d="M141 90 q9 2 9 11"/>
          <path d="M72 104 Q74 94 86 94 H104 Q110 94 108 104 Z" fill="#ff5fae"/>
        </g>`;
    }
    if (want("bubbles")) {
      s += `<g fill="none" stroke="${OFF.cloud}" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}f)">
          <path class="kb-line kb-d1" stroke-width="5" d="M48 166 H38 A24 24 0 0 1 26 122 A28 28 0 0 1 62 82 A34 34 0 0 1 124 68 A30 30 0 0 1 172 100 A28 28 0 0 1 172 156 A14 14 0 0 1 160 166 H150"/>
          <circle class="kb-line kb-d2" cx="34" cy="46" r="10" stroke-width="4"/><circle class="kb-line" cx="164" cy="40" r="12" stroke-width="4"/>
          <circle class="kb-line kb-d4" cx="184" cy="122" r="6" stroke-width="4"/><circle class="kb-line kb-d3" cx="15" cy="100" r="6" stroke-width="4"/>
        </g>`;
    }
    if (want("sparkles")) {
      s += `<g fill="${OFF.sparkle}"><path class="kb-fill kb-d3" d="M100 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/>
          <path class="kb-fill kb-d5" d="M146 78 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path class="kb-fill kb-d1" d="M52 62 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z"/></g>`;
    }
    return s;
  }

  function svg(type, { running = false, size = 120, layer = "all", label = "" } = {}) {
    const id = `kb${++n}`;
    const name = label || (type === "moto_bay" ? "Motorcycle wash bay" : "Car wash bay");
    return `<svg class="kb-art${running ? " kb-on" : ""}" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${name}${running ? ", running" : ""}">`
      + (type === "moto_bay" ? moto(id, layer) : car(id, layer)) + `</svg>`;
  }

  globalThis.KleanBayArt = { svg, OFF };
})();
