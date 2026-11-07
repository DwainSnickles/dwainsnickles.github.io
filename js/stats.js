/* Private stats page: reads every page counter back from Abacus and ranks them. */
(function () {
  "use strict";

  var body = document.getElementById("statsBody");
  if (!body || !window.fetch) return;

  var NS = "dwainsnickles.github.io";
  var API = "https://abacus.jasoncameron.dev/get/" + NS + "/";

  var FIXED = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "projects", label: "Repositories", href: "projects.html" },
    { key: "about", label: "About", href: "about.html" },
    { key: "contact", label: "Contact", href: "contact.html" }
  ];

  /* A missing key answers 404 with {"error":"Key not found"}; a dead service
     fails the request. Both come back as null so the row can say "—" instead of
     pretending the page had no visitors. */
  function read(key) {
    return fetch(API + encodeURIComponent(key), { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        var n = data ? Number(data.value) : NaN;
        return isFinite(n) ? n : 0;
      })
      .catch(function () { return null; });
  }

  function json(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  function row(row, max) {
    var wrap = document.createElement("div");
    wrap.className = "stat";

    var name = document.createElement("span");
    name.className = "stat__name";
    var link = document.createElement("a");
    link.href = row.href;
    link.textContent = row.label;
    name.appendChild(link);
    if (row.caseStudy) {
      var tag = document.createElement("span");
      tag.className = "stat__tag";
      tag.textContent = "case study";
      name.appendChild(tag);
    }

    var bar = document.createElement("span");
    bar.className = "stat__bar";
    var fill = document.createElement("span");
    var pct = (row.value && max) ? Math.max(3, Math.round((row.value / max) * 100)) : 0;
    fill.style.width = pct + "%";
    bar.appendChild(fill);

    var num = document.createElement("span");
    num.className = "stat__n";
    num.textContent = row.value === null ? "—" : row.value.toLocaleString("en-US");

    wrap.appendChild(name);
    wrap.appendChild(bar);
    wrap.appendChild(num);
    return wrap;
  }

  function render(rows) {
    var known = rows.filter(function (item) { return typeof item.value === "number"; });
    var total = known.reduce(function (sum, item) { return sum + item.value; }, 0);
    var max = known.reduce(function (best, item) { return Math.max(best, item.value); }, 0);
    var unreadable = rows.length - known.length;

    rows.sort(function (a, b) {
      var av = a.value === null ? -1 : a.value;
      var bv = b.value === null ? -1 : b.value;
      return bv - av;
    });

    body.textContent = "";
    rows.forEach(function (item) { body.appendChild(row(item, max)); });

    var totalLine = document.getElementById("statsTotal");
    if (totalLine) {
      totalLine.textContent = unreadable
        ? total.toLocaleString("en-US") + " views across " + known.length + " readable counters · "
          + unreadable + " could not be read"
        : total.toLocaleString("en-US") + " views across " + rows.length + " counters";
    }
  }

  Promise.all([json("data/details.json"), json("data/repos.json")]).then(function (results) {
    var details = results[0];
    var index = results[1];
    var titles = {};

    ((index && index.repos) || []).forEach(function (repo) {
      titles[repo.name] = repo.title || repo.name;
    });

    var rows = FIXED.slice();
    var names = (details && details.repos) ? Object.keys(details.repos) : [];

    names.forEach(function (name) {
      rows.push({
        key: "repo-" + name,
        label: titles[name] || name,
        href: "repo.html?r=" + encodeURIComponent(name),
        caseStudy: true
      });
    });

    Promise.all(rows.map(function (item) {
      return read(item.key).then(function (value) {
        return { label: item.label, href: item.href, caseStudy: item.caseStudy, value: value };
      });
    })).then(render);
  });
})();
