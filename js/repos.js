/* Renders the repository index from data/repos.json (features + filters). */
(function () {
  "use strict";

  var LANG_COLORS = {
    "C#": "#178600",
    "PHP": "#4F5D95",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "JavaScript": "#f1e05a",
    "Other": "#7186a3"
  };

  var ICONS = {
    graphics: '<path d="M4 20V4h9l3 3h4v13z"/><path d="M8 12h8M8 16h5"/>',
    system: '<path d="M4 13h4l2-6 3 12 2-6h5"/>',
    media: '<path d="m9 4 11 8-11 8z"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h4v4h-7z"/>',
    updater: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
    security: '<path d="M12 3 4 6.5v5c0 4.6 3.4 8.2 8 9.5 4.6-1.3 8-4.9 8-9.5v-5z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
    ui: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.6 3 14.4 0 18-3-3.6-3-14.4 0-18"/>',
    other: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 4 7.5M12 12v9M12 12l8-4.5"/>'
  };

  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>';
  var FORK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="19" r="2.4"/><path d="M6 8.4v3.2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8.4M12 14.6V16"/></svg>';

  var state = { repos: [], category: "all", language: "all", query: "", sort: "featured" };

  var esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  var icon = function (category) {
    var body = ICONS[category] || ICONS.other;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' + body + "</svg>";
  };

  var langColor = function (language) {
    return LANG_COLORS[language] || LANG_COLORS.Other;
  };

  var relative = function (iso) {
    if (!iso) return "—";
    var then = new Date(iso + "T00:00:00");
    var days = Math.round((Date.now() - then.getTime()) / 86400000);
    if (days < 1) return "today";
    if (days < 30) return days + "d ago";
    if (days < 365) return Math.round(days / 30) + "mo ago";
    var years = Math.round(days / 365);
    return years + "y ago";
  };

  var prettyDate = function (iso) {
    if (!iso) return "—";
    var parts = iso.split("-");
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[Number(parts[1]) - 1] + " " + Number(parts[2]) + ", " + parts[0];
  };

  function repoCard(repo) {
    var topics = (repo.topics || []).slice(0, 3)
      .map(function (topic) { return '<span class="tag">' + esc(topic) + "</span>"; }).join("");

    var badges = "";
    if (repo.nuget) badges += '<span class="repo__badge">nuget</span>';
    if (repo.fork) badges += '<span class="repo__badge">fork</span>';

    var hasStudy = !!repo.featured;
    var href = hasStudy ? "repo.html?r=" + encodeURIComponent(repo.name) : repo.url;
    var attrs = hasStudy ? ' title="Open the case study"' : ' target="_blank" rel="noopener"';

    return '<a class="repo" href="' + esc(href) + '"' + attrs + ">"
      + '<div class="repo__head">'
      + '<span class="repo__icon">' + icon(repo.category) + "</span>"
      + '<span class="repo__name" title="' + esc(repo.name) + '">' + esc(repo.title || repo.name) + "</span>"
      + (badges ? '<span class="repo__badges">' + badges + "</span>" : "")
      + "</div>"
      + '<p class="repo__desc">' + esc(repo.description || "No description yet.") + "</p>"
      + (topics ? '<div class="repo__topics">' + topics + "</div>" : "")
      + '<div class="repo__meta">'
      + '<span class="repo__lang"><i class="dot" style="background:' + langColor(repo.language) + ";color:" + langColor(repo.language) + '"></i>' + esc(repo.language) + "</span>"
      + '<span class="repo__stat" title="Stars">' + STAR + esc(repo.stars) + "</span>"
      + '<span class="repo__stat" title="Forks">' + FORK + esc(repo.forks) + "</span>"
      + '<span style="margin-left:auto">' + esc(relative(repo.updated)) + "</span>"
      + '<span class="repo__go" aria-hidden="true">' + (hasStudy ? "→" : "↗") + "</span>"
      + "</div></a>";
  }

  function renderFeatured(data) {
    var grid = document.getElementById("featuredGrid");
    if (!grid) return;
    var featured = data.repos.filter(function (repo) { return repo.featured; });
    if (!featured.length) featured = data.repos.slice(0, 6);
    grid.innerHTML = featured.slice(0, 6).map(repoCard).join("");
    grid.setAttribute("aria-busy", "false");
  }

  function renderIndexList(data) {
    var list = document.getElementById("indexList");
    if (!list) return;
    var rows = data.repos.slice(0, 8).map(function (repo) {
      var hasStudy = !!repo.featured;
      var href = hasStudy ? "repo.html?r=" + encodeURIComponent(repo.name) : repo.url;
      var attrs = hasStudy ? "" : ' target="_blank" rel="noopener"';
      return '<a class="index-row" href="' + esc(href) + '"' + attrs + ">"
        + '<span class="index-row__name"><i class="dot" style="background:' + langColor(repo.language) + ";color:" + langColor(repo.language) + '"></i><span>' + esc(repo.title || repo.name) + "</span></span>"
        + '<span class="index-row__dim">' + esc(repo.language) + "</span>"
        + '<span class="index-row__dim">' + esc(repo.stars) + " ★</span>"
        + '<span class="index-row__dim">' + esc(prettyDate(repo.updated)) + "</span>"
        + '<span class="index-row__arrow">' + (hasStudy ? "→" : "↗") + "</span></a>";
    }).join("");
    list.innerHTML = '<div class="index-row is-head"><span>Repository</span><span>Language</span><span>Stars</span><span>Updated</span><span></span></div>' + rows;
  }

  function renderTotals(data) {
    var counters = document.querySelectorAll("[data-totals] [data-count]");
    if (!counters.length) return;
    var values = [data.totals.repos, data.totals.stars, null, null];
    counters.forEach(function (el, index) {
      var target = values[index];
      if (index === 0) target = data.totals.repos;
      if (index === 1) target = data.totals.stars;
      if (target == null) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = String(target);
        return;
      }
      var start = performance.now();
      var duration = 900;
      var step = function (now) {
        var progress = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    });
  }

  /* ---------- repositories page ---------- */
  function buildChips(repos) {
    var chips = document.getElementById("chips");
    if (!chips) return;
    var seen = [];
    repos.forEach(function (repo) {
      if (repo.categoryLabel && seen.indexOf(repo.categoryLabel) === -1) seen.push(repo.categoryLabel);
    });
    var options = [{ key: "all", label: "All work", count: repos.length }].concat(
      seen.map(function (label) {
        var key = repos.filter(function (r) { return r.categoryLabel === label; })[0].category;
        var count = repos.filter(function (r) { return r.categoryLabel === label; }).length;
        return { key: key, label: label, count: count };
      })
    );
    chips.innerHTML = options.map(function (option, index) {
      return '<button class="chip" type="button" data-category="' + esc(option.key) + '" aria-pressed="' + (index === 0) + '">'
        + esc(option.label) + " <span style=\"opacity:.55\">" + option.count + "</span></button>";
    }).join("");
  }

  function buildLanguages(repos) {
    var select = document.getElementById("lang");
    if (!select) return;
    var languages = [];
    repos.forEach(function (repo) {
      if (repo.language && languages.indexOf(repo.language) === -1) languages.push(repo.language);
    });
    languages.sort();
    languages.forEach(function (language) {
      var option = document.createElement("option");
      option.value = language;
      option.textContent = "Language: " + language;
      select.appendChild(option);
    });
  }

  function matches(repo) {
    if (state.category !== "all" && repo.category !== state.category) return false;
    if (state.language !== "all" && repo.language !== state.language) return false;
    if (!state.query) return true;
    var haystack = [repo.name, repo.title, repo.description, repo.language, repo.categoryLabel]
      .concat(repo.topics || [])
      .concat(repo.nuget ? ["nuget", "package"] : [])
      .join(" ").toLowerCase();
    return haystack.indexOf(state.query) !== -1;
  }

  function sorted(repos) {
    var list = repos.slice();
    if (state.sort === "stars") {
      list.sort(function (a, b) { return b.stars - a.stars || a.name.localeCompare(b.name); });
    } else if (state.sort === "name") {
      list.sort(function (a, b) { return (a.title || a.name).localeCompare(b.title || b.name); });
    } else if (state.sort === "updated") {
      list.sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); });
    } else {
      list.sort(function (a, b) {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return String(b.updated).localeCompare(String(a.updated));
      });
    }
    return list;
  }

  function renderGrid() {
    var grid = document.getElementById("repoGrid");
    if (!grid) return;
    var visible = sorted(state.repos.filter(matches));
    grid.setAttribute("aria-busy", "false");

    if (!visible.length) {
      grid.innerHTML = '<div class="empty">no repositories match that filter — try clearing the search</div>';
    } else {
      grid.innerHTML = visible.map(repoCard).join("");
    }

    var count = document.getElementById("count");
    if (count) count.textContent = String(visible.length);
  }

  function initFilters(data) {
    var chips = document.getElementById("chips");
    var search = document.getElementById("search");
    var sort = document.getElementById("sort");
    var lang = document.getElementById("lang");

    buildChips(data.repos);
    buildLanguages(data.repos);

    if (chips) {
      chips.addEventListener("click", function (event) {
        var button = event.target.closest(".chip");
        if (!button) return;
        state.category = button.getAttribute("data-category");
        chips.querySelectorAll(".chip").forEach(function (chip) {
          chip.setAttribute("aria-pressed", String(chip === button));
        });
        renderGrid();
      });
    }

    if (search) {
      search.addEventListener("input", function () {
        state.query = search.value.trim().toLowerCase();
        renderGrid();
      });
    }

    if (sort) {
      sort.addEventListener("change", function () {
        state.sort = sort.value;
        renderGrid();
      });
    }

    if (lang) {
      lang.addEventListener("change", function () {
        state.language = lang.value;
        renderGrid();
      });
    }
  }

  function renderTotalsLine(data) {
    var totals = document.getElementById("totals");
    if (!totals) return;
    totals.textContent = data.totals.repos + " public repos · " + data.totals.stars
      + " ★ · " + data.totals.languages + " languages · updated " + prettyDate(data.generated);
  }

  function fail(message) {
    ["featuredGrid", "repoGrid"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="empty">' + esc(message) + "</div>";
    });
    var totals = document.getElementById("totals");
    if (totals) totals.textContent = "index unavailable";
  }

  fetch("data/repos.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      state.repos = (data.repos || []).slice();
      renderFeatured(data);
      renderIndexList(data);
      renderTotals(data);
      renderTotalsLine(data);
      initFilters(data);
      renderGrid();
    })
    .catch(function () {
      fail("Could not load data/repos.json — open this page through a web server, or browse GitHub directly.");
    });
})();
