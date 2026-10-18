// Startseite mschenkl.github.io: Karten aus pages.json + automatisch erkannte
// GitHub-Pages-Repos, Befehlspalette, Hero-Video und Animationen.
(function () {
  const USER = "MSchenkl";
  const BASE = "https://mschenkl.github.io";
  const SKIP_REPOS = ["mschenkl.github.io"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && !reduce;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // ---------- Hero-Video passend zur Ausrichtung ----------
  const video = document.querySelector(".hero-media video");
  if (video) {
    const mq = matchMedia("(max-aspect-ratio: 4/5)");
    const pick = () => {
      const v = mq.matches ? "9x16" : "16x9";
      if (video.dataset.variant === v) return;
      video.dataset.variant = v;
      video.poster = `/assets/poster-${v}.jpg`;
      video.innerHTML = `<source src="/assets/hero-${v}.webm" type="video/webm"><source src="/assets/hero-${v}.mp4" type="video/mp4">`;
      video.load();
      if (!reduce) video.play().catch(() => {});
    };
    pick();
    mq.addEventListener("change", pick);
  }

  // ---------- Cursor-Spotlight im Hero ----------
  const hero = document.querySelector(".hero");
  if (hero) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  // ---------- Daten ----------
  const loadJSON = (url) => fetch(url, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

  const cachedRepos = () => {
    try {
      const c = JSON.parse(localStorage.getItem("repos") || "null");
      if (c && Date.now() - c.t < 30 * 60 * 1000) return c.data;
    } catch (e) {}
    return null;
  };
  const loadRepos = () => {
    const c = cachedRepos();
    if (c) return Promise.resolve(c);
    return loadJSON(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`).then((data) => {
      const slim = data
        .filter((r) => !r.fork && !r.private)
        .map((r) => ({ name: r.name, description: r.description, has_pages: r.has_pages, html_url: r.html_url, pushed_at: r.pushed_at }));
      try { localStorage.setItem("repos", JSON.stringify({ t: Date.now(), data: slim })); } catch (e) {}
      return slim;
    });
  };

  const prettify = (name) => name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ---------- Rendering ----------
  const grid = document.getElementById("pages");
  const chips = document.getElementById("repo-chips");
  const paletteItems = [];

  function cardHTML(p) {
    const sub = (p.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("");
    return `<article class="card${p.featured ? " featured" : ""}" style="--accent:${esc(p.accent || "#4da3ff")}">
      <a class="stretch" href="${esc(p.url)}" aria-label="${esc(p.title)} öffnen"></a>
      ${p.isNew ? '<span class="new">NEU</span>' : ""}
      <span class="tag">${esc(p.tag || "Seite")}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.subtitle || "")}</p>
      <div class="foot"><span class="go">Öffnen ${arrow}</span>${sub ? `<div class="sub">${sub}</div>` : ""}</div>
    </article>`;
  }

  function render(pages, repos) {
    if (grid) grid.innerHTML = pages.map(cardHTML).join("") +
      `<article class="card ghost" style="--accent:#ffb454"><span class="tag">In Arbeit</span><h3>Nächstes Projekt</h3><p>Entsteht gerade – erscheint hier, sobald es online ist.</p></article>`;
    pages.forEach((p) => paletteItems.push({ label: p.title, hint: p.tag || "Seite", url: p.url, keys: `${p.subtitle} ${p.url}` }));

    if (chips) {
      const code = repos.filter((r) => !r.has_pages && !SKIP_REPOS.includes(r.name.toLowerCase()));
      chips.innerHTML = code
        .map((r) => `<a class="chip" href="${esc(r.html_url)}" target="_blank" rel="noopener"><strong>${esc(r.name)}</strong>${r.description ? `<small>${esc(r.description)}</small>` : ""}</a>`)
        .join("");
      chips.closest(".repos").hidden = code.length === 0;
      code.forEach((r) => paletteItems.push({ label: r.name, hint: "GitHub", url: r.html_url, keys: r.description }));
    }
    document.querySelectorAll("[data-profile]").forEach((a) => paletteItems.push({ label: a.textContent.trim(), hint: "Profil", url: a.href }));

    bindCards();
    if (hasGsap) {
      gsap.from(".card", {
        scrollTrigger: window.ScrollTrigger ? { trigger: grid, start: "top 85%" } : undefined,
        y: 40, opacity: 0, rotateX: -8, duration: .8, ease: "power3.out", stagger: .08,
      });
    }
  }

  Promise.all([
    loadJSON("/pages.json").catch(() => ({ pages: [] })),
    loadRepos().catch(() => []),
  ]).then(([cfg, repos]) => {
    const pages = (cfg.pages || []).slice();
    const known = new Set(pages.map((p) => (p.repo || "").toLowerCase()));
    // Neue Repos mit GitHub Pages automatisch aufnehmen
    repos
      .filter((r) => r.has_pages && !known.has(r.name.toLowerCase()) && !SKIP_REPOS.includes(r.name.toLowerCase()))
      .forEach((r) => {
        const fresh = Date.now() - new Date(r.pushed_at).getTime() < 30 * 24 * 3600 * 1000;
        pages.push({ title: prettify(r.name), subtitle: r.description || "Neue Seite auf GitHub Pages.", url: `${BASE}/${r.name}/`, tag: "Projekt", accent: "#ffb454", isNew: fresh, repo: r.name });
      });
    render(pages, repos);
  });

  // ---------- 3D-Tilt + Glow ----------
  function bindCards() {
    if (reduce) return;
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--gx", `${x * 100}%`);
        card.style.setProperty("--gy", `${y * 100}%`);
        card.style.transform = `rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateZ(0)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform .6s cubic-bezier(.2,.8,.2,1), border-color .3s, box-shadow .3s";
        card.style.transform = "";
        setTimeout(() => (card.style.transition = ""), 600);
      });
    });
  }

  // ---------- Intro-Animation ----------
  document.querySelectorAll(".name .line").forEach((line) => {
    if (line.querySelector(".grad")) return; // Verlaufszeile bleibt am Stück
    const target = line;
    const text = target.textContent;
    target.innerHTML = [...text].map((c) => `<span class="ch">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
  });
  if (hasGsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".kicker", { y: 16, opacity: 0, duration: .7 })
      .from(".name .ch, .name .grad", { yPercent: 110, rotate: 6, duration: 1.1, stagger: .035 }, "-=.4")
      .from(".role", { y: 18, opacity: 0, duration: .8 }, "-=.7")
      .from(".ticker, .actions > *", { y: 14, opacity: 0, duration: .6, stagger: .07 }, "-=.5")
      .from(".scroll-hint", { opacity: 0, duration: .6 }, "-=.2");
    // Hero leicht parallax beim Scrollen
    if (window.ScrollTrigger) {
      gsap.to(".hero-inner", { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
  }

  // ---------- Wort-Ticker ----------
  const words = ["Produktdaten", "Lösungsarchitektur", "Generative KI", "Python", "Vorträge & Workshops"];
  const box = document.querySelector(".word-box");
  if (box) {
    let i = 0;
    const el = document.createElement("span");
    el.className = "word"; el.textContent = words[0];
    box.appendChild(el);
    if (!reduce) {
      setInterval(() => {
        i = (i + 1) % words.length;
        const next = document.createElement("span");
        next.className = "word"; next.textContent = words[i];
        box.appendChild(next);
        const prev = box.firstElementChild;
        if (hasGsap) {
          gsap.fromTo(next, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .55, ease: "power3.out" });
          gsap.to(prev, { yPercent: -100, opacity: 0, duration: .55, ease: "power3.in", onComplete: () => prev.remove() });
        } else prev.remove();
      }, 2200);
    }
  }

  // ---------- Befehlspalette (⌘K oder /) ----------
  const pal = document.getElementById("palette");
  const input = pal && pal.querySelector("input");
  const list = pal && pal.querySelector("ul");
  let active = 0, shown = [];

  function draw() {
    const q = input.value.trim().toLowerCase();
    shown = paletteItems.filter((it) => !q || `${it.label} ${it.hint} ${it.keys || ""}`.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length
      ? shown.map((it, k) => `<li><a href="${esc(it.url)}" class="${k === active ? "active" : ""}"><span>${esc(it.label)}</span><small>${esc(it.hint)}</small></a></li>`).join("")
      : '<li><a aria-disabled="true"><span>Nichts gefunden</span></a></li>';
  }
  function openPal() { pal.classList.add("open"); input.value = ""; active = 0; draw(); input.focus(); }
  function closePal() { pal.classList.remove("open"); }

  if (pal) {
    document.addEventListener("keydown", (e) => {
      const typing = /input|textarea/i.test(document.activeElement.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); openPal(); }
      else if (e.key === "Escape") closePal();
    });
    document.querySelectorAll("[data-open-palette]").forEach((b) => b.addEventListener("click", openPal));
    pal.addEventListener("click", (e) => { if (e.target === pal) closePal(); });
    input.addEventListener("input", () => { active = 0; draw(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { active = Math.min(active + 1, shown.length - 1); draw(); e.preventDefault(); }
      if (e.key === "ArrowUp") { active = Math.max(active - 1, 0); draw(); e.preventDefault(); }
      if (e.key === "Enter" && shown[active]) location.href = shown[active].url;
    });
  }
})();
