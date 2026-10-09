// Jeremy A. Henry - online resume. Small, dependency-free enhancements.
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var backdrop = document.querySelector(".nav-backdrop");
  var toTop = document.querySelector(".to-top");

  // ---- Mobile menu ----
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("open", open);
    backdrop.hidden = !open;
    document.body.classList.toggle("nav-open", open);
    if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  backdrop.addEventListener("click", function () { setMenu(false); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

  // ---- Header shadow + back-to-top ----
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    toTop.hidden = y < 600;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Highlight the section you're reading ----
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });

    // Gentle reveal as sections scroll in
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var rev = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("visible"); rev.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      document.querySelectorAll(".card, .skill-group, .timeline > li, .edu-card").forEach(function (el) {
        el.classList.add("reveal"); rev.observe(el);
      });
    }
  }

  // ---- Print resume ----
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  // ---- Footer year ----
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---- Live GitHub stats on project cards (no key needed; cached for an hour) ----
  var USER = "HtmlGifted-cyber", KEY = "gh-repos-v1";
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
  function paint(repos) {
    var byName = {};
    repos.forEach(function (r) { byName[r.name.toLowerCase()] = r; });
    document.querySelectorAll(".card[data-repo]").forEach(function (card) {
      var r = byName[card.getAttribute("data-repo").toLowerCase()];
      if (!r) return;
      var meta = card.querySelector(".card-meta");
      meta.innerHTML = "";
      [["★ " + r.stargazers_count, "stars"], [r.language || "", "language"], ["Updated " + fmtDate(r.pushed_at), "updated"]]
        .forEach(function (p) {
          if (!p[0]) return;
          var s = document.createElement("span"); s.textContent = p[0]; s.title = p[1]; meta.appendChild(s);
        });
    });
  }
  try {
    var cached = JSON.parse(localStorage.getItem(KEY) || "null");
    if (cached && Date.now() - cached.t < 3600e3) { paint(cached.d); return; }
  } catch (e) { /* storage blocked: just fetch */ }
  fetch("https://api.github.com/users/" + USER + "/repos?per_page=100")
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (repos) {
      if (!Array.isArray(repos) || !repos.length) return;
      paint(repos);
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: repos })); } catch (e) { /* ignore */ }
    })
    .catch(function () { /* offline: cards still read fine without stats */ });
})();
