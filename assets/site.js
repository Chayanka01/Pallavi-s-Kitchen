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
    const els = document.querySelectorAll(".sec, .hers, .note, figure.page, .dishes, .spice, .pn");
    if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -8% 0px" });
      els.forEach(el => { el.classList.add("reveal"); io.observe(el); });
    }
  }
};
if (!document.querySelector("template[data-route]")) MK.init();
