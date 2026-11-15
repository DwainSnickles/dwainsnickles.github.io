/* Generates static repo/<slug>.html case-study pages from data/repos.json + data/details.json.
   Run: node scripts/build-repo-pages.mjs — then commit the repo/ output.
   Ports the render logic in js/repo.js so the static pages match the dynamic ones. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://dwainsnickles.github.io";

const reposIndex = JSON.parse(readFileSync(join(root, "data/repos.json"), "utf8"));
const details = JSON.parse(readFileSync(join(root, "data/details.json"), "utf8"));
const template = readFileSync(join(root, "repo.html"), "utf8");

const slugFor = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// --- chunks lifted from repo.html so header/footer/scripts stay in sync ---
const bodyOpen = template.indexOf("<body>");
const mainOpen = template.indexOf('<main id="main">');
const footerOpen = template.indexOf('<footer class="footer">');
const footerClose = template.indexOf("</footer>") + "</footer>".length;

const headerChunk = template.slice(bodyOpen + "<body>".length, mainOpen);
const footerChunk = template.slice(footerOpen, footerClose);

const prefixAssets = (html) =>
  html
    .replaceAll('href="index.html"', 'href="../index.html"')
    .replaceAll('href="projects.html"', 'href="../projects.html"')
    .replaceAll('href="downloads.html"', 'href="../downloads.html"')
    .replaceAll('href="about.html"', 'href="../about.html"')
    .replaceAll('href="contact.html"', 'href="../contact.html"')
    .replaceAll('href="favicon.svg"', 'href="../favicon.svg"')
    .replaceAll('href="css/', 'href="../css/')
    .replaceAll('src="js/', 'src="../js/')
    .replaceAll('src="data/', 'src="../data/')
    .replaceAll('href="data/', 'href="../data/');

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const prettyDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`;
};

const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>';
const FORK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="19" r="2.4"/><path d="M6 8.4v3.2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8.4M12 14.6V16"/></svg>';

const absUrl = (src) =>
  src.startsWith("http") || src.startsWith("/") ? src : `${ORIGIN}/${src.replace(/^\//, "")}`;

function shotBlock(detail) {
  const shots = detail.shots || [];
  if (!shots.length) {
    return `<figure class="shot shot--empty"><strong>No screenshot published</strong>`
      + `<p>${esc(detail.shotsNote || "This repository ships source rather than pictures — open it on GitHub to see the real thing.")}</p></figure>`;
  }
  return shots.map((shot) => {
    const src = shot.src.startsWith("http") || shot.src.startsWith("/") ? shot.src : `../${shot.src}`;
    return `<figure class="shot"><img src="${esc(src)}" alt="${esc(shot.alt || "")}" loading="lazy" decoding="async">`
    + `<figcaption>${esc(shot.caption || "")}</figcaption></figure>`;
  }).join("");
}

const highlights = (detail) => {
  const items = detail.highlights || [];
  if (!items.length) return "";
  return `<h2 class="detail-h2">What it does</h2><div class="hl-grid">`
    + items.map((i) => `<div class="hl"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join("")
    + "</div>";
};

const specPanel = (repo, detail) => {
  const rows = [["Stars", String(repo.stars)], ["Forks", String(repo.forks)], ["Updated", prettyDate(repo.updated)]]
    .concat((detail.facts || []).map((f) => [f.label, f.value]));
  return `<div class="panel"><p class="panel__title">At a glance</p><dl class="spec">`
    + rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")
    + "</dl></div>";
};

const quickstartPanel = (detail) => {
  const steps = detail.quickstart || [];
  if (!steps.length) return "";
  return `<div class="panel"><p class="panel__title">Quick start</p>`
    + steps.map((s) => `<div class="step"><span class="step__label">${esc(s.label)}</span>`
      + `<div class="code"><pre><code>${esc(s.code)}</code></pre>`
      + `<button class="copy" type="button" data-copy="${esc(s.code)}">copy</button></div>`
      + (s.note ? `<p class="step__note">${esc(s.note)}</p>` : "") + "</div>").join("")
    + "</div>";
};

const changelogPanel = (detail) => {
  const entries = detail.changelog || [];
  if (!entries.length) return "";
  return `<div class="panel"><p class="panel__title">Changelog</p><div class="changelog">`
    + entries.map((e) => `<div class="cl-entry"><div class="cl-entry__head"><span class="cl-version">${esc(e.version)}</span>`
      + `<span class="cl-date">${esc(prettyDate(e.date))}</span></div><ul>`
      + (e.changes || []).map((c) => `<li>${esc(c)}</li>`).join("") + "</ul></div>").join("")
    + "</div></div>";
};

const requirementsPanel = (detail) => {
  const list = detail.requirements || [];
  if (!list.length) return "";
  return `<div class="panel"><p class="panel__title">Requirements</p><ul class="req-list">`
    + list.map((i) => `<li>${esc(i)}</li>`).join("") + "</ul></div>";
};

const linksPanel = (detail) => {
  const links = (detail.links || []).filter((l) => l && l.url);
  if (!links.length) return "";
  return `<div class="panel"><p class="panel__title">Links</p><div class="link-list">`
    + links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span aria-hidden="true">↗</span></a>`).join("")
    + "</div></div>";
};

const pager = (repos, det, current, slugOf) => {
  const order = repos.filter((r) => det[r.name])
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));
  const pos = order.findIndex((r) => r.name === current.name);
  if (pos === -1) return "";
  const prev = order[pos - 1], next = order[pos + 1];
  return `<nav class="pager" aria-label="More case studies">`
    + (prev ? `<a href="${slugOf(prev.name)}.html"><span>← Previous</span>${esc(prev.title || prev.name)}</a>` : "<span></span>")
    + (next ? `<a href="${slugOf(next.name)}.html" style="text-align:right"><span>Next →</span>${esc(next.title || next.name)}</a>` : "<span></span>")
    + "</nav>";
};

const homepageLabel = (url) =>
  /nuget\.org/i.test(url) ? "NuGet package" : /\/(docs|postfixadmin)/i.test(url) ? "Project page" : "Project site";

function headHtml(repo, detail, title, canonical, shotUrl) {
  const desc = detail.tagline;
  const imgAlt = `${title} — ${desc}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: title,
    description: desc,
    url: canonical,
    codeRepository: repo.url,
    programmingLanguage: repo.language,
    dateModified: repo.updated,
    keywords: (repo.topics || []).join(", "),
    author: {
      "@type": "Person",
      name: "Dwain Snickles",
      url: `${ORIGIN}/about.html`,
      sameAs: [
        "https://github.com/DwainSnickles",
        "https://www.linkedin.com/in/dwain-snickles-5a2a4370/",
        "https://www.facebook.com/dwain.snickles/",
        "https://x.com/DwainsSoftware",
        "https://www.nuget.org/packages/Dwain.RibbonLib"
      ]
    }
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Repositories", item: `${ORIGIN}/projects.html` },
      { "@type": "ListItem", position: 3, name: title, item: canonical }
    ]
  };
  const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Dwain Snickles</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Dwain Snickles">
<meta name="theme-color" content="#04060c">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:site_name" content="Dwain Snickles">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)} — Dwain Snickles">
<meta property="og:description" content="${esc(desc)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@DwainsSoftware">
<meta name="twitter:creator" content="@DwainsSoftware">
<meta property="og:image" content="${shotUrl}">
<meta property="og:image:alt" content="${esc(imgAlt)}">
<meta name="twitter:image" content="${shotUrl}">
<meta name="twitter:image:alt" content="${esc(imgAlt)}">
<meta name="twitter:title" content="${esc(title)} — Dwain Snickles">
<meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${json(schema)}</script>
<script type="application/ld+json">${json(crumbs)}</script>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
</head>`;
}

const COPY_SCRIPT = `<script>
document.addEventListener("click", function (event) {
  var button = event.target.closest(".copy");
  if (!button) return;
  var text = button.getAttribute("data-copy") || "";
  var label = button.textContent;
  var done = function () { button.textContent = "copied"; setTimeout(function () { button.textContent = label; }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () { button.textContent = "select"; });
  } else { button.textContent = "select"; }
});
</script>`;

const outDir = join(root, "repo");
mkdirSync(outDir, { recursive: true });

const repos = reposIndex.repos || [];
const written = [];

for (const repo of repos) {
  const detail = details.repos?.[repo.name];
  if (!detail) continue;

  const slug = slugFor(repo.name);
  const title = repo.title || repo.name;
  const canonical = `${ORIGIN}/repo/${slug}.html`;
  const firstShot = (detail.shots || [])[0];
  const shotUrl = firstShot?.src ? absUrl(firstShot.src) : `${ORIGIN}/assets/og-image.png`;

  const head = `<p class="eyebrow">${esc(detail.eyebrow || repo.categoryLabel)}</p>`
    + `<h1>${esc(title)}</h1>`
    + `<p class="detail-tagline">${esc(detail.tagline)}</p>`
    + `<p class="mono small" style="color:var(--muted);margin:-0.6rem 0 1.2rem">`
    + `${esc(repo.name)} · ${esc(repo.categoryLabel)} · updated ${esc(prettyDate(repo.updated))}</p>`
    + `<div class="detail-badges">`
    + `<span class="badge badge--cyan">${esc(repo.language)}</span>`
    + `<span class="badge">${STAR}${esc(repo.stars)} stars</span>`
    + `<span class="badge">${FORK}${esc(repo.forks)} forks</span>`
    + (repo.nuget ? `<span class="badge badge--violet">nuget</span>` : "")
    + (repo.fork ? `<span class="badge badge--violet">fork</span>` : "")
    + `</div>`
    + `<div class="hero__actions">`
    + `<a class="btn btn--solid" href="${esc(repo.url)}" target="_blank" rel="noopener">Open on GitHub ↗</a>`
    + `<a class="btn btn--ghost" href="../projects.html">← Repository index</a>`
    + (repo.homepage ? `<a class="btn btn--ghost" href="${esc(repo.homepage)}" target="_blank" rel="noopener">${esc(homepageLabel(repo.homepage))} ↗</a>` : "")
    + `</div>`
    + `<div class="share" data-share data-url="${esc(canonical)}" data-title="${esc(title)}"></div>`;

  const body = `<article class="detail-main">`
    + shotBlock(detail)
    + `<h2 class="detail-h2">Overview</h2>`
    + (detail.summary || []).map((p) => `<p>${esc(p)}</p>`).join("")
    + highlights(detail)
    + pager(repos, details.repos, repo, slugFor)
    + `<p class="mono small" style="margin-top:1.6rem"><a href="../projects.html">← Back to all ${esc(reposIndex.totals ? reposIndex.totals.repos : "")} repositories</a></p>`
    + `</article>`
    + `<aside class="detail-side"><div class="detail-side__inner">`
    + specPanel(repo, detail)
    + changelogPanel(detail)
    + quickstartPanel(detail)
    + requirementsPanel(detail)
    + linksPanel(detail)
    + `</div></aside>`;

  const page = headHtml(repo, detail, title, canonical, shotUrl)
    + prefixAssets(headerChunk)
    + `<main id="main">
  <section class="page-head detail-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="../projects.html">Repositories</a>
        <a href="../downloads.html">Downloads</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${esc(title)}</span>
      </nav>
      <div id="repoHead">${head}</div>
    </div>
  </section>

  <section class="section--tight" style="padding-top:0">
    <div class="wrap detail-grid" id="detailBody">${body}</div>
  </section>
</main>
`
    + prefixAssets(footerChunk)
    + `
<script src="../js/main.js" defer></script>
<script src="../js/share.js" defer></script>
${COPY_SCRIPT}
</body>
</html>
`;

  // hits counter parity with repo.html: count under the per-repo key
  const hitsTag = `<span class="hits" data-page="repo-${esc(repo.name)}" hidden><span class="hits__count">0</span> <span class="hits__label">case study views</span></span>`;
  writeFileSync(join(outDir, `${slug}.html`), page.replace("<span class=\"hits\" hidden>", hitsTag));
  written.push({ slug, name: repo.name, title });
}

// --- sitemap: drop stale repo/ entries, append the generated pages ---
const sitemapPath = join(root, "sitemap.xml");
let sitemap = readFileSync(sitemapPath, "utf8");
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/dwainsnickles\.github\.io\/repo\/[^<]+<\/loc>[\s\S]*?<\/url>/g, "");
const today = new Date().toISOString().slice(0, 10);
const entries = written.map(({ slug, title }) => `  <url>
    <loc>${ORIGIN}/repo/${slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n");
sitemap = sitemap.replace("</urlset>", entries + "\n</urlset>");
writeFileSync(sitemapPath, sitemap);

console.log(`Wrote ${written.length} pages to repo/:`);
for (const w of written) console.log(`  repo/${w.slug}.html  (${w.name})`);
