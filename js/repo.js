/* Repository detail page: renders one repository from data/repos.json + data/details.json. */
(function () {
  "use strict";

  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>';
  var FORK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="19" r="2.4"/><path d="M6 8.4v3.2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8.4M12 14.6V16"/></svg>';

  var head = document.getElementById("repoHead");
  var body = document.getElementById("detailBody");
  var crumb = document.getElementById("crumbName");

  var esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  var prettyDate = function (iso) {
    if (!iso) return "—";
    var parts = String(iso).split("-");
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[Number(parts[1]) - 1] + " " + Number(parts[2]) + ", " + parts[0];
  };

  function setMeta(attribute, key, value) {
    var element = document.head.querySelector("meta[" + attribute + '="' + key + '"]');
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute("content", value);
  }

  var slug = "";
  try {
    slug = (new URLSearchParams(window.location.search).get("r") || "").trim();
  } catch (error) {
    slug = "";
  }

  function fallbackLink(extra) {
    return '<a class="btn btn--solid" href="projects.html">' + extra + "</a>";
  }

  function renderNotFound() {
    var robots = document.getElementById("robotsMeta");
    if (robots) robots.setAttribute("content", "noindex, follow");
    setMeta("property", "og:title", "Repository detail — Dwain Snickles");
    if (crumb) crumb.textContent = "Unknown repository";
    if (head) {
      head.innerHTML = '<p class="eyebrow">Repository detail</p>'
        + "<h1>Not in the index</h1>"
        + '<p class="detail-tagline">That case study is not here — the link may be out of date.</p>'
        + '<div class="hero__actions">' + fallbackLink("← Back to the repository index") + "</div>";
    }
    if (body) {
      body.innerHTML = '<div class="notfound">'
        + "<h2>Case studies live in the index</h2>"
        + "<p>Six repositories have a written case study: a summary, real screenshots, and install steps. "
        + "Everything else opens straight on GitHub.</p>"
        + '<a class="btn btn--solid" href="projects.html">Browse all repositories</a>'
        + "</div>";
    }
  }

  function shotBlock(detail) {
    var shots = detail.shots || [];
    if (!shots.length) {
      return '<figure class="shot shot--empty">'
        + "<strong>No screenshot published</strong>"
        + "<p>" + esc(detail.shotsNote || "This repository ships source rather than pictures — open it on GitHub to see the real thing.") + "</p>"
        + "</figure>";
    }
    return shots.map(function (shot) {
      return '<figure class="shot">'
        + '<img src="' + esc(shot.src) + '" alt="' + esc(shot.alt || "") + '" loading="lazy" decoding="async">'
        + "<figcaption>" + esc(shot.caption || "") + "</figcaption>"
        + "</figure>";
    }).join("");
  }

  function highlights(detail) {
    var items = detail.highlights || [];
    if (!items.length) return "";
    return '<h2 class="detail-h2">What it does</h2>'
      + '<div class="hl-grid">'
      + items.map(function (item) {
        return '<div class="hl"><h3>' + esc(item.title) + "</h3><p>" + esc(item.text) + "</p></div>";
      }).join("")
      + "</div>";
  }

  function specPanel(repo, detail) {
    var rows = [
      ["Stars", repo.stars + ""],
      ["Forks", repo.forks + ""],
      ["Updated", prettyDate(repo.updated)]
    ].concat((detail.facts || []).map(function (fact) { return [fact.label, fact.value]; }));

    return '<div class="panel"><p class="panel__title">At a glance</p><dl class="spec">'
      + rows.map(function (row) {
        return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>";
      }).join("")
      + "</dl></div>";
  }

  function quickstartPanel(detail) {
    var steps = detail.quickstart || [];
    if (!steps.length) return "";
    return '<div class="panel"><p class="panel__title">Quick start</p>'
      + steps.map(function (step) {
        return '<div class="step">'
          + '<span class="step__label">' + esc(step.label) + "</span>"
          + '<div class="code"><pre><code>' + esc(step.code) + "</code></pre>"
          + '<button class="copy" type="button" data-copy="' + esc(step.code) + '">copy</button></div>'
          + (step.note ? '<p class="step__note">' + esc(step.note) + "</p>" : "")
          + "</div>";
      }).join("")
      + "</div>";
  }

  function requirementsPanel(detail) {
    var list = detail.requirements || [];
    if (!list.length) return "";
    return '<div class="panel"><p class="panel__title">Requirements</p>'
      + '<ul class="req-list">'
      + list.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("")
      + "</ul></div>";
  }

  function linksPanel(detail) {
    var links = (detail.links || []).filter(function (link) { return link && link.url; });
    if (!links.length) return "";
    return '<div class="panel"><p class="panel__title">Links</p><div class="link-list">'
      + links.map(function (link) {
        return '<a href="' + esc(link.url) + '" target="_blank" rel="noopener">'
          + esc(link.label) + '<span aria-hidden="true">↗</span></a>';
      }).join("")
      + "</div></div>";
  }

  function pager(repos, details, current) {
    var order = repos
      .filter(function (repo) { return details[repo.name]; })
      .sort(function (a, b) { return a.featuredRank - b.featuredRank; });
    var position = order.findIndex(function (repo) { return repo.name === current.name; });
    if (position === -1) return "";

    var previous = order[position - 1];
    var next = order[position + 1];

    return '<nav class="pager" aria-label="More case studies">'
      + (previous
        ? '<a href="repo.html?r=' + encodeURIComponent(previous.name) + '"><span>← Previous</span>' + esc(previous.title || previous.name) + "</a>"
        : "<span></span>")
      + (next
        ? '<a href="repo.html?r=' + encodeURIComponent(next.name) + '" style="text-align:right"><span>Next →</span>' + esc(next.title || next.name) + "</a>"
        : "<span></span>")
      + "</nav>";
  }

  function homepageLabel(url) {
    if (/nuget\.org/i.test(url)) return "NuGet package";
    if (/\/(docs|postfixadmin)/i.test(url)) return "Project page";
    return "Project site";
  }

  function render(index, details) {
    var repos = index.repos || [];
    var repo = repos.filter(function (item) { return item.name === slug; })[0];
    var detail = repo ? details.repos[slug] : null;

    if (!repo || !detail) {
      renderNotFound();
      return;
    }

    var title = repo.title || repo.name;
    var pageTitle = title + " — Dwain Snickles";
    var canonical = "https://dwainsnickles.github.io/repo.html?r=" + encodeURIComponent(repo.name);

    document.title = pageTitle;
    setMeta("name", "description", detail.tagline);
    setMeta("name", "robots", "index, follow, max-image-preview:large");
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", detail.tagline);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", "article");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", detail.tagline);

    var canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute("href", canonical);

    var schema = document.getElementById("repoSchema");
    if (schema) {
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareSourceCode",
        name: title,
        description: detail.tagline,
        url: canonical,
        codeRepository: repo.url,
        programmingLanguage: repo.language,
        dateModified: repo.updated,
        keywords: (repo.topics || []).join(", "),
        author: {
          "@type": "Person",
          name: "Dwain Snickles",
          url: "https://dwainsnickles.github.io/about.html"
        }
      });
    }

    if (crumb) crumb.textContent = title;

    var badges = []
      .concat(detail.facts && detail.facts.length ? [] : [])
      .concat([repo.language + " language"])
      .concat(repo.nuget ? ["nuget"] : [])
      .concat(repo.fork ? ["fork"] : []);

    if (head) {
      head.innerHTML = '<p class="eyebrow">' + esc(detail.eyebrow || repo.categoryLabel) + "</p>"
        + "<h1>" + esc(title) + "</h1>"
        + '<p class="detail-tagline">' + esc(detail.tagline) + "</p>"
        + '<p class="mono small" style="color:var(--muted);margin:-0.6rem 0 1.2rem">'
        + esc(repo.name) + " · " + esc(repo.categoryLabel) + " · updated " + esc(prettyDate(repo.updated))
        + "</p>"
        + '<div class="detail-badges">'
        + '<span class="badge badge--cyan">' + esc(repo.language) + "</span>"
        + '<span class="badge">' + STAR + esc(repo.stars) + " stars</span>"
        + '<span class="badge">' + FORK + esc(repo.forks) + " forks</span>"
        + (repo.nuget ? '<span class="badge badge--violet">nuget</span>' : "")
        + (repo.fork ? '<span class="badge badge--violet">fork</span>' : "")
        + "</div>"
        + '<div class="hero__actions">'
        + '<a class="btn btn--solid" href="' + esc(repo.url) + '" target="_blank" rel="noopener">Open on GitHub ↗</a>'
        + '<a class="btn btn--ghost" href="projects.html">← Repository index</a>'
        + (repo.homepage ? '<a class="btn btn--ghost" href="' + esc(repo.homepage) + '" target="_blank" rel="noopener">'
          + esc(homepageLabel(repo.homepage)) + " ↗</a>" : "")
        + "</div>";
    }

    if (!body) return;

    body.innerHTML = '<article class="detail-main">'
      + shotBlock(detail)
      + '<h2 class="detail-h2">Overview</h2>'
      + (detail.summary || []).map(function (paragraph) { return "<p>" + esc(paragraph) + "</p>"; }).join("")
      + highlights(detail)
      + pager(repos, details.repos, repo)
      + '<p class="mono small" style="margin-top:1.6rem"><a href="projects.html">← Back to all '
      + esc(index.totals ? index.totals.repos : "") + " repositories</a></p>"
      + "</article>"
      + '<aside class="detail-side"><div class="detail-side__inner">'
      + specPanel(repo, detail)
      + quickstartPanel(detail)
      + requirementsPanel(detail)
      + linksPanel(detail)
      + "</div></aside>";

    body.addEventListener("click", function (event) {
      var button = event.target.closest(".copy");
      if (!button) return;
      var text = button.getAttribute("data-copy") || "";
      var label = button.textContent;
      var done = function () {
        button.textContent = "copied";
        window.setTimeout(function () { button.textContent = label; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { button.textContent = "select"; });
      } else {
        button.textContent = "select";
      }
    });
  }

  function load(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
      return response.json();
    });
  }

  Promise.all([load("data/repos.json"), load("data/details.json")])
    .then(function (results) {
      render(results[0], results[1]);
    })
    .catch(function () {
      renderNotFound();
    });
})();
