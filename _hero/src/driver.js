// Treibt die Partikelwolke aus assets/cloud.js über die HyperFrames-Zeitleiste.
(function () {
  const root = document.querySelector("[data-composition-id]");
  const id = root.dataset.compositionId;
  const portrait = +root.dataset.height > +root.dataset.width;
  const cloud = createCloud(document.getElementById("cloud"), {
    count: portrait ? 70000 : 120000, dpr: 1, pointSize: 1.1, portrait, preserveDrawingBuffer: true,
  });
  const state = { t: 0 };
  cloud.ready.then(() => {
    const tl = gsap.timeline({ paused: true });
    tl.to(state, { t: cloud.LOOP, duration: +root.dataset.duration, ease: "none", onUpdate: () => cloud.render(state.t) }, 0);
    cloud.render(0);
    window.__timelines[id] = tl;
    tl.seek(0);
  });
})();
