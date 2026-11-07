# dwainsnickles.github.io

Personal site, served by GitHub Pages. Static HTML, CSS and JavaScript — no build step,
no framework, no trackers.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Hero, featured repositories, recent-push index, capabilities |
| `projects.html` | Full repository index with search, category chips, language and sort |
| `repo.html` | Case study for one repository — `repo.html?r=<repo name>` |
| `about.html` | Profile, working rules, repo timeline, stack |
| `contact.html` | Channel links and a form that composes a prefilled GitHub issue |

## Layout

```
css/style.css            theme, components, responsive + reduced-motion rules
js/main.js               nav, scroll progress, reveals, hero console, canvas, contact form
js/repos.js              renders data/repos.json into the featured grid, index list, filters
js/repo.js               renders one case study from data/repos.json + data/details.json
data/repos.json          generated repository index (committed)
data/details.json        hand-written case studies: summary, highlights, install steps, shots
assets/repos/            screenshots copied from the repositories themselves
assets/og-image.png      social share card (1200x630) for og:image / twitter:image
scripts/fetch-repos.mjs  regenerates data/repos.json from the GitHub API
scripts/fetch-shots.mjs  re-downloads the case-study screenshots
scripts/make-og-image.ps1 redraws assets/og-image.png with GDI+ (Windows PowerShell)
favicon.svg              diamond "D" mark
sitemap.xml              the five public pages, for search engines
robots.txt               allows crawling and points at the sitemap
```

Featured repositories open `repo.html?r=<repo name>`; everything else links straight to
GitHub. A repository only gets a case study when it has an entry in `data/details.json`,
so the page always has real copy, real install steps and screenshots that exist.

## Refresh the repository list

```bash
node scripts/fetch-repos.mjs
node scripts/fetch-shots.mjs
```

Add a `GITHUB_TOKEN` environment variable to avoid the unauthenticated rate limit. Curated
titles, descriptions, categories and the featured order live in the `OVERRIDES`, `FEATURED`
and `EXCLUDE` tables at the top of the script, so a refresh keeps the hand-written copy.

`.github/workflows/refresh-repos.yml` runs the same script every day at 06:17 UTC (and on
demand from the Actions tab), then commits `data/repos.json` if it changed. It uses the
workflow's own `GITHUB_TOKEN`, so there is nothing to configure. Because the script stamps
`generated` with the current date, a run normally produces a small daily commit even when no
repository changed — adjust the cron expression in that file if you would rather have it
less often.

## Local preview

`data/repos.json` is fetched at runtime, so serve the folder over HTTP rather than opening
the files directly:

```bash
python -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000/>.

## Deploy

Commit and push to `main`; GitHub Pages publishes from the repository root.
