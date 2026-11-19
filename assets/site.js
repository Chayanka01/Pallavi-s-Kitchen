/* Search on the home page, a lightbox for photographs, and a gentle reveal on scroll.
   Everything works without it; the script only adds. */
window.MK = {
  init() {
    // search: filters rows by title, Bengali name, tags, region and her text
    const q = document.getElementById("q");
    if (q) {
      const rows = [...document.querySelectorAll(".rows li")];
      const secs = [...document.querySelectorAll("[data-sec]")];
      const empty = document.querySelector(".empty");
      q.addEventListener("input", () => {
        const v = q.value.toLowerCase().trim();
        rows.forEach(li => { li.hidden = !!v && !li.dataset.q.includes(v); });
        secs.forEach(s => { s.hidden = ![...s.querySelectorAll("li")].some(li => !li.hidden); });
        if (empty) empty.hidden = rows.some(li => !li.hidden);
      });
    }
    // lightbox
    const lb = document.getElementById("lightbox");
    document.querySelectorAll("img[data-zoom]").forEach(im => im.addEventListener("click", () => {
      lb.querySelector("img").src = im.currentSrc || im.src;
      lb.querySelector("img").alt = im.alt;
      lb.hidden = false;
    }));
    if (!lb.dataset.bound) {
      lb.dataset.bound = 1;
      lb.addEventListener("click", () => { lb.hidden = true; });
      addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });
    }
    // reveal on scroll
    const els = document.querySelectorAll(".sec, .hers, .note, figure.page, .dishes, .spice, .pn, .wander, .web-words");
    if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -4% 0px" });
      // whatever is left at the very end of the page shows once the bottom is reached
      addEventListener("scroll", () => { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) els.forEach(el => el.classList.add("on")); }, { passive: true });
      els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
    }
    this.web();
    this.tilt();
    if (!window.__mkScroll) {
      window.__mkScroll = 1;
      let t = 0;
      addEventListener("scroll", () => {
        if (!t) document.body.classList.add("scrolling");
        clearTimeout(t);
        t = setTimeout(() => { document.body.classList.remove("scrolling"); t = 0; }, 160);
      }, { passive: true });
    }
  },

  // the spice web: point at a dish or a spice and its threads light up; left alone, it wanders
  web() {
    clearInterval(this._wt);
    const web = document.querySelector(".web");
    if (!web) return;
    const data = JSON.parse(web.querySelector(".web-data").textContent);
    const wheel = web.querySelector(".wheel"), svg = wheel.querySelector("svg"), core = web.querySelector(".core-in");
    const part = k => core.querySelector(".core-" + k);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = matchMedia("(hover: none)").matches;
    let cur = null, live = false, inside = false, lastTouch = 0, pending = 0;
    const esc = v => (window.CSS && CSS.escape) ? CSS.escape(v) : v;
    const on = [];
    function clear() { svg.classList.remove("focus"); on.forEach(e => e.classList.remove("on", "cur")); on.length = 0; }
    function light(sel, cls) { svg.querySelectorAll(sel).forEach(e => { e.classList.add("on"); if (cls) e.classList.add(cls); on.push(e); }); }
    function fill(k, t, b, m, c, href, art, isSpice) {
      core.style.setProperty("--c", c); core.href = href; core.classList.toggle("is-s", isSpice);
      part("k").textContent = k; part("t").textContent = t; part("b").textContent = b; part("m").textContent = m;
      part("art").innerHTML = art || "";
      if (!still && core.animate) core.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
    function dish(slug) {
      const r = data.r[slug]; if (!r || cur === "r:" + slug) return;
      clear(); cur = "r:" + slug; svg.classList.add("focus");
      light('.th[data-r="' + esc(slug) + '"]'); light('.rn[data-r="' + esc(slug) + '"]', "cur");
      r.sp.forEach(k => light('.sn[data-s="' + esc(k) + '"]'));
      const th = document.querySelector('.rows li[data-slug="' + esc(slug) + '"] .thumb svg');
      fill(r.cat, r.t, r.bn, r.sp.join(" · "), r.c, r.u, th ? th.outerHTML : "", false);
    }
    function spice(key) {
      const s = data.s[key]; if (!s || cur === "s:" + key) return;
      clear(); cur = "s:" + key; svg.classList.add("focus");
      light('.th[data-s="' + esc(key) + '"]'); light('.sn[data-s="' + esc(key) + '"]', "cur");
      s.rs.forEach(slug => light('.rn[data-r="' + esc(slug) + '"]'));
      fill(s.en, key, s.bn, s.rs.length + (s.rs.length > 1 ? " dishes" : " dish"), s.c, s.u, "", true);
    }
    // one listener for the whole wheel (per-link hover events are unreliable on SVG links in Safari)
    const target = e => { const a = e.target.closest && e.target.closest(".ra, .sa"); if (!a) return null; const g = a.firstElementChild; return { a, isR: g.classList.contains("rn"), key: g.dataset.r || g.dataset.s }; };
    const show = t => t.isR ? dish(t.key) : spice(t.key);
    if (!touch) {
      let hovered = null;
      svg.addEventListener("pointerover", e => {
        const t = target(e); if (!t) return;
        if (hovered && hovered.key === t.key) return;
        hovered = t; clearTimeout(pending);
        // a short pause before switching, so passing over other dots on the way does not change the centre
        pending = setTimeout(() => show(t), 110);
      });
      svg.addEventListener("pointerout", e => { const t = target(e); if (t && (!e.relatedTarget || !t.a.contains(e.relatedTarget))) { clearTimeout(pending); hovered = null; } });
      svg.addEventListener("focusin", e => { const t = target(e); if (t) show(t); });
      wheel.addEventListener("pointerenter", () => { inside = true; });
      wheel.addEventListener("pointerleave", () => { inside = false; clearTimeout(pending); lastTouch = Date.now(); });
    }
    svg.addEventListener("click", e => {
      const t = target(e); if (!t) return;
      const id = (t.isR ? "r:" : "s:") + t.key;
      if (touch && cur !== id) { e.preventDefault(); lastTouch = Date.now(); show(t); }
    });
    const slugs = Object.keys(data.r);
    const wander = () => {
      if (inside || !live || document.hidden || document.body.classList.contains("scrolling")) return;
      if (Date.now() - lastTouch < 6000) return;
      dish(slugs[Math.floor(Math.random() * slugs.length)]);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => {
        live = e.isIntersecting; web.classList.toggle("live", live);
        if (live && !cur) dish(slugs[Math.floor(Math.random() * slugs.length)]);
      }), { threshold: .2 }).observe(web);
    } else { live = true; web.classList.add("live"); }
    if (!still) this._wt = setInterval(wander, 3600);
    else dish(slugs[0]);
  },

  // the dish drawing leans a little toward the pointer (not on touch screens)
  tilt() {
    if (matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll("[data-tilt]").forEach(el => {
      el.addEventListener("mousemove", e => {
        const b = el.getBoundingClientRect();
        el.style.setProperty("--rx", ((e.clientX - b.left) / b.width - .5) * 14 + "deg");
        el.style.setProperty("--ry", (.5 - (e.clientY - b.top) / b.height) * 14 + "deg");
      });
      el.addEventListener("mouseleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }
};
if (!document.querySelector("template[data-route]")) MK.init();
