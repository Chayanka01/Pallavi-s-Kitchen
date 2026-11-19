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
      }), { rootMargin: "0px 0px -8% 0px" });
      els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
    }
    this.web();
    this.tilt();
  },

  // the spice web: point at a dish or a spice and its threads light up; left alone, it wanders
  web() {
    clearInterval(this._wt);
    const web = document.querySelector(".web");
    if (!web) return;
    const data = JSON.parse(web.querySelector(".web-data").textContent);
    const svg = web.querySelector("svg"), core = web.querySelector(".core-in");
    const part = k => core.querySelector(".core-" + k);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = matchMedia("(hover: none)").matches;
    let cur = null, idle = true, live = false;
    const all = sel => svg.querySelectorAll(sel);
    const esc = v => (window.CSS && CSS.escape) ? CSS.escape(v) : v;
    function clear() { svg.classList.remove("focus"); all(".on,.cur").forEach(e => e.classList.remove("on", "cur")); }
    function fill(k, t, b, m, c, href, art) {
      core.classList.remove("swap"); void core.offsetWidth; core.classList.add("swap");
      core.style.setProperty("--c", c); core.href = href; core.classList.toggle("is-s", !art && /#/.test(href));
      part("k").textContent = k; part("t").textContent = t; part("b").textContent = b; part("m").textContent = m;
      part("art").innerHTML = art || "";
    }
    function dish(slug) {
      const r = data.r[slug]; if (!r) return;
      clear(); cur = "r:" + slug; svg.classList.add("focus");
      all('[data-r="' + esc(slug) + '"]').forEach(e => e.classList.add("on"));
      const node = svg.querySelector('.rn[data-r="' + esc(slug) + '"]'); node && node.classList.add("cur");
      r.sp.forEach(k => all('.sn[data-s="' + esc(k) + '"]').forEach(e => e.classList.add("on")));
      const th = document.querySelector('.rows li[data-slug="' + esc(slug) + '"] .thumb svg');
      fill(r.cat, r.t, r.bn, r.sp.join(" · "), r.c, r.u, th ? th.outerHTML : "");
    }
    function spice(key) {
      const s = data.s[key]; if (!s) return;
      clear(); cur = "s:" + key; svg.classList.add("focus");
      all('.th[data-s="' + esc(key) + '"], .sn[data-s="' + esc(key) + '"]').forEach(e => e.classList.add("on"));
      s.rs.forEach(slug => all('.rn[data-r="' + esc(slug) + '"]').forEach(e => e.classList.add("on")));
      fill(s.en, key, s.bn, s.rs.length + (s.rs.length > 1 ? " dishes" : " dish"), s.c, s.u, "");
    }
    svg.querySelectorAll(".ra, .sa").forEach(a => {
      const g = a.firstElementChild, isR = g.classList.contains("rn");
      const id = isR ? "r:" + g.dataset.r : "s:" + g.dataset.s;
      const show = () => { idle = false; isR ? dish(g.dataset.r) : spice(g.dataset.s); };
      if (!touch) { a.addEventListener("mouseenter", show); a.addEventListener("focus", show); }
      a.addEventListener("click", e => { if (touch && cur !== id) { e.preventDefault(); show(); } });
    });
    if (!touch) web.querySelector(".wheel").addEventListener("mouseleave", () => { idle = true; });
    const slugs = Object.keys(data.r);
    const wander = () => { if (idle && live && !document.hidden) dish(slugs[Math.floor(Math.random() * slugs.length)]); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => {
        live = e.isIntersecting; web.classList.toggle("live", live);
        if (live && !cur) wander();
      }), { threshold: .25 }).observe(web);
    } else { live = true; web.classList.add("live"); }
    if (!still) this._wt = setInterval(wander, touch ? 4200 : 3400);
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
