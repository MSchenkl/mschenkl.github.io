// Datennetz-Hero: ein Knotennetz driftet, verdichtet sich zum Monogramm "MS"
// und löst sich wieder auf. Alle Bewegung ist eine periodische Funktion des
// Fortschritts p (0..1), daher läuft der Film nahtlos als Schleife.
(function () {
  const root = document.querySelector("[data-composition-id]");
  const W = +root.dataset.width;
  const H = +root.dataset.height;
  const DUR = +root.dataset.duration;
  const portrait = H > W;
  const TAU = Math.PI * 2;

  // Seeded PRNG (mulberry32) – deterministisch
  let seed = 20261018;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const svg = document.getElementById("net");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  };

  // --- Monogramm-Zielpunkte -------------------------------------------------
  // Box 600x400; M als Polylinie, S als Bézierpfad
  const glyphs = [
    "M0,400 L0,0 L150,230 L300,0 L300,400",
    "M600,62 C560,-4 378,-6 376,100 C374,206 600,186 600,298 C600,414 402,420 360,328",
  ];
  const scratch = el("g", { opacity: 0 }, svg);
  const paths = glyphs.map((d) => el("path", { d }, scratch));
  const lens = paths.map((p) => p.getTotalLength());
  const totalLen = lens.reduce((a, b) => a + b, 0);
  const LETTER_PTS = 78;
  const scale = portrait ? 0.85 : 1.15;
  const cx = portrait ? W / 2 : W * 0.7;
  const cy = portrait ? H * 0.2 : H * 0.5;
  const targets = [];
  const strokes = []; // aufeinanderfolgende Punkte eines Glyphs -> Linie
  paths.forEach((p, gi) => {
    const n = Math.round((LETTER_PTS * lens[gi]) / totalLen);
    for (let i = 0; i < n; i++) {
      const pt = p.getPointAtLength((lens[gi] * i) / (n - 1));
      if (i > 0) strokes.push([targets.length - 1, targets.length]);
      targets.push({ x: cx + (pt.x - 300) * scale, y: cy + (pt.y - 200) * scale });
    }
  });
  scratch.remove();

  // --- Knoten ----------------------------------------------------------------
  const AMBIENT = portrait ? 46 : 52;
  const N = targets.length + AMBIENT;
  const palette = ["#4da3ff", "#33e0c0", "#4da3ff", "#33e0c0", "#ffb454"];
  const nodes = [];
  for (let i = 0; i < N; i++) {
    nodes.push({
      bx: 60 + rnd() * (W - 120),
      by: 60 + rnd() * (H - 120),
      r: 18 + rnd() * 46, // Driftradius
      m: 1 + Math.floor(rnd() * 2), // ganzzahlige Frequenz -> nahtlos
      ph: rnd() * TAU,
      size: 2 + rnd() * 3.2,
      color: palette[Math.floor(rnd() * palette.length)],
      target: targets[i] || null,
      delay: rnd() * 0.08, // gestaffeltes Andocken
    });
  }

  // Kanten: je Knoten die 3 nächsten Nachbarn in der Ausgangslage
  const edgeSet = new Set();
  const edges = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: Math.hypot(a.bx - b.bx, a.by - b.by) }))
      .filter((o) => o.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 3)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edgeSet.has(key)) { edgeSet.add(key); edges.push([i, j]); }
      });
  });

  const gEdges = el("g", { stroke: "#4da3ff", "stroke-width": 1 }, svg);
  const gStrokes = el("g", { stroke: "url(#gradStroke)", "stroke-width": 2.4, "stroke-linecap": "round", filter: "url(#glow)" }, svg);
  const gPulses = el("g", { filter: "url(#glow)" }, svg);
  const gNodes = el("g", { filter: "url(#glow)" }, svg);

  const edgeEls = edges.map(() => el("line", {}, gEdges));
  const strokeEls = strokes.map(() => el("line", {}, gStrokes));
  const nodeEls = nodes.map((n) => el("circle", { r: n.size, fill: n.color }, gNodes));

  // Datenpakete, die entlang von Kanten wandern
  const pulses = [];
  for (let k = 0; k < 26; k++) {
    pulses.push({
      edge: Math.floor(rnd() * edges.length),
      speed: 2 + Math.floor(rnd() * 3), // ganze Umläufe pro Schleife
      off: rnd(),
      color: rnd() < 0.7 ? "#33e0c0" : "#ffb454",
    });
  }
  const pulseEls = pulses.map((p) => el("circle", { r: 3, fill: p.color }, gPulses));

  // --- Zeitverlauf -------------------------------------------------------------
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10));
  // Formfaktor: 0 = Netz, 1 = Monogramm. Bei p=0 und p=1 identisch 0.
  const formAt = (p, delay) => {
    if (p < 0.28 + delay) return 0;
    if (p < 0.46 + delay) return smooth((p - 0.28 - delay) / 0.18);
    if (p < 0.72) return 1;
    if (p < 0.9) return 1 - smooth((p - 0.72) / 0.18);
    return 0;
  };

  const pos = nodes.map(() => ({ x: 0, y: 0 }));
  const fs = nodes.map(() => 0);
  const cam = document.getElementById("cam");
  const halo = document.getElementById("halo");
  const sweep = document.getElementById("sweep");

  function draw(p) {
    const a = TAU * p;
    nodes.forEach((n, i) => {
      const dx = n.bx + Math.cos(n.m * a + n.ph) * n.r;
      const dy = n.by + Math.sin(n.m * a + n.ph) * n.r * 0.7;
      let x = dx, y = dy;
      if (n.target) {
        const f = formAt(p, n.delay);
        fs[i] = f;
        // leichtes Atmen im Monogramm
        const tx = n.target.x + Math.cos(a * 3 + n.ph) * 2.5;
        const ty = n.target.y + Math.sin(a * 3 + n.ph) * 2.5;
        x = dx + (tx - dx) * f;
        y = dy + (ty - dy) * f;
        nodeEls[i].setAttribute("r", n.size * (1 + 0.35 * f));
      }
      pos[i].x = x; pos[i].y = y;
      nodeEls[i].setAttribute("cx", x.toFixed(1));
      nodeEls[i].setAttribute("cy", y.toFixed(1));
    });

    const form = formAt(p, 0.04);
    edges.forEach(([i, j], k) => {
      const A = pos[i], B = pos[j];
      const d = Math.hypot(A.x - B.x, A.y - B.y);
      const o = Math.max(0, 1 - d / 260) * 0.42 * (1 - form * 0.75);
      const e = edgeEls[k];
      e.setAttribute("x1", A.x.toFixed(1)); e.setAttribute("y1", A.y.toFixed(1));
      e.setAttribute("x2", B.x.toFixed(1)); e.setAttribute("y2", B.y.toFixed(1));
      e.setAttribute("stroke-opacity", o.toFixed(3));
    });
    strokes.forEach(([i, j], k) => {
      const A = pos[i], B = pos[j];
      const e = strokeEls[k];
      e.setAttribute("x1", A.x.toFixed(1)); e.setAttribute("y1", A.y.toFixed(1));
      e.setAttribute("x2", B.x.toFixed(1)); e.setAttribute("y2", B.y.toFixed(1));
      // Linie "zeichnet" sich der Reihe nach entlang des Glyphs
      // erst sichtbar, wenn beide Endpunkte (fast) angedockt sind
      const docked = Math.pow(Math.min(fs[i], fs[j]), 6);
      const local = smooth(form * 1.6 - (k / strokes.length) * 0.6);
      e.setAttribute("stroke-opacity", (local * docked * 0.95).toFixed(3));
    });
    pulses.forEach((pl, k) => {
      const [i, j] = edges[pl.edge];
      const t = (p * pl.speed + pl.off) % 1;
      const A = pos[i], B = pos[j];
      const x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t;
      const fade = Math.sin(Math.PI * t) * (1 - form * 0.85);
      pulseEls[k].setAttribute("cx", x.toFixed(1));
      pulseEls[k].setAttribute("cy", y.toFixed(1));
      pulseEls[k].setAttribute("opacity", fade.toFixed(3));
    });

    // Kamera: langsames, periodisches Schweben
    cam.style.transform = `translate(${(Math.sin(a) * 14).toFixed(2)}px, ${(Math.cos(a) * 9).toFixed(2)}px) scale(${(1.02 + form * 0.03).toFixed(4)})`;
    halo.style.opacity = (0.35 + form * 0.65).toFixed(3);
    // Lichtkante fährt einmal pro Schleife über das Monogramm
    const s = Math.min(1, Math.max(0, (p - 0.5) / 0.2));
    sweep.style.opacity = (Math.sin(Math.PI * s) * form * 0.9).toFixed(3);
    sweep.style.transform = `translateX(${(-60 + s * 120).toFixed(1)}%) rotate(18deg)`;
  }

  const state = { p: 0 };
  const tl = gsap.timeline({ paused: true });
  tl.to(state, { p: 1, duration: DUR, ease: "none", onUpdate: () => draw(state.p) }, 0);
  draw(0);
  window.__timelines[root.dataset.compositionId] = tl;
  tl.seek(0);
})();
