/* GVR Granite & Marbles — shared behaviour + motion */
(function () {
  "use strict";

  var PHONE = "916300346255";
  var EMAIL = "vishnu.v.ganji@gmail.com";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress bar (injected) ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);

  var header = document.querySelector(".site-header");
  function onScroll() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
    if (header) header.classList.toggle("scrolled", st > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- footer year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- staggered reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  // assign a stagger delay based on position among reveal siblings
  reveals.forEach(function (el) {
    if (reduce) return;
    var sibs = [].filter.call(el.parentElement ? el.parentElement.children : [], function (c) {
      return c.classList && c.classList.contains("reveal");
    });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i * 80, 480) + "ms";
  });

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1300, start = null;
    if (reduce) { el.textContent = target + suffix; return; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          e.target.querySelectorAll("[data-count]").forEach(runCounter);
          if (e.target.hasAttribute && e.target.hasAttribute("data-count")) runCounter(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    // observe stray counters not inside a .reveal
    document.querySelectorAll("[data-count]").forEach(function (c) {
      if (!c.closest(".reveal")) io.observe(c);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll("[data-count]").forEach(runCounter);
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 4200);
  }

  /* ---------- product "Enquire" buttons ---------- */
  document.querySelectorAll("[data-enquire]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var stone = btn.getAttribute("data-enquire");
      var msgField = document.getElementById("f-message");
      if (msgField) {
        e.preventDefault();
        msgField.value = "I'd like a quote for " + stone +
          ". Please share available sizes, finish options and current rates.";
        var sel = document.getElementById("f-interest");
        if (sel) {
          for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value.toLowerCase().indexOf(stone.toLowerCase()) > -1) {
              sel.selectedIndex = i; break;
            }
          }
        }
        document.getElementById("enquiry").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        msgField.focus();
        toast("Enquiry pre-filled for " + stone);
      } else {
        var text = encodeURIComponent("Hello GVR Granite & Marbles, I'd like a quote for " +
          stone + ". Please share sizes, finish and rates.");
        window.open("https://wa.me/" + PHONE + "?text=" + text, "_blank", "noopener");
      }
    });
  });

  /* ---------- enquiry form → WhatsApp / Email ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    function get(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
    function gather() {
      return { name: get("f-name"), phone: get("f-phone"), interest: get("f-interest"),
        qty: get("f-qty"), location: get("f-location"), message: get("f-message") };
    }
    function validate(d) {
      if (!d.name) { toast("Please add your name."); document.getElementById("f-name").focus(); return false; }
      if (!d.phone) { toast("Please add a contact number."); document.getElementById("f-phone").focus(); return false; }
      return true;
    }
    function compose(d) {
      var lines = ["*New enquiry — GVR Granite & Marbles*", "Name: " + d.name, "Phone: " + d.phone];
      if (d.interest) lines.push("Interested in: " + d.interest);
      if (d.qty) lines.push("Quantity / area: " + d.qty);
      if (d.location) lines.push("Delivery location: " + d.location);
      if (d.message) lines.push("Details: " + d.message);
      return lines.join("\n");
    }
    var waBtn = document.getElementById("sendWa");
    var mailBtn = document.getElementById("sendMail");
    if (waBtn) waBtn.addEventListener("click", function () {
      var d = gather(); if (!validate(d)) return;
      window.open("https://wa.me/" + PHONE + "?text=" + encodeURIComponent(compose(d)), "_blank", "noopener");
      toast("Opening WhatsApp with your enquiry…");
    });
    if (mailBtn) mailBtn.addEventListener("click", function () {
      var d = gather(); if (!validate(d)) return;
      var subject = encodeURIComponent("Enquiry from " + d.name + " — GVR Granite & Marbles");
      var body = encodeURIComponent(compose(d).replace(/\*/g, ""));
      window.location.href = "mailto:" + EMAIL + "?subject=" + subject + "&body=" + body;
      toast("Opening your email app…");
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }
})();
