/* Shared site behaviour: nav, motion, hero console, contact form. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(pointer: fine)").matches;

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- page view counter ----------
     Abacus (abacus.jasoncameron.dev) keeps one plain counter per page under this
     site's namespace. No account, no cookie, no personal data: the request only
     carries the page key, and the service sees the IP any request reveals.
     One increment per page per session; repeat views read the same number back. */
  function countPage(el, pageKey, noun) {
    if (!el || !window.fetch || !pageKey) return;

    var page = String(pageKey);
    var thing = noun || "page";
    var namespace = "dwainsnickles.github.io";
    var isLocal = /^(localhost|127\.0\.0\.1|::1)$/.test(window.location.hostname);
    var seen = false;
    try { seen = window.sessionStorage.getItem("hit:" + page) === "1"; } catch (e) { seen = false; }

    var url = "https://abacus.jasoncameron.dev/" + (seen || isLocal ? "get" : "hit")
      + "/" + encodeURIComponent(namespace) + "/" + encodeURIComponent(page);

    window.fetch(url, { mode: "cors" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        var n = data ? Number(data.value) : 0;
        if (!n || !isFinite(n)) return;
        var count = el.querySelector(".hits__count");
        var label = el.querySelector(".hits__label");
        var plural = n === 1 ? "view" : "views";
        if (count) count.textContent = n.toLocaleString("en-US");
        if (label) label.textContent = thing + " " + plural;
        el.hidden = false;
        el.title = n.toLocaleString("en-US") + " " + plural + " of this " + thing;
        try { window.sessionStorage.setItem("hit:" + page, "1"); } catch (e) { /* ignore */ }
      })
      .catch(function () { /* decoration only: never surface an error to the reader */ });
  }

  /* Pages with a fixed key count themselves; repo.html has none, because repo.js
     only learns which repository it is showing once data/repos.json has loaded. */
  window.sitePageViews = countPage;
  var autoHits = document.querySelector(".hits[data-page]");
  if (autoHits) countPage(autoHits, autoHits.getAttribute("data-page"), "page");

  /* ---------- mobile nav ---------- */
  var nav = document.getElementById("nav");
  var navLinks = document.getElementById("navLinks");
  var toggle = document.getElementById("navToggle");

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      navLinks.classList.toggle("is-open", !open);
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("is-open");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        toggle.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("is-open");
      }
    });
  }

  /* ---------- scroll progress + stuck nav ---------- */
  var progress = document.getElementById("progress");
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + "%";
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 12);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- pointer spotlight ---------- */
  var spot = document.querySelector(".spotlight");
  if (spot && pointerFine && !reduceMotion) {
    var sx = 0, sy = 0, tx = 0, ty = 0;
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", function (event) {
      tx = event.clientX;
      ty = event.clientY;
    }, { passive: true });

    (function loop() {
      sx += (tx - sx) * 0.12;
      sy += (ty - sy) * 0.12;
      spot.style.transform = "translate3d(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px,0)";
      window.requestAnimationFrame(loop);
    })();
  }

  /* ---------- hero typewriter ---------- */
  var typeTarget = document.getElementById("typeTarget");
  if (typeTarget) {
    var phrases = [
      "building WinForms components",
      "porting ribbon UI to .NET 10",
      "publishing to NuGet",
      "playing HLS through LibVLC",
      "unblocking Mark of the Web"
    ];
    if (reduceMotion) {
      typeTarget.textContent = phrases[0];
    } else {
      var phraseIndex = 0, charIndex = phrases[0].length, deleting = true, pause = 1400;

      var tick = function () {
        var current = phrases[phraseIndex];
        if (deleting) {
          charIndex -= 1;
          typeTarget.textContent = current.slice(0, Math.max(0, charIndex));
          if (charIndex <= 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            pause = 320;
          } else {
            pause = 26;
          }
        } else {
          charIndex += 1;
          typeTarget.textContent = phrases[phraseIndex].slice(0, charIndex);
          if (charIndex >= phrases[phraseIndex].length) {
            deleting = true;
            pause = 1900;
          } else {
            pause = 46;
          }
        }
        window.setTimeout(tick, pause);
      };
      window.setTimeout(tick, 1600);
    }
  }

  /* ---------- hero console ---------- */
  var consoleEl = document.getElementById("console");
  if (consoleEl) {
    var markupLine = function (cls, text) {
      return cls ? '<span class="' + cls + '">' + text + "</span>" : text;
    };
    var lines = [
      markupLine("c-prompt", "$") + " gh repo list DwainSnickles --sort pushed --limit 5",
      markupLine("c-key", "RibbonWinForms") + "        C#    ribbon · .NET 10 · nuget",
      markupLine("c-key", "GraphicsWorkshop") + "       C#    design surface · WIP",
      markupLine("c-key", "DesignSurfaceCSharp") + "    C#    graphic object model",
      markupLine("c-key", "AutoUpdater.NET.XML…") + "   C#    update manifests",
      markupLine("c-key", "MOTW-Cleaner") + "           HTML  unblock downloads",
      "",
      markupLine("c-prompt", "$") + " npm run index -- --refresh",
      markupLine("c-ok", "✓") + " 31 repositories indexed",
      markupLine("c-ok", "✓") + " nuget: " + markupLine("c-key", "Dwain.RibbonLib"),
      markupLine("c-dim", "→ ") + markupLine("c-arrow", "https://dwainsnickles.github.io")
    ];

    if (reduceMotion) {
      consoleEl.innerHTML = lines.join("\n");
    } else {
      var lineIndex = 0;
      var typed = [];
      var render = function () {
        consoleEl.innerHTML = typed.join("\n") + '<span class="c-prompt">▌</span>';
      };
      var typeLine = function () {
        if (lineIndex >= lines.length) {
          render();
          return;
        }
        typed.push(lines[lineIndex]);
        lineIndex += 1;
        render();
        window.setTimeout(typeLine, 130 + Math.random() * 90);
      };
      render();
      window.setTimeout(typeLine, 400);
    }
  }

  /* ---------- ambient node field ---------- */
  var canvas = document.getElementById("stars");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var nodes = [];
    var width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pointer = { x: -999, y: -999 };

    var resize = function () {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(76, Math.max(26, (width * height) / 26000)));
      nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.3 + 0.5
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < nodes.length; i += 1) {
        var a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -20) a.x = width + 20;
        if (a.x > width + 20) a.x = -20;
        if (a.y < -20) a.y = height + 20;
        if (a.y > height + 20) a.y = -20;

        var near = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = near < 160 ? "rgba(34,211,238,0.75)" : "rgba(140,190,240,0.4)";
        ctx.fill();

        for (var j = i + 1; j < nodes.length; j += 1) {
          var b = nodes[j];
          var dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 132) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(76,141,255," + (0.16 * (1 - dist / 132)).toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      window.requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });

    window.addEventListener("resize", resize);
    resize();
    draw();
  }

  /* ---------- contact form → prefilled GitHub issue ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    var status = document.getElementById("formStatus");
    var copyBtn = document.getElementById("copyBtn");

    var composeBody = function () {
      var name = (document.getElementById("name").value || "Anonymous").trim();
      var message = (document.getElementById("message").value || "").trim();
      return message + "\n\n---\nFrom: " + name + "\nVia: dwainsnickles.github.io";
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var subject = (document.getElementById("subject").value || "Site message").trim();
      var message = (document.getElementById("message").value || "").trim();

      if (!subject || !message) {
        if (status) status.textContent = "Add a subject and a message first.";
        return;
      }

      var url = "https://github.com/DwainSnickles/dwainsnickles.github.io/issues/new"
        + "?title=" + encodeURIComponent("[site] " + subject)
        + "&body=" + encodeURIComponent(composeBody());

      window.open(url, "_blank", "noopener");
      if (status) status.textContent = "Opened a prefilled issue in a new tab.";
    });

    if (copyBtn && navigator.clipboard) {
      copyBtn.addEventListener("click", function () {
        var subject = (document.getElementById("subject").value || "(no subject)").trim();
        navigator.clipboard.writeText(subject + "\n\n" + composeBody()).then(function () {
          if (status) status.textContent = "Message copied to the clipboard.";
        }).catch(function () {
          if (status) status.textContent = "Clipboard blocked by the browser — select the text manually.";
        });
      });
    }
  }
})();
